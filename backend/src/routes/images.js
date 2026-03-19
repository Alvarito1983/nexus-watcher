const router = require('express').Router();
const store = require('../store');

// GET /api/images — all tracked images
router.get('/', (req, res) => {
  res.json({ ok: true, data: store.getImages() });
});

// GET /api/images/:id — single image detail
router.get('/:id', (req, res) => {
  const img = store.getImage(req.params.id);
  if (!img) return res.status(404).json({ ok: false, error: 'Image not found' });
  res.json({ ok: true, data: img });
});

module.exports = router;
