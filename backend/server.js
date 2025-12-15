import "dotenv/config";
import express from "express";
import cors from "cors";
import records from './assets/json/records.json' assert { type: "json" };
import teams from './assets/json/teams.json' assert { type: "json" };
import fs from "fs";
import path from "path";

const app = express();
const PORT = 5050;

app.use(cors());

const API_BASE = 'https://api.collegefootballdata.com';
const AUTH_HEADER = { Authorization: `Bearer ${process.env.AUTH_TOKEN2}` }; // <<< REPLACE WITH YOUR TOKEN

// In-memory cache of loaded data (persists across calls in the same process)
let fileCache = null;

// Map to deduplicate concurrent fetches for the same gameId
const pendingFetches = new Map();
const CACHE_FILE = path.resolve('./assets/json/lines.json');

function ensureDirectory() {
  const dir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function loadCacheFromFile() {
  if (fileCache !== null) return fileCache;

  ensureDirectory();

  if (fs.existsSync(CACHE_FILE)) {
    try {
      const content = fs.readFileSync(CACHE_FILE, 'utf-8').trim();
      fileCache = content ? JSON.parse(content) : {};
      console.log(`Cache loaded from file: ${Object.keys(fileCache).length} games`);
    } catch (err) {
      console.warn('Corrupted cache file, starting fresh:', err.message);
      fileCache = {};
    }
  } else {
    fileCache = {};
  }
  return fileCache;
}

async function saveCacheToFile() {
  try {
    // Use a temp file then rename for better atomicity (optional but good)
    const tempFile = `${CACHE_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(fileCache, null, 2));
    fs.renameSync(tempFile, CACHE_FILE); // Atomic on most systems
    console.log(`Cache saved to file: ${Object.keys(fileCache).length} games`);
  } catch (err) {
    console.error('Failed to save cache:', err.message);
  }
}

async function getLine(gameId) {
  if (!gameId) {
    console.error('No gameId provided to getLine');
    return null;
  }

  await loadCacheFromFile();

  if (fileCache.hasOwnProperty(gameId)) {
    console.log(`In-memory cache hit for gameId ${gameId}`);
    return fileCache[gameId];
  }

  // Deduplicate: if another call is already fetching this gameId, await it
  if (pendingFetches.has(gameId)) {
    console.log(`Joining pending fetch for gameId ${gameId}`);
    return await pendingFetches.get(gameId);
  }

  // Start a new fetch and store the promise
  const fetchPromise = (async () => {
    console.log(`Fetching lines from API for gameId ${gameId}`);
    try {
      const res = await fetch(`${API_BASE}/lines?gameId=${gameId}`, {
        headers: AUTH_HEADER
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const data = await res.json();
      if (!data?.length || !data[0]?.lines) {
        console.warn(`No lines data for gameId ${gameId}`);
        return null;
      }

      const lines = data[0].lines;

      // Update in-memory cache
      fileCache[gameId] = lines;

      // Save to file (non-blocking, fire-and-forget for performance)
      saveCacheToFile().catch(() => {}); // Ignore save errors here

      return lines;
    } catch (err) {
      console.error(`Fetch failed for gameId ${gameId}:`, err.message);
      throw err; // Re-throw so callers know it failed
    } finally {
      // Always clean up the pending map
      pendingFetches.delete(gameId);
    }
  })();

  pendingFetches.set(gameId, fetchPromise);

  return await fetchPromise;
}

function getRecord(teamId) {
  const teamRecord = records.find(record => record.teamId === teamId);
  return teamRecord;
}

app.get('/api/bowls', async (req, res) => {
  try {

    console.log('Attempting to read cached games from ./assets/json/games.json');

    if (fs.existsSync('./assets/json/games.json')) {
      const cachedGames = JSON.parse(fs.readFileSync('./assets/json/games.json', 'utf-8'));
      console.log(`Cache hit: Found ${cachedGames.length} cached games`);
      return res.json(cachedGames);
    }

    console.log('Cache miss: Fetching bowl games from API');

    const gamesRes = await fetch(`${API_BASE}/games?year=2025&seasonType=postseason`, {
      headers: AUTH_HEADER
    });

    if (!gamesRes.ok) {
      throw new Error(`Failed to fetch games: ${gamesRes.status} ${gamesRes.statusText}`);
    }

    const games = await gamesRes.json();

    console.log(`Fetched ${games.length} games from API`);

    const enrichedGames = await Promise.all(games.filter(game => {
      const gameDate = new Date(game.startDate);
      const cutoffDate = new Date("2025-12-01T00:00:00Z");

      console.log(`Processing game on ${gameDate}`, `Cutoff date is ${cutoffDate.toISOString()}`, `Include game: ${gameDate >= cutoffDate}`);
      return gameDate >= cutoffDate;
    }).map(async (game) => {

      const homeInfo = teams.find(team => team.id === game.homeId) || {};
      const awayInfo = teams.find(team => team.id === game.awayId) || {};
      const [homeLogo] = homeInfo.logos || [];
      const [awayLogo] = awayInfo.logos || [];

      const homeRecord = getRecord(game.homeId);
      const awayRecord = getRecord(game.awayId);

      const line = await getLine(game.id);

      return {
        ...game,
        home_logo: homeLogo,
        away_logo: awayLogo,
        home_conference: homeInfo.conference || 'N/A',
        away_conference: awayInfo.conference || 'N/A',
        home_info: homeInfo,
        away_info: awayInfo,
        home_record: homeRecord,
        away_record: awayRecord,
        line: line,
      };
    }));

    enrichedGames.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    // Write enriched games to a JSON file ./assets/json/games.json

    fs.writeFileSync('./assets/json/games.json', JSON.stringify(enrichedGames, null, 2));

    res.json(enrichedGames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
