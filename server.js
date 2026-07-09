const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const cache = new NodeCache();

// 1. Security: Helmet for robust HTTP headers
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP here since it is set via meta tag in index.html
}));

// 2. Security: Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all /api/ routes
app.use('/api/', limiter);

// Enable CORS
app.use(cors());

// Enable JSON parsing for request bodies
app.use(express.json());

// Mock Vercel Insights for local development
app.get('/_vercel/insights/script.js', (req, res) => {
  res.type('application/javascript').send('// Mock Vercel Insights');
});

// Serve built Astro folder
app.use(express.static(path.join(__dirname, 'dist')));

// Spotify Credentials
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
  if (process.env.NODE_ENV === 'production') {
    console.error("❌ CRITICAL ERROR: Missing Spotify credentials (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN). Spotify widget will remain offline.");
  } else {
    console.warn("⚠️  Warning: Missing Spotify credentials in .env (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN). Spotify widget will remain offline.");
  }
}

// Global Axios defaults
axios.defaults.timeout = 5000;

let pendingSpotifyRequest = null;

/**
 * Helper: Retrieve a valid Spotify access token, using node-cache to store it
 */
async function getSpotifyAccessToken() {
  const cachedToken = cache.get('spotify_access_token');
  if (cachedToken) return cachedToken;

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    throw new Error('Missing Spotify credentials in .env');
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
  // Cache the token slightly less than expiration time (e.g. 5 minutes early)
  cache.set('spotify_access_token', accessToken, expiresIn - 300);
  return accessToken;
}

/**
 * Endpoint: /api/spotify/now-playing
 * Uses Spotify Web API directly.
 * Returns the same JSON shape so the frontend works unchanged.
 */
app.get('/api/spotify/now-playing', async (req, res) => {
  const cachedData = cache.get('now-playing');
  if (cachedData) return res.json(cachedData);

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    console.warn('⚠️  /api/spotify/now-playing called but Spotify credentials are missing in .env');
    return res.json({ isPlaying: false, statusText: "Offline", error: "Missing Spotify credentials in .env" });
  }

  // Prevent Thundering Herd
  if (pendingSpotifyRequest) {
    try {
      const data = await pendingSpotifyRequest;
      return res.json(data);
    } catch(err) {
      // Allow fallback if pending request failed
    }
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

      // Handle 204 No Content or no active playback
      if (currentResponse.status === 204 || !currentResponse.data || !currentResponse.data.item) {
        console.log('ℹ️  No track currently playing. Fetching recently played...');
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
      const status = error.response?.status;
      const errData = error.response?.data;
      console.error('❌ Spotify API Error:', {
        message: error.message,
        status: status || 'N/A',
        responseData: errData || 'No response body'
      });
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
 * Endpoint: /api/spotify/top-tracks
 * Fetches top tracks this month directly from Spotify.
 */
app.get('/api/spotify/top-tracks', async (req, res) => {
  const cachedData = cache.get('top-tracks');
  if (cachedData) return res.json(cachedData);

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    return res.status(500).json({ error: "Missing Spotify credentials in .env" });
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
      return res.status(404).json({ error: "No top tracks returned from Spotify API" });
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

// Rate Limiter specifically for notifications to prevent spam
const notifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per 15 minutes
  message: { error: 'Too many notifications sent. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/notify', notifyLimiter, async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    const response = await axios.post('https://ntfy.sh/my-site-alerts-98x21q', message.trim(), {
      headers: {
        'Title': 'New Custom Website Alert',
        'Priority': 'high',
        'Tags': 'bell,incoming_letter'
      }
    });

    if (response.status === 200) {
      console.log('✅ Notification sent successfully to ntfy');
      return res.json({ success: true, message: 'Notification sent successfully' });
    } else {
      throw new Error(`ntfy returned status ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Failed to send notification via ntfy:', error.message);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
});




app.get('/api/github/stars/:owner/:repo', async (req, res) => {
  const { owner, repo } = req.params;

  // Security Validation 1: Hardcode allowed owner to prevent abuse
  const allowedOwners = ['incconutwo', 'TG-TG-TG-TG-TG-TG'];
  if (!allowedOwners.includes(owner)) {
    return res.status(403).json({ error: "Access denied: Unauthorized repository owner." });
  }

  // Security Validation 2: Strict Regex for repo name
  if (!/^[a-zA-Z0-9-_\.]+$/.test(repo)) {
    return res.status(400).json({ error: "Invalid repository format" });
  }

  const cacheKey = `github_stars_${owner}_${repo}`;
  const cachedStars = cache.get(cacheKey);
  
  if (cachedStars !== undefined) {
    return res.json({ stars: cachedStars });
  }

  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Personal-Website-Node-Server'
    };

    // Use PAT if available to increase rate limit from 60/hr to 5000/hr
    if (process.env.GITHUB_PAT) {
      headers['Authorization'] = `token ${process.env.GITHUB_PAT}`;
    }

    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });

    const stars = response.data.stargazers_count || 0;
    cache.set(cacheKey, stars, 3600);
    return res.json({ stars });
  } catch (error) {
    console.error(`GitHub API Error for ${owner}/${repo}:`, error.message);
    if (error.response?.status === 403 && error.response.headers['x-ratelimit-remaining'] === '0') {
        console.error("⚠️ GitHub API Rate Limit Exceeded. Add GITHUB_PAT to .env");
    }
    return res.json({ stars: 0 }); // Fallback gracefully for frontend
  }
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Server is running on http://localhost:${port}`);
  });
}

module.exports = app;
