const jwt = require('jsonwebtoken');

// Wraps async route handlers so errors reach the error middleware.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const isDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const dayOf = (d) => new Date(d).toISOString().slice(0, 10);
// The last n days (UTC) as YYYY-MM-DD, oldest first.
const lastDays = (n) => [...Array(n)].map((_, i) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - (n - 1 - i));
  return d.toISOString().slice(0, 10);
});
// Rooms: "general" is open; "dm:<idA>:<idB>" only for those two users.
const canAccessRoom = (room, uid) =>
  typeof room === 'string' &&
  (room === 'general' || (room.startsWith('dm:') && room.split(':').slice(1).includes(String(uid))));

// Image URLs we accept: our own local uploads (dev) or our own Cloudinary account (production).
// Checking this stops people saving arbitrary links as an avatar or chat image.
const okImageUrl = (u) => {
  if (typeof u !== 'string') return false;
  if (/^\/uploads\/[a-f0-9]{32}\.(png|jpg|webp|gif)$/.test(u)) return true;
  if (!process.env.CLOUDINARY_URL) return false;
  const cloud = require('cloudinary').v2.config().cloud_name;
  return !!cloud && u.startsWith(`https://res.cloudinary.com/${cloud}/image/upload/`) && /^[A-Za-z0-9_.:\/-]+$/.test(u);
};

module.exports = { wrap, sign, isDay, dayOf, lastDays, canAccessRoom, okImageUrl };
