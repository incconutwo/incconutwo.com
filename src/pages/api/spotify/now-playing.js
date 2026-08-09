import { cache } from '../../../utils/apiCache.js';

export const prerender = false;

let pendingSpotifyRequest = null;

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
    'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20'
  };

  const cachedData = cache.get('now-playing');
  if (cachedData) {
    return new Response(JSON.stringify(cachedData), { status: 200, headers });
  }

  const SPOTIFY_CLIENT_ID = import.meta.env.SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = import.meta.env.SPOTIFY_CLIENT_SECRET;
  const SPOTIFY_REFRESH_TOKEN = import.meta.env.SPOTIFY_REFRESH_TOKEN;

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    return new Response(JSON.stringify({ isPlaying: false, statusText: "Offline", error: "Missing Spotify credentials" }), {
      status: 200,
      headers
    });
  }

  if (pendingSpotifyRequest) {
    try {
      const data = await pendingSpotifyRequest;
      return new Response(JSON.stringify(data), { status: 200, headers });
    } catch (err) {}
  }

  pendingSpotifyRequest = (async () => {
    try {
      const accessToken = await getSpotifyAccessToken();

      const currentResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      let currentData = null;
      if (currentResponse.status !== 204) {
          try { currentData = await currentResponse.json(); } catch(e) {}
      }

      if (currentResponse.status === 204 || !currentData || !currentData.item) {
        const recentResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        const recentData = await recentResponse.json();
        const recentItems = recentData?.items;
        
        if (!recentItems || recentItems.length === 0) {
          return { isPlaying: false, statusText: "Not Playing" };
        }

        const recentTrack = recentItems[0].track;
        const responseData = {
          isPlaying: false,
          statusText: "Recently Played",
          track: recentTrack.name,
          artist: recentTrack.artists.map(a => a.name).join(', '),
          album: recentTrack.album.name,
          albumArt: recentTrack.album.images?.[1]?.url || recentTrack.album.images?.[0]?.url || recentTrack.album.images?.[2]?.url || null,
          spotifyUrl: recentTrack.external_urls?.spotify || null
        };

        cache.set('now-playing', responseData, 10);
        return responseData;
      }

      const item = currentData.item;
      const isPlaying = currentData.is_playing;
      
      const responseData = {
        isPlaying,
        statusText: isPlaying ? "Currently Playing" : "Paused",
        track: item.name,
        artist: item.artists.map(a => a.name).join(', '),
        album: item.album.name,
        albumArt: item.album.images?.[1]?.url || item.album.images?.[0]?.url || item.album.images?.[2]?.url || null,
        spotifyUrl: item.external_urls?.spotify || null,
        progress: currentData.progress_ms || 0,
        duration: item.duration_ms || 1
      };

      cache.set('now-playing', responseData, 10);
      return responseData;
    } finally {
      setTimeout(() => { pendingSpotifyRequest = null; }, 500);
    }
  })();

  try {
    const data = await pendingSpotifyRequest;
    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (error) {
    console.error('Spotify Now Playing Proxy Error:', error.message);
    return new Response(JSON.stringify({
      isPlaying: false,
      statusText: "Offline",
      error: "Failed to fetch from Spotify API"
    }), { status: 200, headers });
  }
}
