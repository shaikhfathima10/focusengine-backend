const router = require('express').Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const { wrap, canAccessRoom } = require('../utils/helpers');

router.use(auth);
// History over REST; live messages go through Socket.IO (see socket.js).
router.get('/:room/messages', wrap(async (req, res) => {
  if (!canAccessRoom(req.params.room, req.user.id)) return res.status(403).json({ error: 'Not allowed in this room' });
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const msgs = await Message.find({ room: req.params.room }).sort({ createdAt: -1 }).limit(limit).populate('sender', 'name avatar');
  res.json(msgs.reverse());
}));
module.exports = router;
