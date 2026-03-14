require('dotenv').config();
const { connectDB } = require('../config/database');
const { syncDatabase } = require('../models');

const seedUsers = require('./seedData/users');
const seedComments = require('./seedData/comments');
const seedPosts = require('./seedData/posts');
const seedSubmissions = require('./seedData/submissions');
const seedInteractions = require('./seedData/interactions');
const seedAnnouncements = require('./seedData/announcements');

const isReset = process.argv.includes('--reset');

const modules = [
  seedUsers,
  seedComments,
  seedPosts,
  seedSubmissions,
  seedInteractions,
  seedAnnouncements,
];

async function main() {
  await connectDB();
  await syncDatabase({ alter: false });

  if (isReset) {
    console.log('\n🗑️  Resetting seed data...\n');
    for (const mod of [...modules].reverse()) {
      await mod.reset();
    }
    console.log('\n✅ Seed data reset complete.\n');
  } else {
    const { User } = require('../models');
    const exists = await User.findOne({ where: { email: 'seed-0@test.com' } });
    if (exists) {
      console.error('\n❌ Seed data already exists. Run `npm run seed:reset` first.\n');
      process.exit(1);
    }

    console.log('\n🌱 Seeding data...\n');
    for (const mod of modules) {
      await mod.seed();
    }
    console.log('\n✅ Seed complete.\n');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
