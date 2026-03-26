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

// Serve public folder
app.use(express.static(path.join(__dirname, 'public')));

// Last.fm Credentials
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;
const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0/';

if (!LASTFM_API_KEY || !LASTFM_USERNAME) {
  if (process.env.NODE_ENV === 'production') {
    console.error("❌ CRITICAL ERROR: Missing Last.fm credentials (LASTFM_API_KEY, LASTFM_USERNAME). Spotify widget will remain offline.");
  } else {
    console.warn("⚠️  Warning: Missing Last.fm credentials in .env (LASTFM_API_KEY, LASTFM_USERNAME). Spotify widget will remain offline.");
  }
}

// Global Axios defaults
axios.defaults.timeout = 5000;

let pendingLastFmRequest = null;

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

  // Prevent Thundering Herd
  if (pendingLastFmRequest) {
    try {
      const data = await pendingLastFmRequest;
      return res.json(data);
    } catch(err) {
      // Allow fallback if pending request failed
    }
  }

  pendingLastFmRequest = (async () => {
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
        return { 
          isPlaying: false, 
          statusText: "API Error", 
          error: `Last.fm error ${response.data.error}: ${response.data.message}` 
        };
      }

      const tracks = response.data?.recenttracks?.track;
      if (!tracks || tracks.length === 0) {
        console.log('ℹ️  No recent tracks found for this user.');
        return { isPlaying: false, statusText: "No Tracks" };
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
      return responseData;

    } catch (error) {
      const status = error.response?.status;
      const errData = error.response?.data;
      console.error('❌ Last.fm API Error:', {
        message: error.message,
        status: status || 'N/A',
        responseData: errData || 'No response body',
        url: error.config?.url || 'N/A'
      });
      throw error;
    } finally {
      pendingLastFmRequest = null;
    }
  })();

  try {
    const data = await pendingLastFmRequest;
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ 
      isPlaying: false, 
      statusText: "Error",
      error: "Failed to retrieve data" 
    });
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
