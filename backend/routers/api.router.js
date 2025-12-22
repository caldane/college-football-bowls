import {Router} from 'express';
import recordsJson from '../assets/json/records.json' with { type: "json" };
import teamsJson from '../assets/json/teams.json' with { type: "json" };
import picksJson from '../assets/json/picks.json' with { type: "json" };
import rankingsJson from '../assets/json/rankings.json' with { type: "json" };
import { loadCacheFromFile, saveCacheToFile } from '../utils/cache.helper.js';
import { getGamesFromAPI, getLinesFromAPI } from '../utils/games.helper.js';
import { cacheFiles } from '../utils/cache.helper.js';
import { calculateGamePoints, calculatePickPoints, calculateUserPoints } from '../utils/points.helper.js';

const apiRouter = Router();

apiRouter.post('/create-lines-cache', async (_, res) => {
  try {
    const linesData = {};
    const lines = await getLinesFromAPI();
    for (const line of lines) {
      linesData[line.id] = line.lines || null;
    }

    const cacheDate = await saveCacheToFile("lines", linesData);
    console.log(`Wrote ${Object.keys(linesData).length} lines to cache with date ${cacheDate}`);
  } catch (error) {
    console.error('Failed to create lines cache:', error);
    return res.status(500).json({ error: 'Failed to create lines cache' });
  }
  return res.status(204).end();
});
      

apiRouter.get('/bowls', async (_, res) => {
  try {

    console.log('Attempting to read cached games from ./assets/json/games.json');

    const cache = await loadCacheFromFile(cacheFiles.games);
    const cachedGames = cache.games;

    // Check if cache is older than 2 hours
    const cacheAge = cache.date ? Date.now() - new Date(cache.date).getTime() : Infinity;
    const cacheAgeLimit = process.env.CACHE_AGE_LIMIT_MINUTES * 60 * 1000; // 30 minutes in milliseconds

    if (cacheAge > cacheAgeLimit) {
      console.log(`Cache is older than ${cacheAgeLimit / (60 * 1000)} minutes, fetching fresh data`);
    } else if (cachedGames && Array.isArray(cachedGames) && cachedGames.length > 0) {
      console.log(`Cache hit: Returning ${cachedGames.length} bowl games from cache`);
      return res.json({users: calculateUserPoints(cachedGames), games: cachedGames, cacheDate: cache.date});
    } else {
      console.log('Cache miss: Fetching bowl games from API');
    }


    const games = await getGamesFromAPI();

    const enrichedGames = await Promise.all(games.filter(game => {
      const gameDate = new Date(game.startDate);
      const cutoffDate = new Date("2025-12-01T00:00:00Z");

      console.log(`Processing game on ${gameDate}`, `Cutoff date is ${cutoffDate.toISOString()}`, `Include game: ${gameDate >= cutoffDate}`);
      return gameDate >= cutoffDate;
    }).map(async (game) => {

      const homeInfo = teamsJson.find(team => team.id === game.homeId) || {};
      const awayInfo = teamsJson.find(team => team.id === game.awayId) || {};
      const [homeLogo] = homeInfo.logos || [];
      const [awayLogo] = awayInfo.logos || [];
      const [_ap, _coaches, polls] = rankingsJson.polls;

      const gamePicks = picksJson.map(pick => ({
        user: pick.Name,
        teamId: teamsJson.find(team => pick[game.id]?.includes(team.school) && pick[game.id]?.includes(team.mascot))?.id || null,
        teamName: pick[game.id],
        double: pick[`${game.id}_double`]?.startsWith('Yes'),
        points: calculatePickPoints({
          double: pick[`${game.id}_double`]?.startsWith('Yes'), 
          teamId: teamsJson.find(team => pick[game.id]?.includes(team.school) && pick[game.id]?.includes(team.mascot))?.id || null
        }, game)
      }));

      const homeRecord = recordsJson.find(record => record.teamId === game.homeId);
      const awayRecord = recordsJson.find(record => record.teamId === game.awayId);
      const homeRank = polls.ranks.find(rank => rank.teamId === game.homeId)?.rank || undefined;
      const awayRank = polls.ranks.find(rank => rank.teamId === game.awayId)?.rank || undefined;

      const linesJson = await loadCacheFromFile(cacheFiles.lines);
      const line = linesJson.lines[game.id];

      return {
        bowl_name: game.notes,
        bowl_points: calculateGamePoints(game, homeRank, awayRank),
        ...game,
        home_ranking: homeRank,
        away_ranking: awayRank,
        home_logo: homeLogo,
        away_logo: awayLogo,
        home_conference: homeInfo.conference || 'N/A',
        away_conference: awayInfo.conference || 'N/A',
        home_info: homeInfo,
        away_info: awayInfo,
        home_record: homeRecord,
        away_record: awayRecord,
        line: line,
        picks: gamePicks ? gamePicks : undefined,
      };
    }));

    enrichedGames.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    // Write enriched games to a JSON file ./assets/json/games.json
    const cacheDate = await saveCacheToFile("games", enrichedGames);
    console.log(`Wrote ${enrichedGames.length} enriched games to ./assets/json/games.json`);

    res.json({users: calculateUserPoints(enrichedGames), games:enrichedGames, cacheDate: cacheDate});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

apiRouter.get('/health', (req, res) => {
  res.status(200).send('OK');
});

export default apiRouter;