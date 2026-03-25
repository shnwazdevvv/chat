const fs   = require('fs');
const path = require('path');

/**
 * Load all sticker file IDs from the stickers directory.
 * Each .txt file is expected to have one file_id per line (comment lines start with #).
 * Returns a flat array of all sticker file_ids.
 */
function loadStickers() {
  const dir = path.join(__dirname, '..', 'stickers');
  const stickers = [];

  if (!fs.existsSync(dir)) {
    console.warn('⚠️  stickers/ directory not found');
    return stickers;
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.txt'));
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comment/metadata lines and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue;
      stickers.push(trimmed);
    }
    console.log(`📦 Loaded sticker pack: ${file}`);
  }

  console.log(`🎴 Total stickers loaded: ${stickers.length}`);
  return stickers;
}

/**
 * Pick a random sticker file_id from the pool.
 */
function randomSticker(pool) {
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = { loadStickers, randomSticker };
