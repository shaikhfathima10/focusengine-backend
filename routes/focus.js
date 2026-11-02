const router = require('express').Router();
const FocusSession = require('../models/FocusSession');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const { wrap, dayOf } = require('../utils/helpers');

router.use(auth);

// Called by the frontend when a timer finishes.
router.post('/', wrap(async (req, res) => {
  const minutes = Math.round(Number(req.body.minutes));
  if (!(minutes >= 1 && minutes <= 240)) return res.status(400).json({ error: 'minutes must be between 1 and 240' });
  let task = null, taskTitle = String(req.body.taskTitle || 'Open focus').slice(0, 200);
  if (req.body.taskId) {
    task = await Task.findOne({ _id: req.body.taskId, user: req.user.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    taskTitle = task.title;
  }
  const s = await FocusSession.create({ user: req.user.id, task: task && task.id, taskTitle, minutes, day: dayOf(Date.now()) });
  res.status(201).json(s);
}));

router.get('/', wrap(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  res.json(await FocusSession.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(limit));
}));

module.exports = router;
