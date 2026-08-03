import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const env = {};
envText.split('\n').forEach(line => {
  const [k, v] = line.split('=');
  if (k && v) env[k.trim()] = v.trim();
});

const STEAM_API_KEY = env.STEAM_API_KEY;
const STEAM_USER_ID = env.STEAM_USER_ID;

async function testEndpoint() {
  const summaryUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${STEAM_USER_ID}`;
  const ownedUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${STEAM_USER_ID}&format=json&include_appinfo=true&include_played_free_games=true`;

  const [summaryRes, ownedRes] = await Promise.all([
    fetch(summaryUrl),
    fetch(ownedUrl)
  ]);

  const summaryData = await summaryRes.json();
  const ownedData = await ownedRes.json();

  const player = summaryData.response?.players?.[0];
  const games = ownedData.response?.games || [];

  if (games.length > 0) {
    games.sort((a, b) => (b.rtime_last_played || 0) - (a.rtime_last_played || 0));
  }

  const recentGame = games[0];

  let isPlaying = false;
  let status = "Offline";
  let game = "None";
  let playtime = "0 hrs past 2 weeks";

  if (player) {
    if (player.gameextrainfo) {
      isPlaying = true;
      status = "Playing";
      game = player.gameextrainfo;
    } else {
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
  console.log("SIMULATED API RESPONSE:");
  console.log(JSON.stringify(result, null, 2));
}

testEndpoint();
