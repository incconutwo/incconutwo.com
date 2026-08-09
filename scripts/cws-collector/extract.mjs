import { Redis } from '@upstash/redis';
import { createHash } from 'node:crypto';
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

const CHROME_MAJOR = process.env.CWS_CHROME_MAJOR || '150';
const DEFAULT_HEADERS = {
    'User-Agent': process.env.CWS_USER_AGENT ||
        `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME_MAJOR}.0.0.0 Safari/537.36`,
    'Accept-Language': 'en-US,en;q=0.9'
};
if (process.env.CWS_DISABLE_SEC_CH_UA !== 'true') {
    DEFAULT_HEADERS['Sec-CH-UA'] = process.env.CWS_SEC_CH_UA ||
        `"Chromium";v="${CHROME_MAJOR}", "Not(A:Brand";v="24", "Google Chrome";v="${CHROME_MAJOR}"`;
    DEFAULT_HEADERS['Sec-CH-UA-Mobile'] = '?0';
    DEFAULT_HEADERS['Sec-CH-UA-Platform'] = '"Windows"';
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function collectSetCookies(headers) {
    if (!headers) return [];
    if (typeof headers.getSetCookie === 'function') return headers.getSetCookie();
    const single = headers.get('set-cookie');
    return single ? [single] : [];
}

async function sendPhoneAlert(title, message) {
    const topic = process.env.NTFY_TOPIC;
    if (!topic) return;
    try {
        await fetch(`https://ntfy.sh/${topic}`, {
            method: 'POST',
            body: message.slice(0, 500),
            headers: { 'Title': title, 'Priority': 'high', 'Tags': 'rotating_light,cookie' }
        });
    } catch (e) {
        console.error('ntfy alert failed:', e.message);
    }
}

/**
 * Strips obsolete cookies but RETAINS Google's required Timestamp (TS) and 
 * Crypto-Cookies (CC). Historically we stripped these for IP-safety, but 
 * Google now strictly enforces their presence for Dev Console access. 
 * We now rely on continuous Redis persistence to keep them refreshed.
 */
function filterMasterCookies(cookieStr) {
    const MASTER_COOKIES = new Set([
        'SID', 'HSID', 'SSID', 'APISID', 'SAPISID',
        '__Secure-1PSID', '__Secure-3PSID',
        '__Secure-1PAPISID', '__Secure-3PAPISID',
        'OSID', '__Secure-OSID', 'AEC',
        'S', 'NID', '__Secure-STRP',
        'SIDCC', '__Secure-1PSIDCC', '__Secure-3PSIDCC',
        '__Secure-1PSIDTS', '__Secure-1PSIDRTS',
        '__Secure-3PSIDTS', '__Secure-3PSIDRTS',
        'OTZ', 'enabledapps.uploader'
    ]);

  return cookieStr
    .split(';')
    .map(c => c.trim())
    .filter(c => {
      const name = c.split('=')[0].trim();
      return MASTER_COOKIES.has(name);
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
  // Parse existing cookies
  existingCookiesStr.split(';').forEach(c => {
    const parts = c.split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      cookieMap.set(name, value);
    }
  });

  // Parse and merge Set-Cookie headers
  setCookieHeaders.forEach(header => {
    // The actual cookie is everything before the first semicolon
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

async function main() {
  const startTime = Date.now();
  console.log("Starting Native CWS Collector (Zero-Playwright)...");
  
  if (redis && process.env.CWS_WATCHDOG !== 'false') {
      try {
          const meta = await redis.get('cws_cookie_meta');
          const parsed = typeof meta === 'string' ? JSON.parse(meta) : meta;
          if (parsed?.lastSuccess && Date.now() - new Date(parsed.lastSuccess).getTime() < 20 * 3600 * 1000) {
              console.log('✅ Primary Vercel collector is healthy — watchdog skipping.');
              process.exit(0);
          }
      } catch (e) {
          console.warn('⚠️ Failed to read cws_cookie_meta, proceeding with collection:', e.message);
      }
  }

  let storedCookiesStr = null;
  
  // 1. Try to get the actively refreshed cookie from Redis first
  if (redis) {
    try {
      const rawVal = await redis.get('cws_cookie');
      storedCookiesStr = rawVal ? decrypt(rawVal) : null;
    } catch (e) {
      console.warn('⚠️ Failed to read cws_cookie from Redis:', e.message);
    }
  }

  // 2. Fallback to the static ENV variable if Redis is empty (e.g. first run)
  if (!storedCookiesStr && process.env.CWS_COOKIE) {
    storedCookiesStr = process.env.CWS_COOKIE.replace(/^["']|["']$/g, '');
  }

  if (!storedCookiesStr) {
    console.error("❌ No cws_cookie found in Redis or process.env.");
    process.exit(1);
  }

  const safeCookiesStr = filterMasterCookies(storedCookiesStr);
  const masterCookieCount = safeCookiesStr.split(';').filter(c => c.trim()).length;
  console.log(`🔐 Using ${masterCookieCount} cookies.`);

  // Latch parity: never re-present a cookie the primary already flagged dead
  if (redis) {
      try {
          const deadHash = await redis.get('cws_cookie_dead_hash');
          if (deadHash && createHash('sha256').update(storedCookiesStr).digest('hex') === deadHash) {
              console.log('⏭️ Cookie is latched dead by the primary collector — skipping.');
              process.exit(0);
          }
      } catch (e) { }
  }

  try {
    console.log("Fetching CWS Dev Console session token...");
    const res = await fetch('https://chrome.google.com/webstore/devconsole', {
      headers: {
        ...DEFAULT_HEADERS,
        'Cookie': safeCookiesStr
      },
      signal: AbortSignal.timeout(15000)
    });

    if (res.url.includes('accounts.google.com')) {
      console.error("❌ Cookie is invalid or expired. Google redirected to login.");
      if (redis) {
          try {
              await redis.set('cws_cookie_dead_hash', createHash('sha256').update(storedCookiesStr).digest('hex'));
          } catch (e) { }
      }
      await sendPhoneAlert(
          '🚨 CWS Cookie Invalidated (watchdog)',
          'Watchdog run: the CWS cookie was rejected by Google. Export a fresh cookie and update CWS_COOKIE — collection auto-resumes.'
      );
      process.exit(1);
    }

    const html = await res.text();
    const atMatch = html.match(/"SNlM0e":"([^"]+)"/);
    const consoleMatch = html.match(/\/webstore\/devconsole\/([a-f0-9\-]+)/i);

    if (!atMatch) {
      console.error("❌ Could not extract SNlM0e token. CWS Cookie may have expired.");
      if (redis) {
          try {
              await redis.set('cws_cookie_dead_hash', createHash('sha256').update(storedCookiesStr).digest('hex'));
          } catch (e) { }
      }
      await sendPhoneAlert(
          '🚨 CWS Cookie Invalidated (watchdog)',
          'Watchdog run: SNlM0e token missing. Cookie may be expired or page structure changed.'
      );
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
    let currentCookiesStr = mergeCookies(safeCookiesStr, collectSetCookies(res.headers));
    let cookiesWereUpdated = currentCookiesStr !== safeCookiesStr;

    try {
      for (let i = 0; i < EXTENSIONS.length; i++) {
        const ext = EXTENSIONS[i];
        if (i > 0) await delay(500);

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

        let apiRes;
        try {
          apiRes = await fetch(googleUrl, {
            method: 'POST',
            headers: {
              ...DEFAULT_HEADERS,
              'Cookie': currentCookiesStr,
              'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
              'Origin': 'https://chrome.google.com',
              'Referer': `https://chrome.google.com/webstore/devconsole/${devConsoleId}/${ext.chromeId}/analytics/users`
            },
            body: formBody.toString(),
            signal: AbortSignal.timeout(15000)
          });
        } catch (e) {
          if (e.name === 'TimeoutError') {
              console.error(`❌ Extension fetch timed out after 15s (${ext.id})`);
          } else {
              console.error(`❌ Network error fetching ${ext.id}:`, e.message);
          }
          hasError = true;
          continue;
        }

        if (!apiRes.ok) {
          console.error(`❌ API returned status ${apiRes.status}`);
          hasError = true;
          continue;
        }

        const responseText = await apiRes.text();

        const setCookies = collectSetCookies(apiRes.headers);
        if (setCookies.length > 0) {
          currentCookiesStr = mergeCookies(currentCookiesStr, setCookies);
          cookiesWereUpdated = true;
        }

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
    } finally {
      if (redis && cookiesWereUpdated && currentCookiesStr) {
          try {
              await redis.set('cws_cookie', encrypt(filterMasterCookies(currentCookiesStr)));
              console.log('🔁 Rotated master cookies persisted back to Redis.');
          } catch (e) {
              console.error('❌ Failed to persist rotated cookies:', e.message);
          }
      }
    }

    if (redis && !hasError) {
      try {
        await redis.set('cws_cookie_meta', JSON.stringify({
          lastSuccess: new Date().toISOString(),
          source: 'watchdog',
          rotationApplied: cookiesWereUpdated,
          durationMs: Date.now() - startTime
        }));
      } catch (e) {
        console.warn('⚠️ Failed to write watchdog meta:', e.message);
      }
    }

    console.log(`\n✅ Collection complete in ${((Date.now() - startTime) / 1000).toFixed(2)}s.`);
    
    if (hasError) {
      console.error('❌ One or more extensions failed to fetch stats.');
      await sendPhoneAlert(
        '⚠️ CWS Watchdog: partial failure',
        `Watchdog completed with errors. ${EXTENSIONS.length} extensions attempted, some failed. Check GitHub Actions logs.`
      );
      process.exit(1);
    }

  } catch (err) {
    console.error("❌ Fatal Error in script:");
    console.error(err);
    process.exit(1);
  }
}

main();
