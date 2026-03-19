const router = require('express').Router();
const crypto = require('crypto');

// Simple token store in memory
const sessions = new Map();

// Default credentials from env
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin';

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'Username and password required' });
  }

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { username, role: 'admin', createdAt: Date.now() });

  res.json({
    ok: true,
    token,
    user: { username, role: 'admin' },
  });
});

router.post('/logout', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  const session = sessions.get(token);
  if (!session) return res.status(401).json({ ok: false, error: 'Not authenticated' });
  res.json({ ok: true, user: { username: session.username, role: session.role } });
});

// Export sessions for use in auth middleware
module.exports = { router, sessions };
