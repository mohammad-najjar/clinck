const { Service, Setting } = require('../models');

// Starter data only; the clinic edits all of it from /admin
async function seed() {
  if (!(await Setting.countDocuments())) await Setting.create({});
  if (!(await Service.countDocuments())) {
    await Service.insertMany([
      { name: 'Botox consultation', description: 'Discuss your goals and whether treatment is suitable for you.' },
      { name: 'Dermal filler consultation', description: 'Assessment and a personalised treatment plan.' },
      { name: 'Facial aesthetics', description: 'Treatments to refresh and balance the face.' },
      { name: 'Skin rejuvenation', description: 'Professional care to improve skin quality.' }
    ]);
  }
}
module.exports = { seed };
