/* src/pages/api/cron/cws-collector.js
 *
 * Autonomous CWS analytics collector — "set and forget" edition.
 *
 *  1. Mirrors a real browser: adopts every Set-Cookie rotation Google sends
 *     and persists the refreshed (TS-stripped) cookie back to Redis, encrypted.
 *  2. Dead-cookie latch: once a cookie fails validation its hash is latched;
 *     future runs skip instantly instead of generating more anti-hijack signal.
 *     The latch auto-clears the moment a NEW cookie hash appears (Redis or ENV).
 *  3. ntfy phone alert on death, so a revocation is noticed within one cycle.
 */
import { Redis } from '@upstash/redis';
import { createHash } from 'node:crypto';
import { encrypt, decrypt } from '../../../utils/crypto.js';

export const prerender = false;
export const maxDuration = 60;

const EXTENSIONS = [
    { id: 'twitter-flags', chromeId: 'dgodabjkaifjlhpcapiohikkklnailla' },
    { id: 'gemini-cleaner', chromeId: 'effcebofhjdoknbmmpbncneoihbbahpg' },
    { id: 'aurora-gemini', chromeId: 'gbmlailhpaofpghhgmicmhpjhiihpifk' },
    { id: 'ai-overview-disabler', chromeId: 'oomhgmbdfkjilamcidkljlhcjogjbkeb' }
];

// Bumped from 122 (early 2024) — an ancient UA next to fresh session cookies
// is another soft anomaly signal. Keep CWS_USER_AGENT / CWS_SEC_CH_UA env
// overrides consistent with this version if you set them.
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

function sha256(str) {
    return createHash('sha256').update(str).digest('hex');
}

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

async function sendPhoneAlert(title, message) {
    const topic = process.env.NTFY_TOPIC || import.meta.env.NTFY_TOPIC;
    if (!topic) return;
    try {
        await fetch(`https://ntfy.sh/${topic}`, {
            method: 'POST',
            body: message.slice(0, 500),
            headers: {
                'Title': title,
                'Priority': 'high',
                'Tags': 'rotating_light,cookie'
            }
        });
    } catch (e) {
        console.error('[CWS Cron] ntfy alert failed:', e.message);
    }
}

function collectSetCookies(headers) {
    if (!headers) return [];
    if (typeof headers.getSetCookie === 'function') return headers.getSetCookie();
    const single = headers.get('set-cookie');
    return single ? [single] : [];
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
        .filter(c => MASTER_COOKIES.has(c.split('=')[0].trim()))
        .join('; ');
}

// mergeCookies: IDENTICAL to your current implementation — carry over as-is.
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

// parseBatchExecute: IDENTICAL — carry over as-is.
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

// aggregateAnalytics:  IDENTICAL — carry over as-is.
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

