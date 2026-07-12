const express = require('express');
const axios = require('axios');
const cache = require('../utils/cache');

const router = express.Router();

router.get('/stars/:owner/:repo', async (req, res) => {
  const { owner, repo } = req.params;
  const cacheKey = `github_stars_${owner}_${repo}`;
  
  // Check cache first (cached for 1 hour to avoid rate limits)
  const cachedStars = cache.get(cacheKey);
  if (cachedStars !== undefined) {
    return res.json({ stars: cachedStars });
  }

  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Personal-Portfolio-App'
    };

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    const stars = response.data.stargazers_count;

    // Cache the result for 1 hour (3600 seconds)
    cache.set(cacheKey, stars, 3600);

    res.json({ stars });
  } catch (error) {
    console.error(`[GitHub API] Error fetching stars for ${owner}/${repo}:`, error.message);
    res.status(500).json({ error: 'Failed to fetch GitHub stars' });
  }
});

module.exports = router;
