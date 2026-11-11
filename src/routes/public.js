const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { Service, Setting, Appointment } = require('../models');
const { getSlots, isDate } = require('../services/slots');

const bookingLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, message: { error: 'Too many requests. Please try again later.' } });

router.get('/services', async (req, res) => res.json(await Service.find({ active: true }, 'name description')));
router.get('/clinic', async (req, res) => res.json(await Setting.findOne({}, 'phone address')));

router.get('/slots', async (req, res) => {
  if (!isDate(req.query.date)) return res.status(400).json({ error: 'Choose a valid date.' });
  res.json({ slots: await getSlots(req.query.date) });
});

router.post('/appointments', bookingLimit, async (req, res, next) => {
  try {
    const b = Object.fromEntries(['name', 'phone', 'service', 'date', 'time', 'notes'].map(k => [k, String(req.body[k] ?? '').trim()]));
    const errors = {};
    if (b.name.length < 2 || b.name.length > 80) errors.name = 'Enter your full name.';
    if (!/^\+?[\d\s-]{7,15}$/.test(b.phone)) errors.phone = 'Enter a valid phone number.';
    if (b.notes.length > 500) errors.notes = 'Notes must be under 500 characters.';
    if (!(await Service.exists({ name: b.service, active: true }))) errors.service = 'Choose a treatment.';
    if (!(await getSlots(b.date)).includes(b.time)) errors.time = 'That time is no longer available. Please pick another.';
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Please check the form.', errors });

    await Appointment.create({ ...b, slotKey: `${b.date}_${b.time}` });
    res.status(201).json({ status: 'pending', message: 'Your request has been received and is awaiting approval. The clinic will contact you to confirm.' });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'That time was just taken. Please pick another.', errors: { time: 'Time unavailable.' } });
    next(err);
  }
});

module.exports = router;
