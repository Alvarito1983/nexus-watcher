const store = require('../store');
const { pullImage, recreateContainer } = require('./docker');
const { load: loadSettings } = require('../routes/settings');
const axios = require('axios');

async function applyAllUpdates() {
  const updates = store.getUpdates();
  if (updates.length === 0) return;

  const results = [];
  for (const img of updates) {
    try {
      console.log(`[updater] Pulling ${img.repoTag}...`);
      store.setImage(img.id, { rollbackDigest: img.localDigest });
      await pullImage(img.repoTag);

      for (const container of img.containers || []) {
        try {
          await recreateContainer(container.id);
          results.push({ image: img.repoTag, container: container.name, status: 'updated' });
        } catch (e) {
          results.push({ image: img.repoTag, container: container.name, status: 'error', error: e.message });
        }
      }

      store.setImage(img.id, { hasUpdate: false, updateApplied: true, lastUpdated: new Date().toISOString() });
      await notify(`✅ *NEXUS Watcher* — Updated \`${img.repoTag}\` successfully.`);
    } catch (e) {
      console.error(`[updater] Failed to update ${img.repoTag}:`, e.message);
      results.push({ image: img.repoTag, status: 'error', error: e.message });
      await notify(`❌ *NEXUS Watcher* — Failed to update \`${img.repoTag}\`: ${e.message}`);
    }
  }

  return results;
}

async function notify(message) {
  const settings = loadSettings();
  if (!settings.telegramToken || !settings.telegramChatId) return;
  try {
    await axios.post(`https://api.telegram.org/bot${settings.telegramToken}/sendMessage`, {
      chat_id: settings.telegramChatId,
      text: message,
      parse_mode: 'Markdown',
    });
  } catch (e) {
    console.warn('[updater] Telegram notify failed:', e.message);
  }
}

module.exports = { applyAllUpdates, notify };
