import { cache } from '../../../utils/apiCache.js';

export const prerender = false;

export async function GET() {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800'
  };

  const username = import.meta.env.LICHESS_USERNAME;
  if (!username) {
    return new Response(JSON.stringify({ error: "Lichess username not configured." }), { status: 500, headers });
  }

  const cacheKey = 'lichess_stats';
  const cachedData = cache.get(cacheKey);
  if (cachedData !== undefined) {
    return new Response(JSON.stringify(cachedData), { status: 200, headers });
  }

  try {
    const response = await fetch(`https://lichess.org/api/user/${username}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Personal-Website-Node-Server'
      }
    });
    
    if (!response.ok) {
        throw new Error(`Lichess API returned ${response.status}`);
    }
    const data = await response.json();

    const parsed = {
      blitz: data.perfs?.blitz?.rating || 0,
      rapid: data.perfs?.rapid?.rating || 0,
      games: data.count?.all || 0
    };

    cache.set(cacheKey, parsed, 3600);
    return new Response(JSON.stringify(parsed), { status: 200, headers });
  } catch (error) {
    console.error('Lichess Proxy API Error:', error.message);
    return new Response(JSON.stringify({ error: "Failed to fetch stats from Lichess." }), { status: 500, headers });
  }
}
