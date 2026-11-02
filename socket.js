const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const User = require('./models/User');
const { canAccessRoom, okImageUrl } = require('./utils/helpers');

module.exports.initSocket = (io) => {
  // Same JWT as the REST API: io(URL, { auth: { token } })
  io.use((socket, next) => {
    try { socket.userId = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET).id; next(); }
    catch { next(new Error('Unauthorized')); }
  });

  io.on('connection', (socket) => {
    socket.on('room:join', (room, ack) => {
      if (!canAccessRoom(room, socket.userId)) return ack && ack({ error: 'Not allowed' });
      socket.join(room);
      ack && ack({ ok: true });
    });

    socket.on('message:send', async ({ room, text = '', image = '' } = {}, ack) => {
      try {
        if (!canAccessRoom(room, socket.userId) || !socket.rooms.has(room)) return ack && ack({ error: 'Join the room first' });
        text = String(text).trim().slice(0, 2000);
        if (!text && !image) return ack && ack({ error: 'Empty message' });
        if (image && !okImageUrl(image)) return ack && ack({ error: 'Bad image' });
        const msg = await Message.create({ room, sender: socket.userId, text, image });
        const sender = await User.findById(socket.userId).select('name avatar');
        io.to(room).emit('message:new', { ...msg.toJSON(), sender });
        ack && ack({ ok: true });
      } catch (e) { console.error(e); ack && ack({ error: 'Could not send' }); }
    });
  });
};
