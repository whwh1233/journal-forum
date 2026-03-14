'use strict';

const { faker } = require('@faker-js/faker/locale/zh_CN');
const { Comment, CommentLike, Journal, JournalRatingCache } = require('../../models');
const { Op } = require('sequelize');
const { getSeedUserIds } = require('./users');
const { User } = require('../../models');

const DIMENSION_KEYS = ['reviewSpeed', 'editorAttitude', 'acceptDifficulty', 'reviewQuality', 'overallExperience'];

// 期刊评论内容模板（顶层评论，含评分）
const TOP_LEVEL_TEMPLATES = [
  '投稿后审稿周期较长，等了将近三个月才收到第一轮意见，审稿意见比较详细，编辑态度较好，但录用率偏低，总体体验一般。',
  '期刊审稿速度较快，从投稿到收到审稿意见只用了六周，审稿人给出了具体的修改建议，编辑回复邮件也很及时，整体体验不错。',
  '这本期刊在领域内认可度高，但录用难度较大，审稿周期约为四个月，两位审稿人意见有些矛盾，最终大修后接收，过程比较曲折。',
  '期刊的编委会由领域内知名学者组成，审稿意见质量较高，虽然录用率不高，但审稿过程对完善论文有很大帮助，值得投稿。',
  '第一次投这本期刊，审稿速度让我比较满意，约两个月收到意见，审稿人指出了论文中一个关键缺陷，修改后顺利接收。',
  '投稿后系统一直显示"Under Review"超过五个月，催稿后才有回音，最终被拒稿，理由是研究方向不符合期刊定位，建议投稿前仔细确认期刊范围。',
  '编辑对初稿给出了桌面拒稿，但附上了详细说明，认为研究问题新颖但方法论存在不足。按照意见修改后重新投稿，经过大修最终接收。',
  '小修后接收，审稿周期约三个月，两位审稿人都给出了建设性意见，编辑处理效率高，是一次比较愉快的投稿体验。',
  '期刊影响因子高，审稿严格，三位审稿人意见各有侧重，大修意见长达十几页，但每条意见都很有价值，修改后论文质量显著提升。',
  '审稿周期短，不到两个月就收到意见，但审稿意见比较简单，仅有几条格式性建议，缺乏实质性的学术反馈。',
  '投稿系统比较老旧，上传文件时频繁报错，联系编辑部后才解决，期望期刊能更新投稿系统，提升用户体验。',
  '审稿人之一明显对研究领域不熟悉，提出了一些与研究无关的问题，但编辑在综合意见后作出了合理判断，最终小修接收。',
  '期刊回复速度很快，投稿后三天内编辑就确认已送外审，全程透明，体验良好。',
  '经过两轮大修才最终接收，历时约八个月，过程较为漫长，但审稿意见严谨，对论文完善很有帮助。',
  '期刊在国内认可度高，是SCI检索期刊，录用标准严格。审稿意见专业详细，对提升论文质量有显著帮助，推荐投稿。',
  '投稿后不久就收到桌面拒稿，编辑认为论文创新性不足，与期刊整体水准不匹配，但给出的理由比较笼统，缺乏针对性。',
  '期刊审稿效率高，小修意见简洁明了，接收周期约两个月，非常适合需要快速发表成果的研究者。',
  '该期刊的审稿人反馈质量参差不齐，有的意见极为详细，有的仅一两行字，建议编辑部加强对审稿人的管理。',
  '投稿到接收历时约四个月，一次大修，审稿人对实验设计提出了合理改进建议，按照意见修改后论文质量明显提升。',
  '期刊版面费较高，录用后需要支付较大一笔费用，建议提前做好经费准备。整体来说，审稿流程规范，值得投稿。',
  '与编辑沟通非常顺畅，有疑问时均能及时得到回复。审稿周期约三个月，一次小修后接收，体验良好。',
  '该期刊审稿速度偏慢，三位审稿人中有一位拖了很久才给出意见，导致整体周期拉长，希望期刊加强对审稿人的督促。',
  '作为新兴领域的主流期刊，该刊发表的论文质量较高。审稿过程严格但公正，审稿意见有助于提升论文研究深度。',
  '投稿两周后收到拒稿通知，编辑认为论文与期刊当前征稿重点不符，建议转投其他期刊，响应速度较快。',
  '期刊在学界声誉良好，录用论文质量有保障。审稿周期约五个月，经历了两轮审稿，每轮意见都非常具体，有助于论文完善。',
  '审稿人的意见非常专业，涵盖了理论框架、实验方法和数据分析等多个层面，虽然修改工作量很大，但对提升论文质量帮助极大。',
  '该期刊编辑部服务态度好，在等待审稿期间也会定期更新进度，让投稿者不必过于焦虑。',
  '这本期刊审稿速度非常快，不到一个月就收到了意见，编辑态度专业，审稿意见简洁但切中要害。',
  '期刊近年来影响因子上升明显，录用标准相应提高，审稿周期也有所延长，但整体仍是该领域较好的选择。',
  '大修后接收，审稿人对文献综述和研究方法提出了详细改进建议，整改后论文逻辑更加严密，感谢审稿人的认真负责。',
  '该期刊的投稿系统较为便捷，操作简单，上传文件速度快，对提高投稿效率有很大帮助。',
  '编辑发来的拒稿信措辞客气，并建议了几本更适合该研究的期刊，体现了编辑部的专业素养，即便被拒也感到受到了尊重。',
  '期刊在国际上知名度较高，审稿人来自不同国家，意见视角多元，有助于提升论文的国际影响力。',
  '一审被拒，转换角度修改后重投，经历一次大修后成功接收，两次投稿共历时约七个月，整个过程收获颇多。',
  '期刊审稿意见整体质量较高，但两位审稿人对同一问题的看法存在分歧，幸好编辑给出了明确的处理建议，帮助顺利推进修改。',
];

