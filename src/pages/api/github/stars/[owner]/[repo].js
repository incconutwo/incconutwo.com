import { cache } from '../../../../../utils/apiCache.js';

export const prerender = false;

export async function GET({ params }) {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800'
  };

  const { owner, repo } = params;
  const cacheKey = `github_stars_${owner}_${repo}`;

  const cachedStars = cache.get(cacheKey);
  if (cachedStars !== undefined) {
    return new Response(JSON.stringify({ stars: cachedStars }), { status: 200, headers });
  }

  const reqHeaders = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Personal-Portfolio-App'
  };

  if (import.meta.env.GITHUB_TOKEN && import.meta.env.GITHUB_TOKEN.trim()) {
    reqHeaders['Authorization'] = `token ${import.meta.env.GITHUB_TOKEN.trim()}`;
  }

  try {
    let response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: reqHeaders });
    
    if (response.status === 401 || response.status === 403) {
      // Fallback to unauthenticated request if token is invalid or expired
      delete reqHeaders['Authorization'];
      response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: reqHeaders });
    }
    
    if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
    }

    const data = await response.json();
    const stars = data.stargazers_count;
    
    cache.set(cacheKey, stars, 3600);
    return new Response(JSON.stringify({ stars }), { status: 200, headers });
  } catch (error) {
    console.error(`[GitHub API] Error fetching stars for ${owner}/${repo}:`, error.message);
    return new Response(JSON.stringify({ error: 'Failed to fetch GitHub stars' }), { status: 500, headers });
  }
}
