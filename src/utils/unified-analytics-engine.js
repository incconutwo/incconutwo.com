import { cache } from './apiCache.js';
import fs from 'fs';
import path from 'path';
import { Redis } from '@upstash/redis';

// Note: updateEnvFile has been removed. Writing to .env during runtime
// causes Vite's dev server to infinite-loop because it watches .env for changes.

const upstashUrl = import.meta.env.UPSTASH_REDIS_REST_URL || (typeof process !== 'undefined' ? process.env.UPSTASH_REDIS_REST_URL : null);
const upstashToken = import.meta.env.UPSTASH_REDIS_REST_TOKEN || (typeof process !== 'undefined' ? process.env.UPSTASH_REDIS_REST_TOKEN : null);

const redis = (upstashUrl && upstashToken)
  ? new Redis({
      url: upstashUrl,
      token: upstashToken,
    })
  : null;

export const EXTENSION_MATRIX = [
  {
    id: 'twitter-flags',
    name: 'X/Twitter Location Flags, Time & Blocker',
    chromeId: 'dgodabjkaifjlhpcapiohikkklnailla',
    firefoxSlug: 'x-twitter-flags-blocker'
  },
  {
    id: 'gemini-cleaner',
    name: 'Gemini Cleaner - Hide Upgrade Prompts',
    chromeId: 'effcebofhjdoknbmmpbncneoihbbahpg',
    firefoxSlug: null
  },
  {
    id: 'aurora-gemini',
    name: 'Aurora for Gemini',
    chromeId: 'gbmlailhpaofpghhgmicmhpjhiihpifk',
    firefoxSlug: 'aurora-for-gemini-beta'
  },
  {
    id: 'ai-overview-disabler',
    name: 'Classic Search for Google',
    chromeId: 'oomhgmbdfkjilamcidkljlhcjogjbkeb',
    firefoxSlug: null
  }
];

// --- CORE UTILS FROM TEST ZONE ---

