/* src/pages/api/cron/cws-collector.js */
import { Redis } from '@upstash/redis';
import { encrypt, decrypt } from '../../../utils/crypto.js';

export const prerender = false;

const EXTENSIONS = [
  { id: 'twitter-flags', chromeId: 'dgodabjkaifjlhpcapiohikkklnailla' },
  { id: 'gemini-cleaner', chromeId: 'effcebofhjdoknbmmpbncneoihbbahpg' },
  { id: 'aurora-gemini', chromeId: 'gbmlailhpaofpghhgmicmhpjhiihpifk' },
  { id: 'ai-overview-disabler', chromeId: 'oomhgmbdfkjilamcidkljlhcjogjbkeb' }
];

const DEFAULT_HEADERS = {
  'User-Agent': process.env.CWS_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9'
};

if (process.env.CWS_DISABLE_SEC_CH_UA !== 'true') {
  DEFAULT_HEADERS['Sec-CH-UA'] = process.env.CWS_SEC_CH_UA || '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"';
  DEFAULT_HEADERS['Sec-CH-UA-Mobile'] = process.env.CWS_SEC_CH_UA_MOBILE || '?0';
  DEFAULT_HEADERS['Sec-CH-UA-Platform'] = process.env.CWS_SEC_CH_UA_PLATFORM || '"Windows"';
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function filterMasterCookies(cookieStr) {
  const TRANSIENT_COOKIE_PREFIXES = [
    'SIDCC',
    '__Secure-1PSIDCC',
    '__Secure-3PSIDCC',
    'OTZ',
    'NID',
    'enabledapps',
  ];

  return cookieStr
    .split(';')
    .map(c => c.trim())
    .filter(c => {
      const name = c.split('=')[0].trim();
      return !TRANSIENT_COOKIE_PREFIXES.some(prefix => name === prefix || name.startsWith(prefix));
    })
    .join('; ');
}

function parseBatchExecute(responseText) {
  const clean = responseText.replace(/^\)]}'\s*/, '');
  const results = [];
  const lines = clean.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (!line.startsWith('[[')) continue;
    try {
      const chunk = JSON.parse(line);
      if (Array.isArray(chunk)) {
        for (const item of chunk) {
          if (Array.isArray(item) && item[0] === 'wrb.fr' && item[1] === 'WlSRsc') {
            const innerJsonStr = item[2];
            if (innerJsonStr) results.push(JSON.parse(innerJsonStr));
          }
        }
      }
    } catch (err) {}
  }
  return results;
}

function mergeCookies(existingCookiesStr, setCookieHeaders) {
  if (!setCookieHeaders || setCookieHeaders.length === 0) return existingCookiesStr;

  const cookieMap = new Map();
  existingCookiesStr.split(';').forEach(c => {
    const parts = c.split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      cookieMap.set(name, value);
    }
  });

  setCookieHeaders.forEach(header => {
    const cookiePart = header.split(';')[0];
    const parts = cookiePart.split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      cookieMap.set(name, value);
    }
  });

  return Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
}

function aggregateAnalytics(parsedResults) {
  const dailyData = {};
  const metricKeyMap = {
    'OS_VERSION_AND_SERVICE_PACK': 'os',
    'LANGUAGE': 'language',
    'LOCALE': 'locale',
    'COUNTRY': 'country',
    'APP_VERSION': 'app_version'
  };

  for (const result of parsedResults) {
    if (!result || !Array.isArray(result[2])) continue;
    for (const entry of result[2]) {
      if (!Array.isArray(entry) || entry.length < 2) continue;
      const date = entry[0];
      const metrics = entry[1];
      if (!dailyData[date]) {
        dailyData[date] = { date, enabled: 0, disabled: 0, total: 0, weekly_users: 0, breakdowns: {} };
      }
      if (Array.isArray(metrics)) {
        const extractMetrics = (metricsArray) => {
          for (const item of metricsArray) {
            if (!Array.isArray(item)) continue;
            if (item.length === 2 && typeof item[0] === 'number' && Array.isArray(item[1])) {
              extractMetrics(item[1]);
              continue;
            }
            if (item.length >= 3) {
              const [metricName, value, label] = item;
              if (label === 'WEEKLY_USERS' || metricName === 'WEEKLY_USERS') {
                dailyData[date].weekly_users = typeof value === 'number' ? value : 0;
                continue;
              }
              if (metricName === 'ENABLED_AND_DISABLED') {
                if (label === 'Enabled') dailyData[date].enabled = value;
                else if (label === 'Disabled') dailyData[date].disabled = value;
                dailyData[date].total = dailyData[date].enabled + dailyData[date].disabled;
              } else if (typeof metricName === 'string') {
                const cleanMetricKey = metricKeyMap[metricName] || metricName.toLowerCase();
                if (!dailyData[date].breakdowns[cleanMetricKey]) dailyData[date].breakdowns[cleanMetricKey] = {};
                dailyData[date].breakdowns[cleanMetricKey][label] = value;
                if (metricName === 'OS_VERSION_AND_SERVICE_PACK' && typeof value === 'number') {
                  dailyData[date].weekly_users = (dailyData[date].weekly_users || 0) + value;
                }
              }
            }
          }
        };
        extractMetrics(metrics);
      }
    }
  }
  return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
}

