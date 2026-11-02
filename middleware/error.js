module.exports = (err, _req, res, _next) => {
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid id' });
  if (err.name === 'ValidationError') return res.status(400).json({ error: Object.values(err.errors).map((e) => e.message).join(', ') });
  if (err.code === 11000) return res.status(409).json({ error: 'Already exists' });
  if (err.name === 'MulterError') return res.status(400).json({ error: err.message });
  if (err.status && err.status < 500) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
};
