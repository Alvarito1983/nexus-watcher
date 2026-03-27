const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// In-memory state
let state = {
  images: {},       // imageId -> { id, name, tag, localDigest, registryDigest, hasUpdate, lastChecked }
  scanHistory: [],  // [{ id, startedAt, finishedAt, found, updated, errors }]
  lastScan: null,
};

// Persist to disk
function save() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('[store] Failed to save:', e.message);
  }
}

// Load from disk on startup
function load() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      state = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
      console.log(`[store] Loaded ${Object.keys(state.images).length} images from disk`);
    }
  } catch (e) {
    console.error('[store] Failed to load:', e.message);
  }
}

load();

module.exports = {
  getImages: () => Object.values(state.images),
  getImage: (id) => state.images[id],
  setImage: (id, data) => { state.images[id] = { ...state.images[id], ...data }; save(); },
  getUpdates: () => {
    const withUpdate = Object.values(state.images).filter(i => i.hasUpdate);
    // Deduplicate by repoTag — keep only the most recent entry per image
    const seen = new Map();
    for (const img of withUpdate) {
      const key = img.repoTag || `${img.name}:${img.tag}`;
      const existing = seen.get(key);
      if (!existing || img.lastChecked > existing.lastChecked) seen.set(key, img);
    }
    return Array.from(seen.values());
  },
  getScanHistory: () => state.scanHistory,
  getLastScan: () => state.lastScan,
  addScanResult: (result) => {
    state.scanHistory.unshift(result);
    state.scanHistory = state.scanHistory.slice(0, 50); // keep last 50
    state.lastScan = result;
    save();
  },
  clearHistory: () => { state.scanHistory = []; state.lastScan = null; save(); },
  getStatus: () => ({
    totalImages: Object.keys(state.images).length,
    pendingUpdates: Object.values(state.images).filter(i => i.hasUpdate).length,
    lastScan: state.lastScan,
  }),
};
