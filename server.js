require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');

for (const k of ['MONGODB_URI', 'JWT_SECRET']) {
  if (!process.env[k]) { console.error(`Missing ${k}. Copy .env.example to .env first.`); process.exit(1); }
}
const CLIENT = process.env.CLIENT_URL || 'http://localhost:5173';
const app = express();
app.set('trust proxy', 1); // behind Render's proxy: lets rate limiting see the real visitor IP
const server = http.createServer(app);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // lets the React app show /uploads images
app.use(cors({ origin: CLIENT }));
app.use(express.json({ limit: '100kb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/focus', require('./routes/focus'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/upload', require('./routes/upload'));
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(require('./middleware/error'));

initSocket(new Server(server, { cors: { origin: CLIENT } }));

connectDB()
  .then(() => server.listen(process.env.PORT || 5000, () => console.log(`API on port ${process.env.PORT || 5000}`)))
  .catch((e) => { console.error('Could not connect to MongoDB:', e.message); process.exit(1); });
