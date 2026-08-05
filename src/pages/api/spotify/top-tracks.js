import { cache } from '../../../utils/apiCache.js';

export const prerender = false;

async function getSpotifyAccessToken() {
  const SPOTIFY_CLIENT_ID = import.meta.env.SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = import.meta.env.SPOTIFY_CLIENT_SECRET;
  const SPOTIFY_REFRESH_TOKEN = import.meta.env.SPOTIFY_REFRESH_TOKEN;

  const cachedToken = cache.get('spotify_access_token');
  if (cachedToken) return cachedToken;

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    throw new Error('Missing Spotify credentials in env');
  }

  const basicAuth = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN
    })
  });

  if (!response.ok) {
      throw new Error(`Spotify auth returned ${response.status}`);
  }

  const data = await response.json();
  const accessToken = data.access_token;
  const expiresIn = data.expires_in || 3600;
  
  cache.set('spotify_access_token', accessToken, expiresIn - 300);
  return accessToken;
}

export async function GET() {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800'
  };

  const cachedData = cache.get('top-tracks');
  if (cachedData) {
    return new Response(JSON.stringify(cachedData), { status: 200, headers });
  }

  const SPOTIFY_CLIENT_ID = import.meta.env.SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = import.meta.env.SPOTIFY_CLIENT_SECRET;
  const SPOTIFY_REFRESH_TOKEN = import.meta.env.SPOTIFY_REFRESH_TOKEN;

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    return new Response(JSON.stringify({ error: "Missing Spotify credentials" }), { status: 500, headers });
  }

  try {
    const accessToken = await getSpotifyAccessToken();
    const response = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
        throw new Error(`Spotify top tracks API returned ${response.status}`);
    }
    
    const data = await response.json();
    const items = data.items;
    
    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: "No top tracks returned" }), { status: 404, headers });
    }

    const tracks = items.map(item => ({
      name: item.name,
      artist: item.artists.map(a => a.name).join(', '),
      albumArt: item.album.images?.[0]?.url || item.album.images?.[1]?.url || null,
      url: item.external_urls?.spotify || null
    }));

    cache.set('top-tracks', tracks, 3600);
    return new Response(JSON.stringify(tracks), { status: 200, headers });
  } catch (error) {
    console.error('Failed to fetch top tracks from Spotify API:', error.message);
    return new Response(JSON.stringify({ error: error.message || "Failed to retrieve top tracks" }), { status: 500, headers });
  }
}
