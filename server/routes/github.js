const express = require('express');
const axios = require('axios');
const cache = require('../utils/cache');

const router = express.Router();

router.get('/stars/:owner/:repo', async (req, res) => {
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
      console.error("⚠️ GitHub API Rate Limit Exceeded. Add GITHUB_PAT to env");
    }
    return res.json({ stars: 0 }); // Fallback gracefully for frontend
  }
});

module.exports = router;
