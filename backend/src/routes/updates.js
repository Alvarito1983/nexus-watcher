const router = require('express').Router();
const store = require('../store');
const { pullImage, recreateContainer } = require('../services/docker');
const { getIo } = require('../io');

function emit(id, stage, extra = {}) {
  const io = getIo();
  if (io) io.emit('update:progress', { id, stage, ...extra });
}

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
    emit(img.id, 'pulling', { percent: 0, layer: '', status: 'Starting pull...' });

    // Pull new image with per-layer progress
    const layerProgress = {};
    await pullImage(img.repoTag, (event) => {
      if (!event.id) return;
      const current = event.progressDetail?.current || 0;
      const total   = event.progressDetail?.total   || 0;
      if (total > 0) layerProgress[event.id] = { current, total };

      const totalBytes = Object.values(layerProgress).reduce((s, l) => s + l.total, 0);
      const doneBytes  = Object.values(layerProgress).reduce((s, l) => s + l.current, 0);
      const percent = totalBytes > 0 ? Math.round((doneBytes / totalBytes) * 100) : 0;

      emit(img.id, 'pulling', { percent, layer: event.id, status: event.status || '' });
    });

    emit(img.id, 'recreating');

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
    emit(img.id, 'done');

    res.json({ ok: true, data: { image: img.repoTag, containers: results } });
  } catch (e) {
    console.error(`[updates] Apply failed for ${img.repoTag}:`, e.message);
    emit(img.id, 'error', { message: e.message });
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
      emit(img.id, 'pulling', { percent: 0, layer: '', status: 'Starting pull...' });
      const layerProgress = {};
      await pullImage(img.repoTag, (event) => {
        if (!event.id) return;
        const current = event.progressDetail?.current || 0;
        const total   = event.progressDetail?.total   || 0;
        if (total > 0) layerProgress[event.id] = { current, total };
        const totalBytes = Object.values(layerProgress).reduce((s, l) => s + l.total, 0);
        const doneBytes  = Object.values(layerProgress).reduce((s, l) => s + l.current, 0);
        const percent = totalBytes > 0 ? Math.round((doneBytes / totalBytes) * 100) : 0;
        emit(img.id, 'pulling', { percent, layer: event.id, status: event.status || '' });
      });
      emit(img.id, 'recreating');
      for (const container of img.containers || []) {
        await recreateContainer(container.id);
      }
      store.setImage(img.id, { hasUpdate: false, updateApplied: true, lastUpdated: new Date().toISOString() });
      emit(img.id, 'done');
      results.push({ image: img.repoTag, status: 'updated' });
    } catch (e) {
      emit(img.id, 'error', { message: e.message });
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
    await pullImage(`${img.name}@${img.rollbackDigest}`);
    store.setImage(img.id, { hasUpdate: false, updateApplied: false, rolledBack: true });
    res.json({ ok: true, data: { image: img.repoTag, rolledBackTo: img.rollbackDigest } });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
