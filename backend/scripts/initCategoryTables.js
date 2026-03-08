/**
 * 初始化分类表
 * 运行: node scripts/initCategoryTables.js
 */

require('dotenv').config();
const { sequelize, Category, JournalCategoryMap } = require('../models');

async function initTables() {
  try {
    console.log('正在连接数据库...');
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 同步 Category 和 JournalCategoryMap 表
    console.log('正在创建 online_categories 表...');
    await Category.sync({ alter: true });
    console.log('online_categories 表创建成功');

    console.log('正在创建 online_journal_category_map 表...');
    await JournalCategoryMap.sync({ alter: true });
    console.log('online_journal_category_map 表创建成功');

    // 检查是否已有数据
    const count = await Category.count();
    if (count === 0) {
      console.log('表为空，可以导入分类数据');
    } else {
      console.log(`表中已有 ${count} 条分类数据`);
    }

    console.log('\n✅ 分类表初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error.message);
    process.exit(1);
  }
}

initTables();
