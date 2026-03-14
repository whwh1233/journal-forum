'use strict';

const { Announcement, UserAnnouncementRead, User } = require('../../models');
const { Op } = require('sequelize');
const { getSeedUserIds } = require('./users');

async function seed() {
  const admin = await User.findOne({ where: { email: 'seed-48@test.com' } });
  if (!admin) {
    console.warn('[seed:announcements] Admin user seed-48@test.com not found. Skipping.');
    return;
  }

  const creatorId = admin.id;

  const announcements = [
    {
      title: '欢迎来到投哪儿学术交流平台',
      content:
        '欢迎加入投哪儿！这是一个专注于学术期刊评价与交流的平台，汇聚了来自各高校和科研机构的学者与研究人员。' +
        '在这里，您可以浏览期刊详情、发表真实的投稿体验评价，并与志同道合的科研伙伴交流心得。' +
        '希望投哪儿能成为您科研之路上的得力助手，祝您在学术探索中取得丰硕成果！',
      type: 'banner',
      status: 'active',
      targetType: 'all',
      colorScheme: 'info',
      isPinned: true,
      priority: 0,
      startTime: null,
      endTime: null,
      targetRoles: null,
      targetUserIds: null,
      customColor: null,
      creatorId,
    },
    {
      title: '系统升级公告：评论功能优化',
      content:
        '我们近期对评论系统进行了全面升级，新增了三层嵌套回复功能，让学术讨论更加深入和有序。' +
        '同时优化了评论的排序算法，优质评论将获得更高的展示优先级，帮助用户快速找到最有价值的投稿经验。' +
        '如在使用过程中遇到任何问题，欢迎通过帖子区反馈，我们将持续改进平台体验。',
      type: 'normal',
      status: 'active',
      targetType: 'all',
      colorScheme: 'success',
      isPinned: false,
      priority: 0,
      startTime: null,
      endTime: null,
      targetRoles: null,
      targetUserIds: null,
      customColor: null,
      creatorId,
    },
    {
      title: '管理员操作指南更新',
      content:
        '管理后台新增了批量操作功能，管理员现在可以一次性审核或删除多条评论，大幅提升内容管理效率。' +
        '同时更新了用户管理模块，支持按角色、注册时间和活跃度筛选用户，并新增了用户封禁和解封的快捷操作。' +
        '请各位管理员查阅最新的操作指南文档，确保熟悉新增功能的使用方式。',
      type: 'normal',
      status: 'active',
      targetType: 'role',
      targetRoles: ['admin', 'superadmin'],
      colorScheme: 'info',
      isPinned: false,
      priority: 0,
      startTime: null,
      endTime: null,
      targetUserIds: null,
      customColor: null,
      creatorId,
    },
    {
      title: '2025年度期刊数据更新完成',
      content:
        '2025年度各期刊的影响因子和收录信息已全部更新完毕，涵盖SCI、EI、SSCI等主要检索库的最新数据。' +
        '本次更新新增了约500本新期刊，并对现有期刊的分区信息进行了全面校订，数据来源参考最新发布的JCR报告。' +
        '感谢社区成员长期以来的数据勘误贡献，正是大家的共同努力让平台数据更加准确可靠。',
      type: 'normal',
      status: 'archived',
      targetType: 'all',
      colorScheme: 'info',
      isPinned: false,
      priority: 0,
      startTime: null,
      endTime: null,
      targetRoles: null,
      targetUserIds: null,
      customColor: null,
      creatorId,
    },
    {
      title: '紧急：数据库维护通知',
      content:
        '计划于本周六凌晨02:00至05:00进行数据库维护，届时平台将暂停服务，所有功能不可用，请提前做好相关安排。' +
        '本次维护主要目的是对数据库进行索引优化和存储扩容，预计维护完成后平台查询速度将提升约30%。' +
        '若维护时间有变动，我们将提前通过本公告渠道发布更新，感谢您的理解与支持。',
      type: 'urgent',
      status: 'draft',
      targetType: 'all',
      colorScheme: 'error',
      isPinned: false,
      priority: 10,
      startTime: null,
      endTime: null,
      targetRoles: null,
      targetUserIds: null,
      customColor: null,
      creatorId,
    },
  ];

  await Announcement.bulkCreate(announcements, { validate: true });
  console.log(`[seed:announcements] Created ${announcements.length} seed announcements.`);
}

async function reset() {
  const seedUserIds = await getSeedUserIds();

  const readDeleted = await UserAnnouncementRead.destroy({
    where: {
      userId: { [Op.in]: seedUserIds },
    },
  });

  const announcementDeleted = await Announcement.destroy({
    where: {
      creatorId: { [Op.in]: seedUserIds },
    },
  });

  console.log(
    `[seed:announcements] Deleted ${announcementDeleted} seed announcements and ${readDeleted} read records.`
  );
}

module.exports = { seed, reset };
