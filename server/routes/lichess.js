const express = require('express');
const axios = require('axios');
const cache = require('../utils/cache');

const router = express.Router();

router.get('/stats', async (req, res) => {
  const username = process.env.LICHESS_USERNAME;
  if (!username) {
    return res.status(500).json({ error: "Lichess username not configured." });
  }

  const cacheKey = 'lichess_stats';
  const cachedData = cache.get(cacheKey);
  if (cachedData !== undefined) {
    return res.json(cachedData);
  }

  try {
    const response = await axios.get(`https://lichess.org/api/user/${username}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Personal-Website-Node-Server'
      }
    });

    const parsed = {
      blitz: response.data.perfs?.blitz?.rating || 0,
      rapid: response.data.perfs?.rapid?.rating || 0,
      games: response.data.count?.all || 0
    };

    cache.set(cacheKey, parsed, 3600); // Cache for 1 hour
    return res.json(parsed);
  } catch (error) {
    console.error('Lichess Proxy API Error:', error.message);
    return res.status(500).json({ error: "Failed to fetch stats from Lichess." });
  }
});

module.exports = router;
