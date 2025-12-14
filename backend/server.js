import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors());

const API_BASE = 'https://api.collegefootballdata.com';
const AUTH_HEADER = { Authorization: `Bearer ${process.env.AUTH_TOKEN}` }; // <<< REPLACE WITH YOUR TOKEN

// Cache for teams and records
let teamsCache = null;
let recordsCache = {};

async function getTeams() {
  if (teamsCache) return teamsCache;
  const response = await fetch(`${API_BASE}/teams/fbs?year=2025`, { headers: AUTH_HEADER });
  const data = await response.json();
  teamsCache = data.reduce((map, team) => {
    map[team.school] = { id: team.id, conference: team.conference };
    return map;
  }, {});
  return teamsCache;
}

async function getRecord(teamName, year = 2025) {
  const cacheKey = `${teamName}-${year}`;
  if (recordsCache[cacheKey]) return recordsCache[cacheKey];

  try {
    const res = await fetch(`${API_BASE}/games/teams?year=${year}&team=${teamName}&seasonType=regular`, {
      headers: AUTH_HEADER
    });
    const data = await res.json();
    const teamsData = data[0]?.teams || [];
    const record = teamsData.find(t => t.school === teamName)?.record?.[0] || { wins: 0, losses: 0 };
    recordsCache[cacheKey] = `${record.wins}-${record.losses}`;
    return recordsCache[cacheKey];
  } catch (e) {
    return 'N/A';
  }
}

app.get('/api/bowls', async (req, res) => {
  try {
    const teams = await getTeams();

    const gamesRes = await fetch(`${API_BASE}/games?year=2025&seasonType=postseason`, {
      headers: AUTH_HEADER
    });

    const games = await gamesRes.json();

    const enrichedGames = await Promise.all(games.map(async (game) => {
      const homeInfo = teams[game.home_team] || {};
      const awayInfo = teams[game.away_team] || {};

      const homeRecord = await getRecord(game.home_team);
      const awayRecord = await getRecord(game.away_team);

      return {
        ...game,
        home_logo: homeInfo.id ? `https://raw.githubusercontent.com/CFBD/cfb-web/master/public/logos/${homeInfo.id}.png` : null,
        away_logo: awayInfo.id ? `https://raw.githubusercontent.com/CFBD/cfb-web/master/public/logos/${awayInfo.id}.png` : null,
        home_conference: homeInfo.conference || 'N/A',
        away_conference: awayInfo.conference || 'N/A',
        home_record: homeRecord,
        away_record: awayRecord,
      };
    }));

    enrichedGames.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    res.json(enrichedGames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
