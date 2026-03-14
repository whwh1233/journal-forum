'use strict';

const { faker } = require('@faker-js/faker/locale/zh_CN');
const bcrypt = require('bcryptjs');
const { User } = require('../../models');
const { Op } = require('sequelize');

const SEED_COUNT = 50;
const SEED_PASSWORD = 'SeedPass123!';

const CHINESE_UNIVERSITIES = [
  '北京大学',
  '清华大学',
  '复旦大学',
  '上海交通大学',
  '浙江大学',
  '南京大学',
  '中国科学技术大学',
  '武汉大学',
  '华中科技大学',
  '中山大学',
  '四川大学',
  '哈尔滨工业大学',
  '西安交通大学',
  '同济大学',
  '南开大学',
  '天津大学',
  '北京师范大学',
  '中国人民大学',
  '吉林大学',
  '山东大学'
];

async function seed() {
  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);

  const users = [];
  for (let i = 0; i < SEED_COUNT; i++) {
    let role;
    if (i === 49) {
      role = 'superadmin';
    } else if (i === 48) {
      role = 'admin';
    } else {
      role = 'user';
    }

    users.push({
      email: `seed-${i}@test.com`,
      password: hashedPassword,
      name: faker.person.fullName(),
      bio: faker.lorem.sentence(),
      institution: CHINESE_UNIVERSITIES[i % CHINESE_UNIVERSITIES.length],
      role,
      status: 'active'
    });
  }

  await User.bulkCreate(users, { validate: true });
  console.log(`[seed:users] Created ${SEED_COUNT} seed users.`);
}

async function reset() {
  const deleted = await User.destroy({
    where: {
      email: {
        [Op.like]: 'seed-%@test.com'
      }
    }
  });
  console.log(`[seed:users] Deleted ${deleted} seed users.`);
}

async function getSeedUserIds() {
  const users = await User.findAll({
    where: {
      email: {
        [Op.like]: 'seed-%@test.com'
      }
    },
    attributes: ['id']
  });
  return users.map(u => u.id);
}

module.exports = { seed, reset, getSeedUserIds };
