const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/admin/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), async (req, res) => {
  const { email, password } = req.body || {};
  const ok = typeof email === 'string' && typeof password === 'string' &&
    email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase() &&
    await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  res.cookie('token', jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '8h' }), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 3600 * 1000
  });
  res.json({ ok: true });
});

router.post('/admin/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/admin/me', auth, (req, res) => res.json({ ok: true }));

module.exports = router;