function calculatePeriodStats(dailyRecords) {
  if (!dailyRecords || dailyRecords.length === 0) return { daily: [], weekly: [], summary: {} };
  const weeklySeries = [];
  for (let i = 0; i < dailyRecords.length; i++) {
    const startIdx = Math.max(0, i - 6);
    const windowRecords = dailyRecords.slice(startIdx, i + 1);
    const windowAvgEnabled = Math.round(windowRecords.reduce((acc, r) => acc + r.enabled, 0) / windowRecords.length);
    const windowPeakEnabled = Math.max(...windowRecords.map(r => r.enabled));
    weeklySeries.push({
      date: dailyRecords[i].date,
      dailyActiveUsers: dailyRecords[i].enabled,
      weeklyUsersAPI: dailyRecords[i].weekly_users || 0,
      weekly7DayAvg: windowAvgEnabled,
      weekly7DayPeak: windowPeakEnabled,
      daysInWindow: windowRecords.length
    });
  }

  const latestRecord = dailyRecords[dailyRecords.length - 1];
  const firstRecord = dailyRecords[0];
  const recordCount = dailyRecords.length;

  let latestAvailableWeeklyUsers = 0;
  for (let i = dailyRecords.length - 1; i >= 0; i--) {
    if (dailyRecords[i].weekly_users) {
      latestAvailableWeeklyUsers = dailyRecords[i].weekly_users;
      break;
    }
  }

  const record7DaysAgo = recordCount >= 8 ? dailyRecords[recordCount - 8] : firstRecord;
  const growth7dPct = record7DaysAgo.enabled > 0 
    ? (((latestRecord.enabled - record7DaysAgo.enabled) / record7DaysAgo.enabled) * 100).toFixed(2) : 0;
  const record30DaysAgo = recordCount >= 31 ? dailyRecords[recordCount - 31] : firstRecord;
  const growth30dPct = record30DaysAgo.enabled > 0
    ? (((latestRecord.enabled - record30DaysAgo.enabled) / record30DaysAgo.enabled) * 100).toFixed(2) : 0;

  const latestWeeklyObj = weeklySeries[weeklySeries.length - 1];
  return {
    daily: dailyRecords,
    weekly: weeklySeries,
    summary: {
      latestDate: latestRecord.date,
      latestDailyActiveUsers: latestRecord.enabled,
      latestDisabledUsers: latestRecord.disabled,
      latestTotalInstalls: latestRecord.total,
      latestWeeklyUsersAPI: latestAvailableWeeklyUsers,
      latest7DayAverageActiveUsers: latestWeeklyObj ? latestWeeklyObj.weekly7DayAvg : latestRecord.enabled,
      latest7DayPeakActiveUsers: latestWeeklyObj ? latestWeeklyObj.weekly7DayPeak : latestRecord.enabled,
      growth7DaysPercent: Number(growth7dPct),
      growth30DaysPercent: Number(growth30dPct)
    }
  };
}

