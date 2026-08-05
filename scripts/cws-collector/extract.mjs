import { Redis } from '@upstash/redis';
import { encrypt, decrypt } from '../../src/utils/crypto.js';

const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const EXTENSIONS = [
  { id: 'twitter-flags', chromeId: 'dgodabjkaifjlhpcapiohikkklnailla' },
  { id: 'gemini-cleaner', chromeId: 'effcebofhjdoknbmmpbncneoihbbahpg' },
  { id: 'aurora-gemini', chromeId: 'gbmlailhpaofpghhgmicmhpjhiihpifk' },
  { id: 'ai-overview-disabler', chromeId: 'oomhgmbdfkjilamcidkljlhcjogjbkeb' }
];

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-CH-UA': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
  'Sec-CH-UA-Mobile': '?0',
  'Sec-CH-UA-Platform': '"Windows"'
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

async function main() {
  const startTime = Date.now();
  console.log("Starting Native CWS Collector (Zero-Playwright)...");
  
  let storedCookiesStr = null;
  if (process.env.CWS_COOKIE) {
    storedCookiesStr = process.env.CWS_COOKIE.replace(/^["']|["']$/g, '');
  }
  if (!storedCookiesStr && redis) {
    const rawVal = await redis.get('cws_cookie');
    storedCookiesStr = rawVal ? decrypt(rawVal) : null;
  }

  if (!storedCookiesStr) {
    console.error("❌ No cws_cookie found in Redis or process.env.");
    process.exit(1);
  }

  try {
    console.log("Fetching CWS Dev Console session token...");
    const res = await fetch('https://chrome.google.com/webstore/devconsole', {
      headers: {
        ...DEFAULT_HEADERS,
        'Cookie': storedCookiesStr
      }
    });

    if (res.url.includes('accounts.google.com')) {
      console.error("❌ Cookie is invalid or expired. Google redirected to login.");
      process.exit(1);
    }

    const html = await res.text();
    const atMatch = html.match(/"SNlM0e":"([^"]+)"/);
    const consoleMatch = html.match(/\/webstore\/devconsole\/([a-f0-9\-]+)/i);

    if (!atMatch) {
      console.error("❌ Could not extract SNlM0e token. CWS Cookie may have expired.");
      process.exit(1);
    }

    const atToken = atMatch[1];
    const devConsoleId = consoleMatch ? consoleMatch[1] : 'fbe2f16e-d60c-40e4-9887-a0774eff9cc6';
    
    console.log(`✅ Session Valid. atToken found. consoleId: ${devConsoleId}`);

    const rangeDays = 90;
    const endDateMs = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const endDays = Math.floor(endDateMs / ONE_DAY);
    const startDays = endDays - rangeDays;

    let hasError = false;

    // Fetch extensions with a subtle 150ms delay for human-like request pacing
    for (let i = 0; i < EXTENSIONS.length; i++) {
      const ext = EXTENSIONS[i];
      if (i > 0) await delay(150);

      console.log(`\nFetching stats for ${ext.id} (${ext.chromeId})...`);
      
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
          'Cookie': storedCookiesStr,
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Origin': 'https://chrome.google.com',
          'Referer': `https://chrome.google.com/webstore/devconsole/${devConsoleId}/${ext.chromeId}/analytics/users`
        },
        body: formBody.toString()
      });

      if (!apiRes.ok) {
        console.error(`❌ API returned status ${apiRes.status}`);
        hasError = true;
        continue;
      }

      const responseText = await apiRes.text();
      const parsedData = parseBatchExecute(responseText);
      
      if (parsedData.length === 0) {
        console.error(`⚠️ No data parsed for ${ext.id}.`);
        hasError = true;
        continue;
      }

      const dailyRecords = aggregateAnalytics(parsedData);
      const periodStats = calculatePeriodStats(dailyRecords);
      
      const storedPayload = {
         ...periodStats,
         updatedAt: new Date().toISOString()
      };

      if (redis) {
        await redis.set(`cws_stats_${ext.id}`, storedPayload);
        console.log(`✅ Saved stats to Redis for ${ext.id}`);
      } else {
        console.log(`✅ Fetched stats for ${ext.id} (Redis disabled):`, JSON.stringify(storedPayload).substring(0, 80) + '...');
      }
    }

    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Collection complete in ${durationSeconds}s. Preserving master authentication cookie.`);
    
    if (hasError) {
      console.error('❌ One or more extensions failed to fetch stats.');
      process.exit(1);
    }

  } catch (err) {
    console.error("❌ Fatal Error in script:");
    console.error(err);
    process.exit(1);
  }
}

main();
