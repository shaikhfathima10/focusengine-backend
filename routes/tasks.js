const router = require('express').Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const { wrap } = require('../utils/helpers');

router.use(auth);
const FIELDS = ['title', 'area', 'priority', 'dueDate', 'estimateHours'];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Every query includes user: req.user.id, so nobody can read or change another user's tasks.
router.get('/', wrap(async (req, res) => {
  const { status, area, q, due } = req.query;
  const f = { user: req.user.id };
  if (status === 'active') f.completed = false;
  if (status === 'completed') f.completed = true;
  if (area) f.area = String(area);
  if (due) f.dueDate = String(due);
  if (q) f.title = new RegExp(esc(String(q)), 'i');
  res.json(await Task.find(f).sort({ completed: 1, dueDate: 1, createdAt: -1 }));
}));

router.post('/', wrap(async (req, res) => {
  const data = { user: req.user.id };
  for (const k of FIELDS) if (req.body[k] !== undefined) data[k] = req.body[k];
  res.status(201).json(await Task.create(data)); // schema validates the rest
}));

router.patch('/:id', wrap(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  for (const k of FIELDS) if (req.body[k] !== undefined) task[k] = req.body[k];
  if (typeof req.body.completed === 'boolean' && req.body.completed !== task.completed) {
    task.completed = req.body.completed;
    task.completedAt = task.completed ? new Date() : null;
  }
  res.json(await task.save());
}));

router.delete('/:id', wrap(async (req, res) => {
  const r = await Task.deleteOne({ _id: req.params.id, user: req.user.id });
  if (!r.deletedCount) return res.status(404).json({ error: 'Task not found' });
  res.status(204).end();
}));

module.exports = router;
