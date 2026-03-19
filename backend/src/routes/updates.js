const router = require('express').Router();
const store = require('../store');
const { pullImage, recreateContainer } = require('../services/docker');

// GET /api/updates — images with updates available
router.get('/', (req, res) => {
  res.json({ ok: true, data: store.getUpdates() });
});

// POST /api/updates/:id/apply — pull + recreate containers
router.post('/:id/apply', async (req, res) => {
  const img = store.getImage(req.params.id);
  if (!img) return res.status(404).json({ ok: false, error: 'Image not found' });

  try {
    console.log(`[updates] Applying update for ${img.repoTag}...`);

    // Save current digest for rollback
    store.setImage(img.id, { rollbackDigest: img.localDigest });

    // Pull new image
    await pullImage(img.repoTag);

    // Recreate each container using this image
    const results = [];
    for (const container of img.containers || []) {
      try {
        const result = await recreateContainer(container.id);
        results.push({ ...result, status: 'recreated' });
      } catch (e) {
        results.push({ id: container.id, name: container.name, status: 'error', error: e.message });
      }
    }

    store.setImage(img.id, { hasUpdate: false, updateApplied: true, lastUpdated: new Date().toISOString() });

    res.json({ ok: true, data: { image: img.repoTag, containers: results } });
  } catch (e) {
    console.error(`[updates] Apply failed for ${img.repoTag}:`, e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/updates/apply-all — bulk update
router.post('/apply-all', async (req, res) => {
  const { dryRun } = req.query;
  const updates = store.getUpdates();

  if (dryRun === 'true') {
    return res.json({
      ok: true,
      data: { dryRun: true, wouldUpdate: updates.map(i => i.repoTag) }
    });
  }

  const results = [];
  for (const img of updates) {
    try {
      await pullImage(img.repoTag);
      for (const container of img.containers || []) {
        await recreateContainer(container.id);
      }
      store.setImage(img.id, { hasUpdate: false, updateApplied: true, lastUpdated: new Date().toISOString() });
      results.push({ image: img.repoTag, status: 'updated' });
    } catch (e) {
      results.push({ image: img.repoTag, status: 'error', error: e.message });
    }
  }

  res.json({ ok: true, data: results });
});

// POST /api/updates/:id/rollback — restore previous digest
router.post('/:id/rollback', async (req, res) => {
  const img = store.getImage(req.params.id);
  if (!img) return res.status(404).json({ ok: false, error: 'Image not found' });
  if (!img.rollbackDigest) return res.status(400).json({ ok: false, error: 'No rollback digest available' });

  try {
    console.log(`[updates] Rolling back ${img.repoTag}...`);
    // Pull by digest
    await pullImage(`${img.name}@${img.rollbackDigest}`);
    store.setImage(img.id, { hasUpdate: false, updateApplied: false, rolledBack: true });
    res.json({ ok: true, data: { image: img.repoTag, rolledBackTo: img.rollbackDigest } });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