// calculatePeriodStats: IDENTICAL — carry over as-is.
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
    const startTime = Date.now();

    // ---------- 1. Auth ----------
    const cronSecret = process.env.CRON_SECRET || import.meta.env.CRON_SECRET;
    if (cronSecret) {
        const url = new URL(request.url);
        const queryKey = url.searchParams.get('key') || url.searchParams.get('secret');
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${cronSecret}` && queryKey !== cronSecret) {
            return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
        }
    }

    // ---------- 2. Redis ----------
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || import.meta.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN;
    const redis = (redisUrl && redisToken) ? new Redis({ url: redisUrl, token: redisToken }) : null;

    // ---------- 3. Candidate chain: Redis → ENV ----------
    const candidates = [];
    if (redis) {
        try {
            const rawVal = await redis.get('cws_cookie');
            const decrypted = rawVal ? decrypt(rawVal) : null;
            if (decrypted) candidates.push({ str: decrypted, source: 'redis' });
        } catch (e) {
            console.warn('[CWS Cron] Redis cookie read failed:', e.message);
        }
    }
    const envCookie = (process.env.CWS_COOKIE || import.meta.env.CWS_COOKIE || '')
        .replace(/^["']|["']$/g, '');
    if (envCookie && !candidates.some(c => c.str === envCookie)) {
        candidates.push({ str: envCookie, source: 'env' });
    }
    if (candidates.length === 0) {
        return jsonResponse({ success: false, error: 'No CWS cookie available (Redis empty, ENV empty)' }, 500);
    }

    // ---------- 4. Dead-cookie latch ----------
    // If this exact cookie already failed validation, do NOT hit Google again.
    // Each retry from a fresh Vercel IP reinforces the hijack signal.
    // Pasting a fresh cookie (new hash) auto-clears the latch next run.
    let deadHash = null;
    if (redis) {
        try { deadHash = await redis.get('cws_cookie_dead_hash'); } catch (e) { }
    }
    const live = candidates.filter(c => sha256(c.str) !== deadHash);
    if (live.length === 0) {
        return jsonResponse({
            success: false,
            error: 'Cookie is latched as dead. Update CWS_COOKIE in Redis or ENV to auto-resume — no redeploy needed.'
        }, 401);
    }

    // ---------- 5. Bootstrap: validate + extract at token ----------
    let currentCookiesStr = null;
    let atToken = null;
    let devConsoleId = 'fbe2f16e-d60c-40e4-9887-a0774eff9cc6';
    let usedSource = null;
    let lastFailure = null;

    for (const candidate of live) {
        const safeCookiesStr = filterMasterCookies(candidate.str);
        let res;
        try {
            res = await fetch('https://chrome.google.com/webstore/devconsole', {
                headers: { ...DEFAULT_HEADERS, 'Cookie': safeCookiesStr },
                signal: AbortSignal.timeout(15000)
            });
        } catch (e) {
            if (e.name === 'TimeoutError') {
                console.warn(`[CWS Cron] Bootstrap request timed out after 15s (${candidate.source})`);
            } else {
                console.error(`[CWS Cron] Network error during bootstrap (${candidate.source}):`, e.message);
            }
            continue;
        }

        if (res.url.includes('accounts.google.com')) {
            console.error(`[CWS Cron] ${candidate.source} cookie rejected by Google (login redirect).`);
            if (redis) {
                try { await redis.set('cws_cookie_dead_hash', sha256(candidate.str)); } catch (e) { }
            }
            lastFailure = `${candidate.source} cookie rejected by Google (login redirect)`;
            continue;
        }

        // CRITICAL FIX: adopt rotations from the bootstrap response too —
        // this page load is where Google most often refreshes cookies.
        currentCookiesStr = mergeCookies(safeCookiesStr, collectSetCookies(res.headers));

        const html = await res.text();
        const atMatch = html.match(/"SNlM0e":"([^"]+)"/);
        const consoleMatch = html.match(/\/webstore\/devconsole\/([a-f0-9\-]+)/i);
        if (!atMatch) {
            console.error(`[CWS Cron] Session loaded but SNlM0e missing (${candidate.source}). Treating as dead.`);
            if (redis) {
                try { await redis.set('cws_cookie_dead_hash', sha256(candidate.str)); } catch (e) { }
            }
            lastFailure = `${candidate.source} session loaded but SNlM0e missing`;
            continue;
        }
        atToken = atMatch[1];
        if (consoleMatch) devConsoleId = consoleMatch[1];
        usedSource = candidate.source;
        break;
    }

    if (!atToken) {
        await sendPhoneAlert(
            '🚨 CWS Cookie Invalidated',
            `All cookie candidates failed (${lastFailure || 'unknown reason'}). Export a fresh cookie from the dev console and update CWS_COOKIE — collection auto-resumes.`
        );
        return jsonResponse({
            success: false,
            error: 'All cookie candidates failed validation.'
        }, 401);
    }

    // ---------- 6. Fetch all extensions sequentially ----------
    // Sequential execution with delay mirrors a real browser better.
    // Vercel Hobby now allows up to 60s maxDuration.
    const rangeDays = 90;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const endDays = Math.floor(Date.now() / ONE_DAY);
    const startDays = endDays - rangeDays;

    const processedStats = [];
    let rotationApplied = false;

    try {
        for (let i = 0; i < EXTENSIONS.length; i++) {
            const ext = EXTENSIONS[i];
            if (i > 0) await new Promise(r => setTimeout(r, 500)); // 500ms delay between fetches

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
                    console.warn(`[CWS Cron] Extension fetch timed out after 15s (${ext.id})`);
                } else {
                    console.warn(`[CWS Cron] Network error fetching ${ext.id}:`, e.message);
                }
                continue;
            }

            if (!apiRes.ok) {
                console.warn(`[CWS Cron] HTTP ${apiRes.status} for ${ext.id}`);
                continue;
            }

            const rotated = collectSetCookies(apiRes.headers);
            if (rotated.length > 0) {
                currentCookiesStr = mergeCookies(currentCookiesStr, rotated);
                rotationApplied = true;
            }

            const responseText = await apiRes.text();
            const parsedData = parseBatchExecute(responseText);
            if (parsedData.length === 0) {
                console.warn(`[CWS Cron] No data parsed for ${ext.id}`);
                continue;
            }

            const periodStats = calculatePeriodStats(aggregateAnalytics(parsedData));
            if (redis) {
                await redis.set(`cws_stats_${ext.id}`, { ...periodStats, updatedAt: new Date().toISOString() });
            }
            processedStats.push(ext.id);
        }

        if (processedStats.length === 0) {
            await sendPhoneAlert(
                '⚠️ CWS Collector: zero data',
                'Session bootstrapped but every analytics fetch failed. Cookie may be mid-revocation — export a fresh one.'
            );
            return jsonResponse({ success: false, error: 'Session valid but all extension fetches failed' }, 500);
        }
    } finally {
        // ---------- 7. CRITICAL FIX: persist the rotated cookie back to Redis ----------
        // Executes ALWAYS if bootstrap succeeded, preventing rotation loss on failures.
        if (redis && currentCookiesStr) {
            try {
                await redis.set('cws_cookie', encrypt(filterMasterCookies(currentCookiesStr)));
                await redis.set('cws_cookie_meta', JSON.stringify({
                    lastSuccess: new Date().toISOString(),
                    source: usedSource,
                    rotationApplied,
                    durationMs: Date.now() - startTime
                }));
                await redis.del('cws_cookie_dead_hash'); // clean slate after a healthy run
            } catch (e) {
                console.error('[CWS Cron] Failed to persist rotated cookie:', e.message);
            }
        }
    }

    return jsonResponse({
        success: true,
        processed: processedStats,
        failed: EXTENSIONS.length - processedStats.length,
        cookieSource: usedSource,
        rotationApplied,
        durationMs: Date.now() - startTime
    });
}
