const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const defaults = {
  scanInterval: parseInt(process.env.SCAN_INTERVAL || '3600'),
  scanMode: 'notify', // 'notify' | 'auto'
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
};

function load() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return { ...defaults, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) };
    }
  } catch (e) { console.error('[settings] Load error:', e.message); }
  return { ...defaults };
}

function save(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
  } catch (e) { console.error('[settings] Save error:', e.message); }
}

// GET /api/settings
router.get('/', (req, res) => {
  const settings = load();
  // Mask token for security
  res.json({ ok: true, data: { ...settings, telegramToken: settings.telegramToken ? '••••••••' : '' } });
});

// POST /api/settings
router.post('/', (req, res) => {
  const current = load();
  const { scanInterval, scanMode, telegramToken, telegramChatId } = req.body;

  const updated = {
    ...current,
    scanInterval: scanInterval || current.scanInterval,
    scanMode: scanMode || current.scanMode,
    telegramChatId: telegramChatId ?? current.telegramChatId,
    // Only update token if a real value was sent (not masked)
    telegramToken: (telegramToken && !telegramToken.includes('•')) ? telegramToken : current.telegramToken,
  };

  save(updated);

  // Apply new interval to the cron scheduler
  const { updateSchedule } = require('../services/scheduler');
  updateSchedule(updated.scanInterval);

  res.json({ ok: true, data: updated });
});

// POST /api/settings/test-notification
router.post('/test-notification', async (req, res) => {
  const settings = load();
  const { telegramToken, telegramChatId } = settings;

  if (!telegramToken || !telegramChatId) {
    return res.status(400).json({ ok: false, error: 'Telegram not configured' });
  }

  try {
    await axios.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      chat_id: telegramChatId,
      text: '✅ *NEXUS Watcher* — Test notification. Everything is working!',
      parse_mode: 'Markdown',
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.response?.data?.description || e.message });
  }
});

module.exports = { router, load };
