const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const cache = new NodeCache();

// Security: Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Enable CORS
app.use(cors());

// Serve public folder
app.use(express.static(path.join(__dirname, 'public')));

// Last.fm Credentials
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;
const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0/';

if (!LASTFM_API_KEY || !LASTFM_USERNAME) {
  console.warn("⚠️  Missing Last.fm credentials in .env (LASTFM_API_KEY, LASTFM_USERNAME). API will return Offline.");
}

// Global Axios defaults
axios.defaults.timeout = 5000;

/**
 * Endpoint: /api/spotify/now-playing
 * Uses Last.fm — no Spotify Premium required!
 * Returns the same JSON shape so the frontend works unchanged.
 */
app.get('/api/spotify/now-playing', async (req, res) => {
  const cachedData = cache.get('now-playing');
  if (cachedData) return res.json(cachedData);

  if (!LASTFM_API_KEY || !LASTFM_USERNAME) {
    console.warn('⚠️  /api/spotify/now-playing called but LASTFM_API_KEY or LASTFM_USERNAME is missing in .env');
    return res.json({ isPlaying: false, statusText: "Offline", error: "Missing Last.fm credentials in .env" });
  }

  try {
    console.log(`🎵 Fetching Last.fm data for user: ${LASTFM_USERNAME}`);
    const response = await axios.get(LASTFM_BASE, {
      params: {
        method: 'user.getRecentTracks',
        user: LASTFM_USERNAME,
        api_key: LASTFM_API_KEY,
        format: 'json',
        limit: 1
      }
    });

    // Check for Last.fm error responses
    if (response.data.error) {
      console.error(`❌ Last.fm API returned error ${response.data.error}: ${response.data.message}`);
      return res.json({ 
        isPlaying: false, 
        statusText: "API Error", 
        error: `Last.fm error ${response.data.error}: ${response.data.message}` 
      });
    }

    const tracks = response.data?.recenttracks?.track;
    if (!tracks || tracks.length === 0) {
      console.log('ℹ️  No recent tracks found for this user.');
      return res.json({ isPlaying: false, statusText: "No Tracks" });
    }

    const track = Array.isArray(tracks) ? tracks[0] : tracks;
    const isPlaying = track['@attr']?.nowplaying === 'true';

    const responseData = {
      isPlaying,
      statusText: isPlaying ? "Now Playing" : "Recently Played",
      track: track.name,
      artist: track.artist['#text'] || track.artist.name,
      album: track.album['#text'],
      albumArt: track.image?.find(img => img.size === 'extralarge')?.['#text']
             || track.image?.[track.image.length - 1]?.['#text']
             || null,
      spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(track.name + ' ' + (track.artist['#text'] || ''))}`
    };

    console.log(`✅ ${responseData.statusText}: "${responseData.track}" by ${responseData.artist}`);

    // Cache for 10 seconds
    cache.set('now-playing', responseData, 10);
    return res.json(responseData);

  } catch (error) {
    const status = error.response?.status;
    const errData = error.response?.data;
    console.error('❌ Last.fm API Error:', {
      message: error.message,
      status: status || 'N/A',
      responseData: errData || 'No response body',
      url: error.config?.url || 'N/A'
    });
    res.status(500).json({ 
      isPlaying: false, 
      statusText: "Error",
      error: `Last.fm request failed: ${error.message}` 
    });
  }
});

/**
 * Endpoint: /api/github/stars/:owner/:repo
 * Returns GitHub repository star count with caching.
 */
app.get('/api/github/stars/:owner/:repo', async (req, res) => {
  const { owner, repo } = req.params;
  const cacheKey = `github_stars_${owner}_${repo}`;

  const cachedStars = cache.get(cacheKey);
  if (cachedStars !== undefined) {
    return res.json({ stars: cachedStars });
  }

  try {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Personal-Website-Node-Server'
      }
    });

    const stars = response.data.stargazers_count || 0;
    cache.set(cacheKey, stars, 3600);
    return res.json({ stars });
  } catch (error) {
    console.error(`GitHub API Error for ${owner}/${repo}:`, error.message);
    return res.json({ stars: 0 });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});
