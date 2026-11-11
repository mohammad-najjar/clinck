// Usage: npm run create-admin -- email@example.com "a-long-passphrase"
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { Admin } = require('../src/models');

(async () => {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 12) { console.error('Provide an email and a password of 12+ characters.'); process.exit(1); }
  await mongoose.connect(process.env.MONGODB_URI);
  await Admin.findOneAndUpdate({ email: email.toLowerCase() }, { passwordHash: await bcrypt.hash(password, 12) }, { upsert: true });
  console.log('Admin saved.');
  process.exit(0);
})();
