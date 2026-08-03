import { cache } from '../../../utils/apiCache.js';

export const prerender = false;

export async function GET() {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
  };

  const cachedData = cache.get('steam-status');
  if (cachedData) {
    return new Response(JSON.stringify(cachedData), { status: 200, headers });
  }

  const STEAM_API_KEY = import.meta.env.STEAM_API_KEY;
  const STEAM_USER_ID = import.meta.env.STEAM_USER_ID;

  if (!STEAM_API_KEY || !STEAM_USER_ID) {
    return new Response(JSON.stringify({
      status: "Offline",
      isPlaying: false,
      game: "Counter-Strike 2",
      playtime: "N/A hrs past 2 weeks",
      isMock: true
    }), { status: 200, headers });
  }

  try {
    const summaryUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${STEAM_USER_ID}`;
    const ownedUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${STEAM_USER_ID}&format=json&include_appinfo=true&include_played_free_games=true`;

    const [summaryRes, ownedRes] = await Promise.all([
      fetch(summaryUrl),
      fetch(ownedUrl)
    ]);
    
    if (!summaryRes.ok || !ownedRes.ok) {
        throw new Error('Steam API requests failed');
    }

    const summaryData = await summaryRes.json();
    const ownedData = await ownedRes.json();

    const player = summaryData.response?.players?.[0];
    const games = ownedData.response?.games || [];

    // Sort by rtime_last_played timestamp descending to get the true most recently played game
    if (games.length > 0) {
      games.sort((a, b) => (b.rtime_last_played || 0) - (a.rtime_last_played || 0));
    }

    const recentGame = games[0];

    let isPlaying = false;
    let status = "Offline";
    let game = "None";
    let playtime = "0 hrs past 2 weeks";

    if (player) {
      // Only set status to active/playing if a game is actively running
      if (player.gameextrainfo) {
        isPlaying = true;
        status = "Playing";
        game = player.gameextrainfo;
      } else {
        // If only Steam client is open in background (or user is offline), treat as Offline
        status = "Offline";
        if (recentGame) {
          game = recentGame.name;
          if (recentGame.playtime_2weeks) {
            playtime = `${(recentGame.playtime_2weeks / 60).toFixed(1)} hrs past 2 weeks`;
          } else {
            playtime = `${(recentGame.playtime_forever / 60).toFixed(1)} hrs total`;
          }
        }
      }
    }

    const result = { status, isPlaying, game, playtime, isMock: false };
    cache.set('steam-status', result, 60);

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (error) {
    console.error('Steam Proxy API Error:', error.message);
    return new Response(JSON.stringify({ error: "Failed to fetch from Steam API" }), { status: 500, headers });
  }
}
