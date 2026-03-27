const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR   = process.env.DATA_DIR || path.join(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// In-memory state
let state = {
  images: {},       // imageId -> { id, name, tag, localDigest, registryDigest, hasUpdate, lastChecked }
  scanHistory: [],  // [{ id, startedAt, finishedAt, found, updated, errors }]
  lastScan: null,
};

let users = [];

// ── Password helpers ──────────────────────────────────────────────────────────
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  try {
    const [salt, hash] = stored.split(':');
    return crypto.scryptSync(password, salt, 64).toString('hex') === hash;
  } catch { return false; }
}

// ── Persistence ───────────────────────────────────────────────────────────────
function save() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2));
  } catch (e) { console.error('[store] Failed to save:', e.message); }
}

function saveUsers() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (e) { console.error('[store] Save users error:', e.message); }
}

function load() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      state = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
      console.log(`[store] Loaded ${Object.keys(state.images || {}).length} images from disk`);
    }
  } catch (e) { console.error('[store] Failed to load:', e.message); }
}

function loadUsersPersisted() {
  try {
    if (fs.existsSync(USERS_FILE)) users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (e) { console.error('[store] Load users error:', e.message); }
}

function seedAdmin() {
  if (users.length === 0) {
    const username = process.env.ADMIN_USER     || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin';
    users.push({ id: '1', username, passwordHash: hashPassword(password), role: 'admin', createdAt: new Date().toISOString() });
    saveUsers();
    console.log(`[store] Admin user seeded: ${username}`);
  }
}

load();
loadUsersPersisted();
seedAdmin();

module.exports = {
  getImages:   () => Object.values(state.images || {}),
  getImage:    (id) => state.images[id],
  setImage:    (id, data) => { state.images[id] = { ...state.images[id], ...data }; save(); },
  getUpdates:  () => {
    const withUpdate = Object.values(state.images || {}).filter(i => i.hasUpdate);
    const seen = new Map();
    for (const img of withUpdate) {
      const key = img.repoTag || `${img.name}:${img.tag}`;
      const existing = seen.get(key);
      if (!existing || img.lastChecked > existing.lastChecked) seen.set(key, img);
    }
    return Array.from(seen.values());
  },
  getScanHistory: () => state.scanHistory || [],
  getLastScan:    () => state.lastScan,
  addScanResult: (result) => {
    state.scanHistory.unshift(result);
    state.scanHistory = state.scanHistory.slice(0, 50);
    state.lastScan = result;
    save();
  },
  clearHistory: () => { state.scanHistory = []; state.lastScan = null; save(); },
  getStatus: () => ({
    totalImages:    Object.keys(state.images || {}).length,
    pendingUpdates: Object.values(state.images || {}).filter(i => i.hasUpdate).length,
    lastScan: state.lastScan,
  }),

  // Users
  getUsers:          () => users.map(({ id, username, role, createdAt }) => ({ id, username, role, createdAt })),
  getUserByUsername: (username) => users.find(u => u.username === username),
  getUserById:       (id) => users.find(u => u.id === id),
  addUser: ({ username, password, role }) => {
    const u = { id: Date.now().toString(), username, passwordHash: hashPassword(password), role, createdAt: new Date().toISOString() };
    users.push(u);
    saveUsers();
    return { id: u.id, username: u.username, role: u.role, createdAt: u.createdAt };
  },
  updateUser: (id, { password, role }) => {
    const u = users.find(u => u.id === id);
    if (!u) return null;
    if (password) u.passwordHash = hashPassword(password);
    if (role)     u.role = role;
    saveUsers();
    return { id: u.id, username: u.username, role: u.role };
  },
  removeUser: (id) => {
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    users.splice(idx, 1);
    saveUsers();
    return true;
  },
  verifyPassword,
};
