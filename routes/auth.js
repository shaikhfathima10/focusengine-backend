const router = require('express').Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { wrap, sign, okImageUrl } = require('../utils/helpers');

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const emailOk = (e) => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

router.post('/register', limiter, wrap(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !emailOk(email) || typeof password !== 'string' || password.length < 8)
    return res.status(400).json({ error: 'Name, a valid email and a password of 8+ characters are required' });
  if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ error: 'Email already registered' });
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
  res.status(201).json({ token: sign(user.id), user });
}));

router.post('/login', limiter, wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const user = emailOk(email) && typeof password === 'string' ? await User.findOne({ email: email.toLowerCase() }).select('+password') : null;
  // Same message for unknown email and wrong password, on purpose.
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Wrong email or password' });
  res.json({ token: sign(user.id), user });
}));

router.get('/me', auth, wrap(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ error: 'Account not found' });
  res.json(user);
}));

router.patch('/me', auth, wrap(async (req, res) => {
  const user = await User.findById(req.user.id);
  for (const k of ['name', 'bio', 'avatar']) {
    if (typeof req.body[k] !== 'string') continue;
    if (k === 'avatar' && req.body.avatar && !okImageUrl(req.body.avatar)) return res.status(400).json({ error: 'Invalid image' });
    user[k] = req.body[k];
  }
  await user.save();
  res.json(user);
}));

module.exports = router;
