const API_BASE = 'https://api.collegefootballdata.com';
const AUTH_HEADER = { Authorization: `Bearer ${process.env.AUTH_TOKEN2}` }; // <<< REPLACE WITH YOUR TOKEN


export async function getGamesFromAPI() {
  const gamesRes = await fetch(`${API_BASE}/games?year=2025&seasonType=postseason`, {
    headers: AUTH_HEADER
  });

  if (!gamesRes.ok) {
    throw new Error(`Failed to fetch games: ${gamesRes.status} ${gamesRes.statusText}`);
  }

  const games = await gamesRes.json();

  console.log(`Fetched ${games.length} games from API`);
  return games;
}

