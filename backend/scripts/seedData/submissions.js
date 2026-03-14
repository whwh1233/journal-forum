'use strict';

const { faker } = require('@faker-js/faker/locale/zh_CN');
const { Manuscript, Submission, SubmissionStatusHistory, Journal } = require('../../models');
const { Op } = require('sequelize');
const { getSeedUserIds } = require('./users');

const MANUSCRIPT_COUNT = 50;

const FIELDS = [
  '自然语言处理', '计算机视觉', '机器学习', '数据挖掘', '信息安全',
  '物联网', '区块链', '量子计算', '生物信息学', '材料科学'
];

const METHODS = [
  '深度学习', '强化学习', '迁移学习', '联邦学习', '图神经网络',
  '注意力机制', 'Transformer', '生成对抗网络'
];

const SCENARIOS = [
  '医疗影像分析', '金融风险预测', '智慧城市管理', '工业缺陷检测',
  '教育资源推荐', '农业病害识别', '交通流量预测', '电力系统优化'
];

const PAPER_TITLE_TEMPLATES = [
  (f, m) => `基于${m}的${f}研究`,
  (f, m) => `${m}在${f}中的应用与优化`,
  (f, m) => `面向${f}的${m}方法研究`,
  (f, m) => `融合${m}的${f}关键技术`,
  (f, m) => `${f}中的${m}模型设计与实现`,
  (f, _, s) => `基于${f}技术的${s}方法研究`,
  (f, m, s) => `${m}驱动的${s}${f}框架`,
  (f, m) => `自适应${m}在${f}领域的探索`,
  (f, m, s) => `面向${s}场景的${f}${m}研究`,
  (f, m) => `改进型${m}算法在${f}中的应用`,
  (f, _, s) => `${s}场景下${f}的挑战与突破`,
  (f, m) => `多模态${m}辅助的${f}综合研究`,
  (f, m, s) => `基于${m}的${s}${f}优化策略`,
  (f, m) => `轻量化${m}网络在${f}中的实践`,
  (f, m) => `${f}视角下的${m}效率提升`,
  (f, m, s) => `${m}与${f}融合的${s}解决方案`,
  (f, m) => `可解释${m}在${f}任务中的研究`,
  (f, _, s) => `${s}场景的${f}算法综述与展望`,
  (f, m) => `基于${m}的跨域${f}迁移学习`,
  (f, m, s) => `${m}增强的${f}技术在${s}中的应用`,
  (f, m) => `${f}领域${m}模型压缩与加速研究`,
  (f, m, s) => `面向${s}的${f}${m}联合优化`,
];

const STATUS_CHAINS = {
  accepted: [
    ['submitted', 'with_editor', 'under_review', 'minor_revision', 'revision_submitted', 'accepted'],
    ['submitted', 'with_editor', 'under_review', 'major_revision', 'revision_submitted', 'under_review', 'minor_revision', 'revision_submitted', 'accepted'],
  ],
  rejected: [
    ['submitted', 'with_editor', 'under_review', 'rejected'],
    ['submitted', 'with_editor', 'rejected'],
  ],
  under_review: [
    ['submitted', 'with_editor', 'under_review'],
  ],
  major_revision: [
    ['submitted', 'with_editor', 'under_review', 'major_revision'],
  ],
  minor_revision: [
    ['submitted', 'with_editor', 'under_review', 'minor_revision'],
  ],
  submitted: [
    ['submitted'],
  ],
};

const STATUS_NOTES = {
  with_editor: ['稿件已收到，正在分配编辑', '稿件已进入编辑处理阶段'],
  under_review: ['审稿意见已发送', '稿件已送外审', '正在进行同行评审'],
  major_revision: ['请按审稿意见进行大修后重新提交', '需要对研究方法和结果进行重大修改'],
  minor_revision: ['请按审稿意见进行小修后重新提交', '仅需对文字和格式进行少量修改'],
  revision_submitted: ['修改稿已收到，正在复审', '感谢您的认真修改'],
  accepted: ['恭喜！稿件已被录用', '稿件录用，将安排发表'],
  rejected: ['稿件不符合本刊收录范围', '经审稿人评审，稿件未达到录用标准'],
};

