const cron = require('node-cron');
const { runScan } = require('./scanner');
const { load: loadSettings } = require('../routes/settings');

let currentTask = null;
let currentInterval = null;

function intervalToCron(seconds) {
  if (seconds >= 86400) return '0 0 * * *';           // daily
  if (seconds >= 43200) return '0 */12 * * *';        // every 12h
  if (seconds >= 21600) return '0 */6 * * *';         // every 6h
  if (seconds >= 10800) return '0 */3 * * *';         // every 3h
  if (seconds >= 3600)  return '0 * * * *';           // every 1h
  if (seconds >= 1800)  return '*/30 * * * *';        // every 30m
  return `*/${Math.floor(seconds / 60)} * * * *`;     // custom
}

function startScheduler(intervalSeconds) {
  if (currentTask) {
    currentTask.stop();
    currentTask = null;
  }

  currentInterval = intervalSeconds;
  const expr = intervalToCron(intervalSeconds);
  console.log(`[scheduler] Starting — every ${intervalSeconds}s (${expr})`);

  currentTask = cron.schedule(expr, async () => {
    console.log('[scheduler] Scheduled scan starting...');
    const settings = loadSettings();
    const result = await runScan();

    // Auto-update mode — apply all found updates
    if (settings.scanMode === 'auto' && result?.updatesFound > 0) {
      console.log(`[scheduler] Auto-update mode — applying ${result.updatesFound} updates...`);
      const { applyAllUpdates } = require('./updater');
      await applyAllUpdates();
    }
  });
}

function updateSchedule(newIntervalSeconds) {
  if (newIntervalSeconds === currentInterval) return;
  console.log(`[scheduler] Updating interval to ${newIntervalSeconds}s`);
  startScheduler(newIntervalSeconds);
}

function getNextRun() {
  if (!currentTask) return null;
  const expr = intervalToCron(currentInterval);
  // Simple estimation based on interval
  const next = new Date(Date.now() + currentInterval * 1000);
  return next.toISOString();
}

module.exports = { startScheduler, updateSchedule, getNextRun };
