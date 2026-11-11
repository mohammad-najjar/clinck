require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { seed } = require('./services/seed');

if (!process.env.JWT_SECRET || !process.env.MONGODB_URI) throw new Error('Set JWT_SECRET and MONGODB_URI in .env');

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: { directives: {
  defaultSrc: ["'self'"], scriptSrc: ["'self'"], imgSrc: ["'self'", 'data:'],
  styleSrc: ["'self'", 'https://fonts.googleapis.com'], fontSrc: ['https://fonts.gstatic.com']
} } }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api', require('./routes/public'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  const invalid = err.name === 'ValidationError';
  res.status(invalid ? 400 : 500).json({ error: invalid ? err.message : 'Something went wrong.' });
});

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await seed();
  app.listen(process.env.PORT || 3000, () => console.log('Roua Clinic running'));
});