function pickWeightedStatus() {
  const rand = Math.random();
  if (rand < 0.30) return 'accepted';
  if (rand < 0.55) return 'rejected';
  if (rand < 0.75) return 'under_review';
  if (rand < 0.85) return 'major_revision';
  if (rand < 0.95) return 'minor_revision';
  return 'submitted';
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function randomDateInLastMonths(months) {
  const now = new Date();
  const past = new Date();
  past.setMonth(past.getMonth() - months);
  const ms = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(ms).toISOString().slice(0, 10);
}

function generateTitle() {
  const template = PAPER_TITLE_TEMPLATES[Math.floor(Math.random() * PAPER_TITLE_TEMPLATES.length)];
  const field = FIELDS[Math.floor(Math.random() * FIELDS.length)];
  const method = METHODS[Math.floor(Math.random() * METHODS.length)];
  const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
  return template(field, method, scenario);
}

async function seed() {
  const userIds = await getSeedUserIds();
  if (userIds.length === 0) {
    console.warn('[seed:submissions] No seed users found. Run seed:users first.');
    return;
  }

  const journals = await Journal.findAll({ attributes: ['journalId', 'name'] });
  if (journals.length === 0) {
    console.warn('[seed:submissions] No journals found. Run seed:journals first.');
    return;
  }

  // Create 50 manuscripts
  const manuscriptData = [];
  for (let i = 0; i < MANUSCRIPT_COUNT; i++) {
    manuscriptData.push({
      userId: userIds[Math.floor(Math.random() * userIds.length)],
      title: generateTitle(),
      currentStatus: 'drafting',
    });
  }

  const manuscripts = await Manuscript.bulkCreate(manuscriptData, { validate: true });
  console.log(`[seed:submissions] Created ${manuscripts.length} manuscripts.`);

  // Create ~80 submissions (1-2 per manuscript)
  let submissionCount = 0;
  let historyCount = 0;

  for (const manuscript of manuscripts) {
    const numSubmissions = Math.random() < 0.6 ? 1 : 2;
    let latestStatus = 'drafting';

    for (let s = 0; s < numSubmissions; s++) {
      const journal = journals[Math.floor(Math.random() * journals.length)];
      const submissionDate = randomDateInLastMonths(6);
      const finalStatus = pickWeightedStatus();

      const submission = await Submission.create({
        userId: manuscript.userId,
        manuscriptId: manuscript.id,
        journalId: journal.journalId,
        journalName: journal.name,
        submissionDate,
        status: finalStatus,
      });

      submissionCount++;

      // Build status history
      const chains = STATUS_CHAINS[finalStatus];
      const chain = chains[Math.floor(Math.random() * chains.length)];

      let currentDate = submissionDate;
      const historyRecords = [];

      for (const statusStep of chain) {
        const notes = STATUS_NOTES[statusStep];
        const note = notes && Math.random() < 0.6
          ? notes[Math.floor(Math.random() * notes.length)]
          : null;

        historyRecords.push({
          submissionId: submission.id,
          status: statusStep,
          date: currentDate,
          note,
        });

        const daysToAdd = 7 + Math.floor(Math.random() * 24); // 7-30 days
        currentDate = addDays(currentDate, daysToAdd);
      }

      await SubmissionStatusHistory.bulkCreate(historyRecords, { validate: true });
      historyCount += historyRecords.length;

      latestStatus = finalStatus;
    }

    // Update manuscript's currentStatus to match latest submission's status
    await manuscript.update({ currentStatus: latestStatus });
  }

  console.log(`[seed:submissions] Created ${submissionCount} submissions.`);
  console.log(`[seed:submissions] Created ${historyCount} status history records.`);
}

async function reset() {
  const userIds = await getSeedUserIds();
  if (userIds.length === 0) {
    console.log('[seed:submissions] No seed users found, nothing to reset.');
    return;
  }

  // Find all submission IDs belonging to seed users
  const submissions = await Submission.findAll({
    where: { userId: { [Op.in]: userIds } },
    attributes: ['id'],
  });
  const submissionIds = submissions.map(s => s.id);

  // Delete status history for those submissions
  let deletedHistory = 0;
  if (submissionIds.length > 0) {
    deletedHistory = await SubmissionStatusHistory.destroy({
      where: { submissionId: { [Op.in]: submissionIds } },
    });
  }

  // Delete submissions
  const deletedSubmissions = await Submission.destroy({
    where: { userId: { [Op.in]: userIds } },
  });

  // Delete manuscripts
  const deletedManuscripts = await Manuscript.destroy({
    where: { userId: { [Op.in]: userIds } },
  });

  console.log(`[seed:submissions] Deleted ${deletedHistory} status history records.`);
  console.log(`[seed:submissions] Deleted ${deletedSubmissions} submissions.`);
  console.log(`[seed:submissions] Deleted ${deletedManuscripts} manuscripts.`);
}

module.exports = { seed, reset };
