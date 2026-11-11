const { Setting, Appointment } = require('../models');

const toMinutes = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const toTime = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
const isDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(d));

async function getSlots(date) {
  if (!isDate(date)) return [];
  const now = new Date();
  const today = now.toLocaleDateString('en-CA');
  const limit = new Date(now.getTime() + 90 * 864e5).toLocaleDateString('en-CA');
  if (date < today || date > limit) return [];

  const s = (await Setting.findOne()) || {};
  if (s.closedDays.includes(new Date(`${date}T00:00:00Z`).getUTCDay())) return [];

  const taken = new Set((await Appointment.find({ date, slotKey: { $exists: true } }, 'time')).map(a => a.time));
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const slots = [];
  for (let m = toMinutes(s.startTime); m + s.slotMinutes <= toMinutes(s.endTime); m += s.slotMinutes) {
    const t = toTime(m);
    if (!taken.has(t) && !(date === today && m <= nowMin)) slots.push(t);
  }
  return slots;
}

module.exports = { getSlots, isDate };