// 回复评论内容模板
const REPLY_TEMPLATES = [
  '感谢分享，这对我决定是否投这本期刊很有帮助！',
  '请问这是最近的经历吗？我也在考虑投这本期刊。',
  '我的经历与你类似，审稿周期确实比较长，需要有足够的耐心。',
  '非常感谢你的详细介绍，对我很有参考价值。',
  '请问你投的是哪个方向的稿件？不同研究领域的审稿周期可能有所不同。',
  '我最近也在等这本期刊的审稿结果，你这条评论让我对结果有了更多预期。',
  '审稿人给了这么多修改意见，最终能接收也说明工作还是很有价值的，恭喜！',
  '这和我之前看到的其他评价一致，感觉这本期刊总体还是比较值得信赖的。',
  '请问版面费大概是多少？方便透露一下吗？',
  '编辑态度好确实很重要，能让整个投稿过程体验好很多。',
  '虽然审稿周期长，但能收到详细的审稿意见还是值得的，这对提升论文很有帮助。',
  '我投这本期刊等了四个多月，最终被拒，看来这是这本期刊的一贯风格。',
  '感谢分享这段经历！对准备投同类期刊的人来说非常有参考价值。',
  '看了你的评价，觉得这本期刊的审稿质量还是不错的，打算尝试一下。',
  '你说的审稿系统问题我也遇到了，希望期刊能尽快改进，提升投稿体验。',
  '请问通讯作者需要具体注意哪些事项？第一次投这本期刊，有些紧张。',
  '谢谢分享！这让我对这本期刊的整体流程有了清晰认识，决定先投试试。',
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function updateRatingCache(journalId) {
  const topLevelComments = await Comment.findAll({
    where: {
      journalId,
      parentId: null,
      isDeleted: false
    }
  });

  if (topLevelComments.length === 0) {
    await JournalRatingCache.destroy({ where: { journalId } });
    return;
  }

  const sums = {};
  const counts = {};
  for (const key of DIMENSION_KEYS) {
    sums[key] = 0;
    counts[key] = 0;
  }

  for (const c of topLevelComments) {
    if (c.dimensionRatings) {
      for (const key of DIMENSION_KEYS) {
        if (c.dimensionRatings[key] != null) {
          sums[key] += c.dimensionRatings[key];
          counts[key]++;
        }
      }
    }
  }

  const averages = {};
  for (const key of DIMENSION_KEYS) {
    averages[key] = counts[key] > 0 ? Math.round((sums[key] / counts[key]) * 10) / 10 : null;
  }

  const validAvgs = Object.values(averages).filter(v => v !== null);
  const rating = validAvgs.length > 0
    ? Math.round((validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length) * 10) / 10
    : 0;

  await JournalRatingCache.upsert({
    journalId,
    rating,
    ratingCount: topLevelComments.length,
    reviewSpeed: averages.reviewSpeed,
    editorAttitude: averages.editorAttitude,
    acceptDifficulty: averages.acceptDifficulty,
    reviewQuality: averages.reviewQuality,
    overallExperience: averages.overallExperience
  });
}

async function seed() {
  // 1. Get seed users (id + name)
  const seedUsers = await User.findAll({
    where: {
      email: {
        [Op.like]: 'seed-%@test.com'
      }
    },
    attributes: ['id', 'name']
  });

  if (seedUsers.length === 0) {
    console.warn('[seed:comments] No seed users found. Run seed:users first.');
    return;
  }

  // 2. Load all journals
  const journals = await Journal.findAll({ attributes: ['journalId', 'name'] });

  if (journals.length === 0) {
    console.warn('[seed:comments] No journals found in DB. Run seed:journals first.');
    return;
  }

  // 3. Generate ~140 top-level comments using bulkCreate, then fetch back for IDs
  const topLevelData = [];
  for (let i = 0; i < 140; i++) {
    const user = pickRandom(seedUsers);
    const journal = pickRandom(journals);

    const dimensionRatings = {
      reviewSpeed: randInt(1, 5),
      editorAttitude: randInt(1, 5),
      acceptDifficulty: randInt(1, 5),
      reviewQuality: randInt(1, 5),
      overallExperience: randInt(1, 5)
    };

    topLevelData.push({
      userId: user.id,
      userName: user.name,
      journalId: journal.journalId,
      parentId: null,
      content: pickRandom(TOP_LEVEL_TEMPLATES),
      rating: dimensionRatings.overallExperience,
      dimensionRatings,
      isDeleted: false,
      likeCount: 0
    });
  }

  // Use bulkCreate with returning IDs
  const createdTopLevel = await Comment.bulkCreate(topLevelData, { returning: true });
  console.log(`[seed:comments] Created ${createdTopLevel.length} top-level comments.`);

  // 4. Generate ~60 reply comments
  const replyData = [];
  for (let i = 0; i < 60; i++) {
    const user = pickRandom(seedUsers);
    const parentComment = pickRandom(createdTopLevel);

    replyData.push({
      userId: user.id,
      userName: user.name,
      journalId: parentComment.journalId,
      parentId: parentComment.id,
      content: pickRandom(REPLY_TEMPLATES),
      rating: null,
      dimensionRatings: null,
      isDeleted: false,
      likeCount: 0
    });
  }

  await Comment.bulkCreate(replyData);
  console.log(`[seed:comments] Created ${replyData.length} reply comments.`);

  // 5. Update JournalRatingCache for each journal that received comments
  const journalIdsWithComments = [...new Set(createdTopLevel.map(c => c.journalId))];

  for (const journalId of journalIdsWithComments) {
    await updateRatingCache(journalId);
  }

  console.log(`[seed:comments] Updated rating cache for ${journalIdsWithComments.length} journals.`);
  console.log(`[seed:comments] Done. Total comments: ${createdTopLevel.length + replyData.length}`);
}

async function reset() {
  const seedUserIds = await getSeedUserIds();

  if (seedUserIds.length === 0) {
    console.log('[seed:comments] No seed users found, nothing to reset.');
    return;
  }

  const likesDeleted = await CommentLike.destroy({
    where: {
      userId: {
        [Op.in]: seedUserIds
      }
    }
  });

  const commentsDeleted = await Comment.destroy({
    where: {
      userId: {
        [Op.in]: seedUserIds
      }
    }
  });

  console.log(`[seed:comments] Deleted ${likesDeleted} comment likes and ${commentsDeleted} comments.`);
}

module.exports = { seed, reset };
