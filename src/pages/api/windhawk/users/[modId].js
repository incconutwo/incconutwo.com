import { cache } from '../../../../utils/apiCache.js';

export const prerender = false;

export async function GET({ params }) {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800'
  };

  const modId = params.modId;
  const cacheKey = `windhawk_${modId}`;

  const cachedData = cache.get(cacheKey);
  if (cachedData !== undefined) {
    return new Response(JSON.stringify(cachedData), { status: 200, headers });
  }

  try {
    // Check if full catalog is cached
    let catalog = cache.get('windhawk_full_catalog');
    if (!catalog) {
      const response = await fetch('https://mods.windhawk.net/catalog.json', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Personal-Portfolio-App'
        }
      });

      if (!response.ok) {
        throw new Error(`Windhawk API returned ${response.status}`);
      }

      catalog = await response.json();
      if (catalog && catalog.mods) {
        cache.set('windhawk_full_catalog', catalog, 1800); // cache catalog for 30 minutes
      }
    }

    const mod = catalog?.mods?.[modId];
    if (!mod) {
      return new Response(JSON.stringify({ error: `Mod '${modId}' not found` }), { status: 404, headers });
    }

    const result = {
      users: mod.details?.users || 0,
      rating: mod.details?.rating || 0,
      ratingUsers: mod.details?.ratingUsers || 0,
      stars: mod.details?.githubStars || 0
    };

    cache.set(cacheKey, result, 3600);
    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (error) {
    console.error(`Windhawk Proxy API Error for ${modId}:`, error.message);
    return new Response(JSON.stringify({ error: "Failed to fetch mod info from Windhawk" }), { status: 500, headers });
  }
}
