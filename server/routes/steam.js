const express = require('express');
const axios = require('axios');
const cache = require('../utils/cache');

const router = express.Router();

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_USER_ID = process.env.STEAM_USER_ID;

router.get('/status', async (req, res) => {
  const cacheKey = 'steam_status';
  const cachedData = cache.get(cacheKey);

  if (cachedData !== undefined) {
    return res.json(cachedData);
  }

  // Fallback mock data if credentials are not configured in local development
  if (!STEAM_API_KEY || !STEAM_USER_ID) {
    const mockData = {
      status: 'Online',
      isPlaying: false,
      game: 'Counter-Strike 2',
      playtime: '18.4 hrs past 2 weeks',
      isMock: true
    };
    cache.set(cacheKey, mockData, 60); // cache mock for 1 min
    return res.json(mockData);
  }

  try {
    // 1. Get Player Summary (checks if user is online/offline and what game they are currently playing)
    const summaryUrl = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${STEAM_USER_ID}`;
    const summaryResponse = await axios.get(summaryUrl);
    
    const players = summaryResponse.data?.response?.players;
    if (!players || players.length === 0) {
      throw new Error('No player profile found on Steam');
    }
    
    const player = players[0];
    const isPlaying = !!player.gameextrainfo;
    const currentGame = player.gameextrainfo || null;
    
    // Convert status: only show as "In-Game" when playing, otherwise treat as Offline (since client is open 24/7)
    let personaStatus = 'Offline';
    if (isPlaying) personaStatus = 'In-Game';

    // 2. Get Recently Played Games (checks playtime of last played game in the past 2 weeks)
    const recentUrl = `http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${STEAM_API_KEY}&steamid=${STEAM_USER_ID}&count=1`;
    const recentResponse = await axios.get(recentUrl);
    
    const games = recentResponse.data?.response?.games || [];
    let lastPlayedGame = currentGame;
    let playtimeText = '';

    if (games.length > 0) {
      const recent = games[0];
      if (!lastPlayedGame) lastPlayedGame = recent.name;
      
      const playtimeHours = (recent.playtime_2weeks / 60).toFixed(1);
      playtimeText = `${playtimeHours} hrs past 2 weeks`;
    } else {
      if (!lastPlayedGame) lastPlayedGame = 'No recent activity';
      playtimeText = '0 hrs past 2 weeks';
    }

    const payload = {
      status: personaStatus,
      isPlaying: isPlaying,
      game: lastPlayedGame,
      playtime: playtimeText,
      isMock: false
    };

    cache.set(cacheKey, payload, 60); // Cache for 1 minute
    return res.json(payload);

  } catch (error) {
    console.error('Steam Proxy API Error:', error.message);
    // Graceful fallback for the frontend
    return res.json({
      status: 'Offline',
      isPlaying: false,
      game: 'Offline Mode',
      playtime: 'API currently unavailable',
      error: true
    });
  }
});

module.exports = router;
