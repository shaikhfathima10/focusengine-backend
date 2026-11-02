const jwt = require('jsonwebtoken');
// Expects "Authorization: Bearer <token>". Puts { id } on req.user.
module.exports = (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Login required' });
  try {
    req.user = { id: jwt.verify(token, process.env.JWT_SECRET).id };
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please log in again' });
  }
};
