// users.js — User management (admin only)
const router = require('express').Router();
const store  = require('../store');

const VALID_ROLES = ['admin', 'viewer'];

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ ok: false, error: 'Admins only' });
  next();
}

// GET /api/users
router.get('/', adminOnly, (req, res) => {
  res.json({ ok: true, data: store.getUsers() });
});

// POST /api/users
router.post('/', adminOnly, (req, res) => {
  const { username, password, role = 'viewer' } = req.body || {};
  if (!username || !password)       return res.status(400).json({ ok: false, error: 'username and password required' });
  if (!VALID_ROLES.includes(role))  return res.status(400).json({ ok: false, error: `role must be one of: ${VALID_ROLES.join(', ')}` });
  if (store.getUserByUsername(username)) return res.status(409).json({ ok: false, error: 'Username already exists' });

  const user = store.addUser({ username, password, role });
  res.status(201).json({ ok: true, data: user });
});

// PUT /api/users/:id
router.put('/:id', adminOnly, (req, res) => {
  const { password, role } = req.body || {};
  if (role && !VALID_ROLES.includes(role))
    return res.status(400).json({ ok: false, error: `role must be one of: ${VALID_ROLES.join(', ')}` });

  const target = store.getUserById(req.params.id);
  if (!target) return res.status(404).json({ ok: false, error: 'User not found' });
  if (target.username === req.user.username && role && role !== 'admin')
    return res.status(400).json({ ok: false, error: "Can't remove your own admin role" });

  const updated = store.updateUser(req.params.id, { password, role });
  res.json({ ok: true, data: updated });
});

// DELETE /api/users/:id
router.delete('/:id', adminOnly, (req, res) => {
  const target = store.getUserById(req.params.id);
  if (!target) return res.status(404).json({ ok: false, error: 'User not found' });
  if (target.username === req.user.username)
    return res.status(400).json({ ok: false, error: "Can't delete your own account" });

  store.removeUser(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
