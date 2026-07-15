const express = require('express');
const axios = require('axios');
const cache = require('../utils/cache');

const router = express.Router();

router.get('/users/:modId', async (req, res) => {
  const { modId } = req.params;
  const cacheKey = `windhawk_users_${modId}`;

  // Check cache first (cached for 1 hour to avoid rate limits / performance impact)
  const cachedUsers = cache.get(cacheKey);
  if (cachedUsers !== undefined) {
    return res.json({ users: cachedUsers });
  }

  try {
    const response = await axios.get('https://mods.windhawk.net/catalogs/en.json');
    const catalog = response.data;
    
    if (catalog && catalog[modId] && catalog[modId].details) {
      const users = catalog[modId].details.users;
      // Cache the result for 1 hour (3600 seconds)
      cache.set(cacheKey, users, 3600);
      return res.json({ users });
    }
    
    res.status(404).json({ error: 'Mod not found in catalog' });
  } catch (error) {
    console.error(`[Windhawk API] Error fetching stats for ${modId}:`, error.message);
    res.status(500).json({ error: 'Failed to fetch Windhawk stats' });
  }
});

module.exports = router;
