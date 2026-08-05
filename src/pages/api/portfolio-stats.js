/* src/pages/api/portfolio-stats.js */
import { UnifiedExtensionAnalyticsEngine } from '../../utils/unified-analytics-engine.js';

export const prerender = false;

export async function GET({ request }) {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=10800' // Edge CDN cache 6 hours
  };


  try {
    const engine = new UnifiedExtensionAnalyticsEngine({
      cwsCookie: import.meta.env.CWS_COOKIE,
      amoCookie: import.meta.env.AMO_COOKIE,
      amoCsrf: import.meta.env.AMO_CSRF
    });

    await engine.init();
    const data = await engine.getAllPortfolioStats();
    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (error) {
    console.error('Unified Portfolio Stats Error:', error.message);
    
    // Graceful Fallback if anything breaks
    const fallback = {
      success: true,
      isFallback: true,
      globalTotals: {
        totalCrossPlatformWeeklyUsers: 1400,
        formattedWeeklyUsersText: '1,400+ active users'
      }
    };

    return new Response(JSON.stringify(fallback), { status: 200, headers });
  }
}
