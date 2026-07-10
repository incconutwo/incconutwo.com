const express = require('express');
const axios = require('axios');
const cache = require('../utils/cache');

const router = express.Router();

// Spotify Credentials
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

let pendingSpotifyRequest = null;

/**
 * Helper: Retrieve a valid Spotify access token, using node-cache to store it
 */
async function getSpotifyAccessToken() {
  const cachedToken = cache.get('spotify_access_token');
  if (cachedToken) return cachedToken;

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    throw new Error('Missing Spotify credentials in env');
  }

  const response = await axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    data: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN
    }).toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
    }
  });

  const accessToken = response.data.access_token;
  const expiresIn = response.data.expires_in || 3600;
  cache.set('spotify_access_token', accessToken, expiresIn - 300);
  return accessToken;
}

/**
 * Endpoint: /now-playing (mounted on /api/spotify)
 */
router.get('/now-playing', async (req, res) => {
  const cachedData = cache.get('now-playing');
  if (cachedData) return res.json(cachedData);

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    console.warn('⚠️ Spotify credentials are missing in env');
    return res.json({ isPlaying: false, statusText: "Offline", error: "Missing Spotify credentials" });
  }

  if (pendingSpotifyRequest) {
    try {
      const data = await pendingSpotifyRequest;
      return res.json(data);
    } catch(err) {}
  }

  pendingSpotifyRequest = (async () => {
    try {
      const accessToken = await getSpotifyAccessToken();
      console.log('🎵 Fetching currently playing track from Spotify...');

      const currentResponse = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (currentResponse.status === 204 || !currentResponse.data || !currentResponse.data.item) {
        console.log('ℹ️ No track currently playing. Fetching recently played...');
        const recentResponse = await axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        const recentItems = recentResponse.data?.items;
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
          albumArt: recentTrack.album.images?.[0]?.url || null,
          spotifyUrl: recentTrack.external_urls?.spotify || null
        };

        console.log(`✅ Recently Played: "${responseData.track}" by ${responseData.artist}`);
        cache.set('now-playing', responseData, 10);
        return responseData;
      }

      const currentTrack = currentResponse.data.item;
      const isPlaying = currentResponse.data.is_playing;

      const responseData = {
        isPlaying,
        statusText: isPlaying ? "Now Playing" : "Recently Played",
        track: currentTrack.name,
        artist: currentTrack.artists.map(a => a.name).join(', '),
        album: currentTrack.album.name,
        albumArt: currentTrack.album.images?.[0]?.url || null,
        spotifyUrl: currentTrack.external_urls?.spotify || null
      };

      console.log(`✅ ${responseData.statusText}: "${responseData.track}" by ${responseData.artist}`);
      cache.set('now-playing', responseData, 10);
      return responseData;

    } catch (error) {
      console.error('❌ Spotify API Error:', error.message);
      throw error;
    } finally {
      pendingSpotifyRequest = null;
    }
  })();

  try {
    const data = await pendingSpotifyRequest;
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ 
      isPlaying: false, 
      statusText: "Error",
      error: "Failed to retrieve data from Spotify" 
    });
  }
});

/**
 * Endpoint: /top-tracks (mounted on /api/spotify)
 */
router.get('/top-tracks', async (req, res) => {
  const cachedData = cache.get('top-tracks');
  if (cachedData) return res.json(cachedData);

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    return res.status(500).json({ error: "Missing Spotify credentials" });
  }

  try {
    const accessToken = await getSpotifyAccessToken();
    console.log('🎵 Fetching top tracks from Spotify...');
    const response = await axios.get('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const items = response.data?.items;
    if (!items || items.length === 0) {
      return res.status(404).json({ error: "No top tracks returned" });
    }

    const tracks = items.map(item => ({
      name: item.name,
      artist: item.artists.map(a => a.name).join(', '),
      albumArt: item.album.images?.[0]?.url || item.album.images?.[1]?.url || null,
      url: item.external_urls?.spotify || null
    }));

    cache.set('top-tracks', tracks, 3600); // 1 hour cache
    return res.json(tracks);
  } catch (error) {
    console.error('❌ Failed to fetch top tracks from Spotify API:', error.message);
    return res.status(500).json({ error: error.message || "Failed to retrieve top tracks" });
  }
});

module.exports = router;