export async function GET({ request }) {
  const cronSecret = process.env.CRON_SECRET || import.meta.env.CRON_SECRET;

  if (cronSecret) {
    const url = new URL(request.url);
    const queryKey = url.searchParams.get('key') || url.searchParams.get('secret');
    const authHeader = request.headers.get('authorization');

    const isHeaderValid = authHeader === `Bearer ${cronSecret}`;
    const isQueryValid = queryKey === cronSecret;

    if (!isHeaderValid && !isQueryValid) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
    }
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || import.meta.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN;
  
  const redis = (redisUrl && redisToken) ? new Redis({ url: redisUrl, token: redisToken }) : null;

  let storedCookiesStr = null;
  
  // 1. Try Redis first
  if (redis) {
    const rawVal = await redis.get('cws_cookie');
    storedCookiesStr = rawVal ? decrypt(rawVal) : null;
  }

  // 2. Fallback to ENV
  const envCookie = process.env.CWS_COOKIE || import.meta.env.CWS_COOKIE;
  if (!storedCookiesStr && envCookie) {
    storedCookiesStr = envCookie.replace(/^["']|["']$/g, '');
  }

  if (!storedCookiesStr) {
    return new Response(JSON.stringify({ success: false, error: 'No CWS cookie available' }), { status: 500 });
  }

  const safeCookiesStr = filterMasterCookies(storedCookiesStr);

  try {
    const res = await fetch('https://chrome.google.com/webstore/devconsole', {
      headers: {
        ...DEFAULT_HEADERS,
        'Cookie': safeCookiesStr
      }
    });

    if (res.url.includes('accounts.google.com')) {
      return new Response(JSON.stringify({ success: false, error: 'Cookie expired/invalid' }), { status: 401 });
    }

    const html = await res.text();
    const atMatch = html.match(/"SNlM0e":"([^"]+)"/);
    const consoleMatch = html.match(/\/webstore\/devconsole\/([a-f0-9\-]+)/i);

    if (!atMatch) {
      return new Response(JSON.stringify({ success: false, error: 'SNlM0e token missing' }), { status: 401 });
    }

    const atToken = atMatch[1];
    const devConsoleId = consoleMatch ? consoleMatch[1] : 'fbe2f16e-d60c-40e4-9887-a0774eff9cc6';

    const rangeDays = 90;
    const endDateMs = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const endDays = Math.floor(endDateMs / ONE_DAY);
    const startDays = endDays - rangeDays;

    let currentCookiesStr = safeCookiesStr;
    let cookiesWereUpdated = false;
    const processedStats = [];

    for (let i = 0; i < EXTENSIONS.length; i++) {
      const ext = EXTENSIONS[i];
      if (i > 0) await delay(300);

      const baseArgs = [[null, [startDays, endDays]], ext.chromeId, 4];
      const payload = [
        [
          ['WlSRsc', JSON.stringify([baseArgs]), null, "2"],
          ['WlSRsc', JSON.stringify([[...baseArgs, 6]]), null, "4"],
          ['WlSRsc', JSON.stringify([[...baseArgs, 5]]), null, "6"],
          ['WlSRsc', JSON.stringify([[...baseArgs, 1]]), null, "8"],
          ['WlSRsc', JSON.stringify([[...baseArgs, 3]]), null, "10"],
          ['WlSRsc', JSON.stringify([[...baseArgs, 2]]), null, "12"]
        ]
      ];

      const formBody = new URLSearchParams();
      formBody.append('f.req', JSON.stringify(payload));
      formBody.append('at', atToken);

      const googleUrl = 'https://chrome.google.com/_/SnapcatUi/data/batchexecute' +
        `?rpcids=WlSRsc` +
        `&source-path=%2Fwebstore%2Fdevconsole%2F${devConsoleId}%2F${ext.chromeId}%2Fanalytics%2Fusers` +
        `&hl=en&soc-app=630&soc-platform=1&soc-device=1&rt=c`;

      const apiRes = await fetch(googleUrl, {
        method: 'POST',
        headers: {
          ...DEFAULT_HEADERS,
          'Cookie': currentCookiesStr,
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Origin': 'https://chrome.google.com',
          'Referer': `https://chrome.google.com/webstore/devconsole/${devConsoleId}/${ext.chromeId}/analytics/users`
        },
        body: formBody.toString()
      });

      if (!apiRes.ok) continue;

      const responseText = await apiRes.text();
      const setCookies = apiRes.headers.getSetCookie ? apiRes.headers.getSetCookie() : [];
      if (setCookies.length > 0) {
        currentCookiesStr = mergeCookies(currentCookiesStr, setCookies);
        cookiesWereUpdated = true;
      }

      const parsedData = parseBatchExecute(responseText);
      if (parsedData.length === 0) continue;

      const dailyRecords = aggregateAnalytics(parsedData);
      const periodStats = calculatePeriodStats(dailyRecords);
      const storedPayload = { ...periodStats, updatedAt: new Date().toISOString() };

      if (redis) {
        await redis.set(`cws_stats_${ext.id}`, storedPayload);
      }
      processedStats.push(ext.id);
    }

    if (cookiesWereUpdated && redis) {
      await redis.set('cws_cookie', encrypt(filterMasterCookies(currentCookiesStr)));
    }

    return new Response(JSON.stringify({ success: true, processed: processedStats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
