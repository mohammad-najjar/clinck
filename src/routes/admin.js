const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { Admin, Appointment, Service, Setting } = require('../models');
const { requireAdmin } = require('../middleware/auth');

const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, message: { error: 'Too many attempts. Try again in 15 minutes.' } });
const cookieOpts = { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 3600e3 };
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const STATUS_FLOW = { pending: ['confirmed', 'cancelled'], confirmed: ['completed', 'cancelled'] };
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12); // keeps login timing similar for unknown emails

router.post('/login', loginLimit, async (req, res) => {
  const admin = await Admin.findOne({ email: String(req.body.email || '').toLowerCase() });
  const ok = await bcrypt.compare(String(req.body.password || ''), admin ? admin.passwordHash : DUMMY_HASH);
  if (!admin || !ok) return res.status(401).json({ error: 'Incorrect email or password.' });
  res.cookie('token', jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: '8h' }), cookieOpts).json({ ok: true });
});

router.post('/logout', (req, res) => res.clearCookie('token', cookieOpts).json({ ok: true }));

router.use(requireAdmin);

router.get('/me', (req, res) => res.json({ ok: true }));

router.get('/stats', async (req, res) => {
  const rows = await Appointment.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]);
  const stats = { pending: 0, confirmed: 0, cancelled: 0, completed: 0 };
  rows.forEach(r => (stats[r._id] = r.n));
  res.json({ total: Object.values(stats).reduce((a, b) => a + b, 0), ...stats });
});

router.get('/appointments', async (req, res) => {
  const { status, service, date, q } = req.query;
  const filter = {};
  if (status) filter.status = String(status);
  if (service) filter.service = String(service);
  if (date) filter.date = String(date);
  if (q) filter.$or = [{ name: new RegExp(esc(q), 'i') }, { phone: new RegExp(esc(q), 'i') }];
  res.json(await Appointment.find(filter).sort({ date: 1, time: 1 }).limit(300));
});

router.patch('/appointments/:id', async (req, res) => {
  const appt = await Appointment.findById(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found.' });
  const next = String(req.body.status);
  if (!STATUS_FLOW[appt.status]?.includes(next)) return res.status(400).json({ error: `Cannot change ${appt.status} to ${next}.` });
  appt.status = next;
  if (['cancelled', 'completed'].includes(next)) appt.slotKey = undefined; // frees the slot
  await appt.save();
  res.json(appt);
});

router.get('/services', async (req, res) => res.json(await Service.find()));
router.post('/services', async (req, res) => res.status(201).json(await Service.create({ name: req.body.name, description: req.body.description })));
router.put('/services/:id', async (req, res) => {
  const { name, description, active } = req.body;
  res.json(await Service.findByIdAndUpdate(req.params.id, { name, description, active: Boolean(active) }, { new: true, runValidators: true }));
});

router.get('/settings', async (req, res) => res.json(await Setting.findOne()));
router.put('/settings', async (req, res) => {
  const { startTime, endTime, slotMinutes, closedDays, phone, address } = req.body;
  const t = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!t.test(startTime) || !t.test(endTime) || startTime >= endTime) return res.status(400).json({ error: 'Check the working hours.' });
  const s = await Setting.findOne();
  Object.assign(s, { startTime, endTime, slotMinutes: Number(slotMinutes), closedDays: (closedDays || []).map(Number), phone: String(phone || ''), address: String(address || '') });
  res.json(await s.save());
});

module.exports = router;
