/**
 * 清除所有用户数据脚本
 * 用于密码哈希方案升级后，清除旧用户让其重新注册
 *
 * 使用方式: node scripts/clearUsers.js
 */

require('dotenv').config();
const { sequelize } = require('../config/database');

async function clearAllUsers() {
  try {
    console.log('正在连接数据库...');
    await sequelize.authenticate();
    console.log('数据库连接成功');

    console.log('\n开始清除用户相关数据...\n');

    // 禁用外键检查
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    const tables = [
      'user_announcement_reads',
      'comment_likes',
      'post_comment_likes',
      'post_reports',
      'post_comments',
      'post_likes',
      'post_favorites',
      'post_follows',
      'posts',
      'submission_status_histories',
      'submissions',
      'manuscripts',
      'user_badges',
      'follows',
      'favorites',
      'comments',
      'users'
    ];

    for (const table of tables) {
      try {
        await sequelize.query(`TRUNCATE TABLE ${table}`);
        console.log(`✓ 已清除表: ${table}`);
      } catch (err) {
        console.log(`⚠ 跳过表 ${table}: ${err.message}`);
      }
    }

    // 重新启用外键检查
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n========================================');
    console.log('✅ 所有用户数据已清除');
    console.log('   用户现在需要重新注册');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ 清除失败:', error.message);
    process.exit(1);
  }
}

clearAllUsers();
