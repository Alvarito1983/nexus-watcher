const router = require('express').Router();
const crypto = require('crypto');
const store  = require('../store');

const sessions = new Map();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ ok: false, error: 'Username and password required' });

  const user = store.getUserByUsername(username);
  if (!user || !store.verifyPassword(password, user.passwordHash))
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { username: user.username, role: user.role, createdAt: Date.now() });
  res.json({ ok: true, token, user: { username: user.username, role: user.role } });
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

module.exports = { router, sessions };
