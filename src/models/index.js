const { Schema, model } = require('mongoose');

const Service = model('Service', new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 400, default: '' },
  active: { type: Boolean, default: true }
}));

const Setting = model('Setting', new Schema({
  startTime: { type: String, default: '10:00' },
  endTime: { type: String, default: '18:00' },
  slotMinutes: { type: Number, default: 45, min: 15, max: 180 },
  closedDays: { type: [Number], default: [5] }, // 0 = Sunday
  phone: { type: String, default: '' },
  address: { type: String, default: '' }
}));

// slotKey is unique while an appointment is pending/confirmed, so the database itself blocks double booking
const Appointment = model('Appointment', new Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  service: { type: String, required: true },
  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  time: { type: String, required: true },               // HH:MM
  notes: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending', index: true },
  slotKey: { type: String, unique: true, sparse: true }
}, { timestamps: true }));

const Admin = model('Admin', new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true }
}));

module.exports = { Service, Setting, Appointment, Admin };
