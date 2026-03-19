const router = require('express').Router();
const store = require('../store');

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'nexus-watcher', version: '1.0.0', status: 'healthy' });
});

router.get('/status', (req, res) => {
  res.json({ ok: true, data: store.getStatus() });
});

router.get('/metrics', (req, res) => {
  const status = store.getStatus();
  res.type('text/plain').send([
    `# HELP nexus_watcher_images_total Total images tracked`,
    `# TYPE nexus_watcher_images_total gauge`,
    `nexus_watcher_images_total ${status.totalImages}`,
    `# HELP nexus_watcher_updates_pending Updates pending`,
    `# TYPE nexus_watcher_updates_pending gauge`,
    `nexus_watcher_updates_pending ${status.pendingUpdates}`,
  ].join('\n'));
});

module.exports = router;
