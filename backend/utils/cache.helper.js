import fs from "fs";
import path from "path";

export const cacheFiles = {
  games: path.resolve('./assets/json/games.json'),
  lines: path.resolve('./assets/json/lines.json'),
};

function ensureDirectory(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function loadCacheFromFile(filePath) {

  ensureDirectory(filePath);
  let cacheData;

  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8').trim();
      cacheData = content ? JSON.parse(content) : {};
      console.log(`Cache loaded from file: ${filePath}`);
    } catch (err) {
      console.warn('Corrupted cache file, starting fresh:', err.message);
      cacheData = {};
    }
  } else {
    cacheData = {};
  }
  return cacheData;
}

export async function saveCacheToFile(cacheKey, data) {
  const filePath = cacheFiles[cacheKey];
  
  try {
    // Use a temp file then rename for better atomicity (optional but good)
    const cacheObj = {
      date: new Date().toISOString(),
    };

    cacheObj[cacheKey] = data;

    const tempFile = `${filePath}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(cacheObj, null, 2));
    fs.renameSync(tempFile, filePath); // Atomic on most systems
    console.log(`Cache saved to file: ${Object.keys(data).length} games`);
  } catch (err) {
    console.error('Failed to save cache:', err.message);
  }
}