export function mergeCookies(existingCookieStr = '', responseHeaders) {
  const cookieMap = new Map();

  if (existingCookieStr) {
    existingCookieStr.split(';').forEach(pair => {
      const idx = pair.indexOf('=');
      if (idx > 0) {
        const key = pair.substring(0, idx).trim();
        const val = pair.substring(idx + 1).trim();
        if (key && val) cookieMap.set(key, val);
      }
    });
  }

  const setCookies = responseHeaders && responseHeaders.getSetCookie ? responseHeaders.getSetCookie() : [];
  setCookies.forEach(setCookieStr => {
    const mainPart = setCookieStr.split(';')[0];
    const idx = mainPart.indexOf('=');
    if (idx > 0) {
      const key = mainPart.substring(0, idx).trim();
      const val = mainPart.substring(idx + 1).trim();
      if (key && val) cookieMap.set(key, val);
    }
  });

  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

// ============================================================================
// CHROME WEB STORE TELEMETRY
// Handled asynchronously by GitHub Actions + Playwright (reads from Redis)
// ============================================================================

// ============================================================================
// FIREFOX AMO (amo-analytics.js)
// ============================================================================

function formatDate(dateObj) {
  const yyyy = dateObj.getUTCFullYear();
  const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

export async function getAmoAnalytics({ cookie, csrf, extensionSlug, rangeDays = 90, endDate }) {
  if (!extensionSlug) throw new Error('Extension Slug is required.');

  let activeCookie = (cookie || '').trim();

  let endDateObj = endDate ? new Date(endDate) : new Date();
  if (isNaN(endDateObj.getTime())) endDateObj = new Date();

  const startDateObj = new Date(endDateObj.getTime());
  startDateObj.setUTCDate(startDateObj.getUTCDate() - rangeDays);

  const start = formatDate(startDateObj);
  const end = formatDate(endDateObj);

  const metrics = ['usage', 'versions', 'os'];
  const dailyData = {};

  for (const metric of metrics) {
    const url = `https://addons.mozilla.org/en-US/firefox/addon/${extensionSlug}/statistics/${metric}-day-${start}-${end}.json`;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': `https://addons.mozilla.org/en-US/firefox/addon/${extensionSlug}/statistics/`,
      'X-Requested-With': 'XMLHttpRequest',
    };
    
    if (activeCookie) headers['Cookie'] = activeCookie;
    if (csrf) headers['X-CSRFToken'] = csrf;

    const response = await fetch(url, { headers });
    activeCookie = mergeCookies(activeCookie, response.headers);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AMO API error (${response.status}) for ${metric}: ${errText.substring(0, 200)}`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      data.forEach(item => {
        const dateStr = item.date;
        if (!dailyData[dateStr]) {
          dailyData[dateStr] = {
            date: dateStr,
            enabled: 0,
            disabled: 0,
            total: 0,
            weekly_users: 0,
            breakdowns: { os: {}, app_version: {} }
          };
        }
        
        if (metric === 'usage') {
          dailyData[dateStr].enabled = item.count;
          dailyData[dateStr].total = item.count;
        } else if (metric === 'versions') {
          dailyData[dateStr].breakdowns.app_version = item.data || {};
        } else if (metric === 'os') {
          dailyData[dateStr].breakdowns.os = item.data || {};
        }
      });
    }
  }

  const daily = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

  const latestRecord = daily.length > 0 ? daily[daily.length - 1] : { date: 'N/A', enabled: 0, total: 0 };
  const firstRecord = daily.length > 0 ? daily[0] : { enabled: 0 };
  const recordCount = daily.length;

  const record7DaysAgo = recordCount >= 8 ? daily[recordCount - 8] : firstRecord;
  const growth7dPct = record7DaysAgo.enabled > 0 
    ? (((latestRecord.enabled - record7DaysAgo.enabled) / record7DaysAgo.enabled) * 100).toFixed(2)
    : 0;

  const record30DaysAgo = recordCount >= 31 ? daily[recordCount - 31] : firstRecord;
  const growth30dPct = record30DaysAgo.enabled > 0
    ? (((latestRecord.enabled - record30DaysAgo.enabled) / record30DaysAgo.enabled) * 100).toFixed(2)
    : 0;

  for (let i = 0; i < daily.length; i++) {
    const startIdx = Math.max(0, i - 6);
    const windowRecords = daily.slice(startIdx, i + 1);
    const windowAvg = Math.round(windowRecords.reduce((a, r) => a + r.enabled, 0) / windowRecords.length);
    daily[i].weekly_users = windowAvg;
  }

  const latestWeeklyUsers = daily.length > 0 ? daily[daily.length - 1].weekly_users : latestRecord.enabled;

  return {
    daily,
    summary: {
      latestDate: latestRecord.date,
      latestDailyActiveUsers: latestRecord.enabled,
      latestDisabledUsers: 0,
      latestTotalInstalls: latestRecord.total,
      latestWeeklyUsersAPI: latestWeeklyUsers,
      growth7DaysPercent: Number(growth7dPct),
      growth30DaysPercent: Number(growth30dPct)
    },
    updatedCookie: activeCookie
  };
}

// ============================================================================
// TIER 3: ENGINE CONTROLLER (NO FALLBACKS)
// ============================================================================

export class UnifiedExtensionAnalyticsEngine {
  constructor(config = {}) {
    this.cwsCookie = (config.cwsCookie || process.env.CWS_COOKIE || '').replace(/^["']|["']$/g, '');
    this.amoCookie = (config.amoCookie || process.env.AMO_COOKIE || '').replace(/^["']|["']$/g, '');
    this.amoCsrf = (config.amoCsrf || process.env.AMO_CSRF || '').replace(/^["']|["']$/g, '');
    this.cacheTtlSeconds = config.cacheTtlSeconds || 6 * 60 * 60; // 6 hours
  }

  async init() {
    if (redis) {
      try {
        const storedCws = await redis.get('cws_cookie');
        if (storedCws) this.cwsCookie = storedCws;
        
        const storedAmo = await redis.get('amo_cookie');
        if (storedAmo) this.amoCookie = storedAmo;
      } catch (err) {
        console.warn('[KV] Failed to load cookies from Redis:', err.message);
      }
    }
  }

  async getExtensionAnalytics(extConfig) {
    const cacheKey = `unified_analytics_${extConfig.id}`;
    const cached = cache.get(cacheKey);
    if (cached) return { ...cached, isCached: true };

    let chromeStats = null;
    let firefoxStats = null;
    let cwsSessionValid = false;
    let amoSessionValid = false;

    // --- 1. CHROME WEB STORE TELEMETRY (from Redis) ---
    if (extConfig.chromeId) {
      if (redis) {
        try {
          const storedStats = await redis.get(`cws_stats_${extConfig.id}`);
          if (storedStats) {
            chromeStats = typeof storedStats === 'string' ? JSON.parse(storedStats) : storedStats;
            cwsSessionValid = true;
          }
        } catch (e) {
          console.warn(`[CWS Redis Failed] ${extConfig.name}: ${e.message}`);
        }
      }
    }

    // --- 2. FIREFOX AMO TELEMETRY ---
    if (extConfig.firefoxSlug) {
      if (this.amoCookie) {
        try {
          firefoxStats = await getAmoAnalytics({ cookie: this.amoCookie, csrf: this.amoCsrf, extensionSlug: extConfig.firefoxSlug });
          amoSessionValid = true;
          if (firefoxStats.updatedCookie && firefoxStats.updatedCookie !== this.amoCookie) {
            this.amoCookie = firefoxStats.updatedCookie;
            if (redis) await redis.set('amo_cookie', this.amoCookie);
          }
        } catch (e) {
          console.warn(`[AMO Tier-1 Failed] ${extConfig.name}: ${e.message}`);
        }
      }
    }

    // --- 3. UNIFIED CROSS-PLATFORM CALCULATION ---
    const chromeWeekly = chromeStats?.summary?.latestWeeklyUsersAPI || 0;
    const firefoxDaily = firefoxStats?.summary?.latestDailyActiveUsers || 0;
    const chromeDaily = chromeStats?.summary?.latestDailyActiveUsers || 0;

    const totalWeeklyUsers = chromeWeekly + firefoxDaily;
    const totalDailyActiveUsers = chromeDaily + firefoxDaily;

    const unifiedResult = {
      id: extConfig.id,
      name: extConfig.name,
      chromeId: extConfig.chromeId,
      firefoxSlug: extConfig.firefoxSlug,
      metrics: {
        totalWeeklyUsers,
        totalDailyActiveUsers,
        chromeWeeklyUsers: chromeWeekly,
        firefoxWeeklyUsers: firefoxDaily,
        chromeDailyActiveUsers: chromeDaily,
        firefoxDailyActiveUsers: firefoxDaily,
        platformShare: {
          chromePercent: totalWeeklyUsers > 0 ? Number(((chromeWeekly / totalWeeklyUsers) * 100).toFixed(1)) : 0,
          firefoxPercent: totalWeeklyUsers > 0 ? Number(((firefoxDaily / totalWeeklyUsers) * 100).toFixed(1)) : 0
        }
      },
      sources: {
        chrome: chromeStats ? 'cws-devconsole' : 'none',
        firefox: firefoxStats ? 'amo-devconsole' : 'none'
      },
      sessionDiagnostics: {
        cwsCookieValid: cwsSessionValid,
        amoCookieValid: amoSessionValid
      },
      updatedAt: new Date().toISOString()
    };

    cache.set(cacheKey, unifiedResult, this.cacheTtlSeconds);
    return { ...unifiedResult, isCached: false };
  }

  async getAllPortfolioStats() {
    const cacheKey = 'portfolio_global_analytics_summary';
    const cached = cache.get(cacheKey);
    if (cached) return { ...cached, isCached: true };

    const extensionsResults = [];
    let globalWeeklyUsers = 0;
    let globalDailyActiveUsers = 0;
    let cwsActiveSessions = 0;
    let amoActiveSessions = 0;

    for (const extConfig of EXTENSION_MATRIX) {
      const result = await this.getExtensionAnalytics(extConfig);
      extensionsResults.push(result);

      globalWeeklyUsers += result.metrics.totalWeeklyUsers;
      globalDailyActiveUsers += result.metrics.totalDailyActiveUsers;

      if (result.sessionDiagnostics.cwsCookieValid) cwsActiveSessions++;
      if (result.sessionDiagnostics.amoCookieValid) amoActiveSessions++;
    }

    const globalSummary = {
      success: true,
      globalTotals: {
        totalCrossPlatformWeeklyUsers: globalWeeklyUsers,
        totalCrossPlatformDailyActiveUsers: globalDailyActiveUsers,
        totalTrackedExtensions: EXTENSION_MATRIX.length,
        formattedWeeklyUsersText: `${globalWeeklyUsers.toLocaleString()}+ active users`
      },
      sessionHealth: {
        cwsSessionStatus: cwsActiveSessions > 0 ? 'valid' : (this.cwsCookie ? 'expired_or_blocked' : 'missing_cookie'),
        amoSessionStatus: amoActiveSessions > 0 ? 'valid' : (this.amoCookie ? 'expired_or_blocked' : 'missing_cookie')
      },
      extensions: extensionsResults,
      updatedAt: new Date().toISOString()
    };

    cache.set(cacheKey, globalSummary, this.cacheTtlSeconds);
    return { ...globalSummary, isCached: false };
  }
}
