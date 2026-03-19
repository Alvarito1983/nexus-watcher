const { getLocalImages, getContainersUsingImage } = require('./docker');
const { getRegistryDigest } = require('./registry');
const store = require('../store');

async function runScan() {
  const startedAt = new Date().toISOString();
  const errors = [];
  let updated = 0;

  console.log('[scanner] Starting digest scan...');

  let localImages;
  try {
    localImages = await getLocalImages();
  } catch (e) {
    console.error('[scanner] Failed to list local images:', e.message);
    return;
  }

  for (const img of localImages) {
    try {
      const registryDigest = await getRegistryDigest(img.name, img.tag);

      if (!registryDigest) {
        errors.push({ image: img.repoTag, error: 'Could not fetch registry digest' });
        continue;
      }

      const containers = await getContainersUsingImage(img.fullId).catch(() => []);
      const existing = store.getImage(img.id);
      const previousRegistryDigest = existing?.registryDigest;
      const hasUpdate = previousRegistryDigest
        ? previousRegistryDigest !== registryDigest
        : false;

      store.setImage(img.id, {
        id: img.id,
        fullId: img.fullId,
        name: img.name,
        tag: img.tag,
        repoTag: img.repoTag,
        localDigest: img.localDigest,
        registryDigest,
        hasUpdate: hasUpdate || (existing?.hasUpdate && !existing?.updateApplied),
        size: img.size,
        created: img.created,
        containers,
        lastChecked: new Date().toISOString(),
      });

      if (hasUpdate) {
        updated++;
        console.log(`[scanner] Update available: ${img.repoTag}`);
        await notifyUpdate(img.repoTag);
      }
    } catch (e) {
      errors.push({ image: img.repoTag, error: e.message });
      console.error(`[scanner] Error scanning ${img.repoTag}:`, e.message);
    }
  }

  const result = {
    id: Date.now().toString(),
    startedAt,
    finishedAt: new Date().toISOString(),
    totalScanned: localImages.length,
    updatesFound: updated,
    errors,
  };

  store.addScanResult(result);
  console.log(`[scanner] Done. ${localImages.length} images scanned, ${updated} updates found.`);
  return result;
}

async function notifyUpdate(repoTag) {
  // Telegram notification via settings
  try {
    const { load: loadSettings } = require('../routes/settings');
    const settings = loadSettings();
    if (settings.telegramToken && settings.telegramChatId) {
      const axios = require('axios');
      await axios.post(`https://api.telegram.org/bot${settings.telegramToken}/sendMessage`, {
        chat_id: settings.telegramChatId,
        text: `🔔 *NEXUS Watcher* — Update available for \`${repoTag}\``,
        parse_mode: 'Markdown',
      });
    }
  } catch (e) {
    console.warn(`[scanner] Telegram notify failed: ${e.message}`);
  }

  // NEXUS Notify integration
  const notifyUrl = process.env.NOTIFY_URL;
  if (!notifyUrl) return;
  try {
    const axios = require('axios');
    await axios.post(`${notifyUrl}/api/events`, {
      source: 'nexus-watcher',
      type: 'update.available',
      severity: 'info',
      message: `Update available for ${repoTag}`,
      data: { repoTag },
    }, {
      headers: { 'x-api-key': process.env.NEXUS_API_KEY },
      timeout: 5000,
    });
  } catch (e) {
    console.warn(`[scanner] Could not notify NEXUS Notify: ${e.message}`);
  }
}

module.exports = { runScan };
