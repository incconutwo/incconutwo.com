const express = require('express');
const cors = require('cors');
const axios = require('axios');
const querystring = require('querystring');
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

// Enable CORS (Useful for development or if frontend/backend are split)
app.use(cors());

// Serve public folder
app.use(express.static(path.join(__dirname, 'public')));

// Credentials
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;
const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.warn("⚠️  Missing Spotify credentials in .env. API will return Offline.");
}

// Global Axios defaults for reliability
axios.defaults.timeout = 5000; // 5 second timeout to prevent hanging requests

/**
 * Get Access Token
 * Optimized: Caches the token for 55 minutes to avoid hitting Spotify rate limits.
 */
async function getAccessToken() {
  // 1. Check Cache
  const cachedToken = cache.get('spotify_access_token');
  if (cachedToken) return cachedToken;

  if (!REFRESH_TOKEN) return null;

  try {
    // 2. Refresh Token
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: REFRESH_TOKEN
      })
    });

    if (response.data.access_token) {
      // 3. Cache Token (3300s = 55 mins)
      cache.set('spotify_access_token', response.data.access_token, 3300);
      return response.data.access_token;
    }
  } catch (error) {
    console.error('Error refreshing token:', error.response?.data || error.message);
  }
  return null;
}

/**
 * Endpoint: /api/spotify/now-playing
 * Returns current or recent track with short-term caching.
 */
app.get('/api/spotify/now-playing', async (req, res) => {
  const cachedData = cache.get('now-playing');
  if (cachedData) return res.json(cachedData);

  try {
    const access_token = await getAccessToken();

    if (!access_token) {
       return res.json({ isPlaying: false, statusText: "Offline" });
    }

    // Try "Currently Playing"
    const currentResponse = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    let responseData = { isPlaying: false, statusText: "Offline" };

    if (currentResponse.status === 200 && currentResponse.data.item) {
      const item = currentResponse.data.item;
      responseData = {
        isPlaying: currentResponse.data.is_playing,
        track: item.name,
        artist: item.artists.map(artist => artist.name).join(', '),
        album: item.album.name,
        albumArt: item.album.images[0].url,
        spotifyUrl: item.external_urls.spotify
      };
    } else {
      // Fallback: "Recently Played"
      const recentResponse = await axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });

      if (recentResponse.data.items?.length > 0) {
        const item = recentResponse.data.items[0].track;
        responseData = {
          isPlaying: false,
          statusText: "Recently Played",
          track: item.name,
          artist: item.artists.map(artist => artist.name).join(', '),
          album: item.album.name,
          albumArt: item.album.images[0].url,
          spotifyUrl: item.external_urls.spotify
        };
      }
    }

    // Cache Data (Short TTL: 10s)
    cache.set('now-playing', responseData, 10);
    return res.json(responseData);

  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ isPlaying: false, error: "Internal Server Error" }); 
  }
});

/**
 * Endpoint: /api/github/stars/:owner/:repo
 * Returns GitHub repository star count with caching.
 */
app.get('/api/github/stars/:owner/:repo', async (req, res) => {
  const { owner, repo } = req.params;
  const cacheKey = `github_stars_${owner}_${repo}`;
  
  // Check cache (1 hour TTL)
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
    
    // Cache for 1 hour (3600 seconds)
    cache.set(cacheKey, stars, 3600);
    
    return res.json({ stars });
  } catch (error) {
    console.error(`GitHub API Error for ${owner}/${repo}:`, error.message);
    // Return 0 on error to avoid breaking the UI
    return res.json({ stars: 0 });
  }
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Server is running on local network');
});
