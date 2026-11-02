const router = require('express').Router();
const Task = require('../models/Task');
const FocusSession = require('../models/FocusSession');
const auth = require('../middleware/auth');
const { wrap, dayOf, lastDays } = require('../utils/helpers');

router.use(auth);

// One endpoint feeds every analytics tab. ?days=7 (1 to 90)
router.get('/overview', wrap(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 90);
  const range = lastDays(days);
  const history = lastDays(Math.max(days, 60));
  const [tasks, sessions] = await Promise.all([
    Task.find({ user: req.user.id }),
    FocusSession.find({ user: req.user.id, day: { $gte: history[0] } }),
  ]);
  const inRange = sessions.filter((s) => s.day >= range[0]);
  const sum = (a) => a.reduce((n, s) => n + s.minutes, 0);
  const totalMinutes = sum(inRange);

  const minutesPerDay = range.map((d) => sum(inRange.filter((s) => s.day === d)));
  const tasksPerDay = range.map((d) => tasks.filter((t) => t.completedAt && dayOf(t.completedAt) === d).length);

  const focusDays = new Set(sessions.map((s) => s.day));
  let streak = 0;
  for (const d of [...lastDays(60)].reverse()) {
    if (focusDays.has(d)) streak++;
    else if (d !== lastDays(1)[0]) break; // today may still be empty
  }

  const done = tasks.filter((t) => t.completed);
  const areas = {};
  tasks.forEach((t) => { areas[t.area] = (areas[t.area] || 0) + 1; });
  const open = tasks.filter((t) => !t.completed);
  const openMinutes = open.reduce((n, t) => n + t.estimateHours * 60, 0);
  const avgPerDay = totalMinutes / days;

  res.json({
    days, range,
    overview: {
      focusScore: Math.min(100, Math.round((totalMinutes / (days * 30)) * 100)), // target: 30 min a day
      completionRate: tasks.length ? Math.round((done.length / tasks.length) * 100) : 0,
      productiveHours: +(totalMinutes / 60).toFixed(1),
      streak,
    },
    trends: { minutesPerDay, tasksPerDay },
    categories: Object.entries(areas).map(([area, count]) => ({ area, count, percent: Math.round((count / tasks.length) * 100) })),
    timeAnalysis: { plannedMinutes: Math.round(done.reduce((n, t) => n + t.estimateHours * 60, 0)), focusedMinutes: totalMinutes },
    performance: {
      sessions: inRange.length,
      averageMinutes: inRange.length ? Math.round(totalMinutes / inRange.length) : 0,
      longestMinutes: Math.max(0, ...inRange.map((s) => s.minutes)),
    },
    forecast: {
      avgMinutesPerDay: Math.round(avgPerDay),
      nextWeekMinutes: Math.round(avgPerDay * 7),
      openTaskMinutes: Math.round(openMinutes),
      daysToClear: avgPerDay ? Math.ceil(openMinutes / avgPerDay) : null,
    },
  });
}));

module.exports = router;
