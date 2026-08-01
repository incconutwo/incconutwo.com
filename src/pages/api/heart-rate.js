import { cache } from '../../utils/apiCache.js';

export const prerender = false;

export async function GET() {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10'
  };

  const cachedData = cache.get('heart-rate');
  if (cachedData) {
    return new Response(JSON.stringify(cachedData), { status: 200, headers });
  }

  try {
    const response = await fetch('https://hr-dashboard.tnemoroccan.workers.dev/api/hr', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Personal-Website-Node-Server'
      }
    });

    if (!response.ok) {
      throw new Error(`Cloudflare Worker returned ${response.status}`);
    }

    const data = await response.json();
    cache.set('heart-rate', data, 5);

    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (error) {
    console.error('Heart Rate Proxy Error:', error.message);
    return new Response(JSON.stringify({ error: "Failed to fetch Heart Rate" }), { status: 500, headers });
  }
}
