const router = require('express').Router();
const store = require('../store');
const { runScan } = require('../services/scanner');

// POST /api/scan — trigger manual scan
router.post('/', async (req, res) => {
  try {
    console.log('[scan] Manual scan triggered');
    const result = await runScan();
    res.json({ ok: true, data: result });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/scan/history
router.get('/history', (req, res) => {
  const limit = parseInt(req.query.limit || '20');
  res.json({ ok: true, data: store.getScanHistory().slice(0, limit) });
});

// DELETE /api/scan/history — clear all history
router.delete('/history', (req, res) => {
  store.clearHistory();
  res.json({ ok: true });
});

module.exports = router;
