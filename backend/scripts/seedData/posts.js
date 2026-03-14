'use strict';

const { faker } = require('@faker-js/faker/locale/zh_CN');
const { Post, PostComment, PostCommentLike, Journal, User } = require('../../models');
const { Op } = require('sequelize');
const { getSeedUserIds } = require('./users');

const CATEGORIES = ['experience', 'discussion', 'question', 'news', 'review', 'other'];

const TAGS = [
  'SCI期刊', 'EI期刊', 'CSSCI', '北大核心', 'SSCI', 'A类期刊', 'B类期刊',
  '投稿经验', '审稿周期', '版面费', '开放获取', '影响因子', '期刊推荐',
  '撤稿', '论文写作', '摘要写作', '参考文献', '学术不端', '同行评审',
  '快速审稿', '退稿', '修改意见', '接受率', '国内期刊', '国际期刊'
];

// 30+ varied Chinese academic forum post title templates (no journal name)
const GENERAL_TITLE_TEMPLATES = [
  '请问{category}类期刊投稿需要注意哪些问题？',
  '分享一下我最近投稿被拒的经历和教训',
  '关于版面费的问题，大家怎么看？',
  '审稿周期超过6个月，还要继续等吗？',
  '第一次投SCI期刊，有什么建议吗？',
  '推荐几本审稿快、录用率高的期刊',
  '收到修改意见，该如何有效回应审稿人？',
  '投稿后一直没有收到回复，该怎么处理？',
  '开放获取期刊和传统期刊的优劣对比',
  '影响因子到底有多重要？',
  '如何判断一个期刊是否靠谱？',
  '关于论文一稿多投的问题，求解惑',
  '审稿意见只有一句话算正常吗？',
  '如何在短时间内提高论文被录用的概率？',
  '北大核心期刊和CSSCI期刊有何区别？',
  '论文被接受后，后续流程是怎样的？',
  '期刊编辑回复说"修改后再审"，胜算有多大？',
  '关于论文预印本和期刊投稿的问题',
  '如何提高论文英文摘要的质量？',
  '遇到了疑似掠夺性期刊，该怎么办？',
  '期刊投稿系统用不了，如何联系编辑？',
  '如何平衡科研产出质量和数量的关系？',
  '被同一个审稿人连续拒稿怎么办？',
  '论文参考文献格式不统一，会影响审稿吗？',
  '博士生应该优先投哪个层次的期刊？',
  '关于学术不端检测系统的一些问题',
  '期刊特刊征稿靠谱吗？有没有投过的？',
  '如何有效地追踪论文投稿状态？',
  '编委会成员审稿和外审有什么区别？',
  '发表论文挂通讯作者的规则是什么？',
  '一篇论文被拒了三次，还值得修改重投吗？',
  '国内外期刊审稿流程有哪些主要差异？',
  '如何处理多位作者之间的署名顺序争议？',
  '期刊审稿费和版面费的行业潜规则',
  '有没有好用的期刊投稿管理工具推荐？',
];

// Journal-linked title templates (use {journalName} placeholder)
const JOURNAL_TITLE_TEMPLATES = [
  '关于{journalName}的投稿经验分享',
  '{journalName}审稿周期到底有多长？',
  '{journalName}的版面费标准是怎样的？',
  '{journalName}投稿被拒，有没有类似经历？',
  '请问{journalName}的录用率大概是多少？',
  '{journalName}最近审稿变慢了，有同感吗？',
  '{journalName}退稿后还能修改重投吗？',
  '分享我在{journalName}发文的完整经历',
  '{journalName}的审稿意见质量如何？',
  '{journalName}是真的SCI还是假的？求辨别',
  '{journalName}改版之后影响因子变化大吗？',
  '在{journalName}发文后对晋升有帮助吗？',
];

// 20+ Chinese discussion reply content templates
const COMMENT_TEMPLATES = [
  '我也遇到过类似的情况，当时等了将近{n}个月才收到回复，最后是小修后接受的。',
  '这个问题很有代表性，建议楼主直接给编辑发邮件催稿，礼貌地询问审稿进度。',
  '个人经验：这类期刊审稿一般在{n}到{n2}个月之间，超过这个时间可以考虑撤稿转投。',
  '赞同楼上的说法，版面费在行业内确实差异很大，不能单纯以版面费高低判断期刊质量。',
  '补充一点：审稿意见的质量很大程度上取决于审稿人的认真程度，有时候遇到好的审稿人真的很幸运。',
  '楼主的经历让我想起了我第一次投稿的情形，当时也是紧张了很久，后来慢慢就习惯了。',
  '这本期刊我投过，审稿周期大概{n}个月，编辑态度很好，建议推荐给有需要的同学。',
  '感谢分享！这种一手经验对我们这些新手太有用了，收藏了。',
  '我觉得关键还是看论文本身的质量，期刊选择固然重要，但内容才是核心竞争力。',
  '请问楼主当时投的是什么方向的稿子？不同研究领域在同一本期刊的录用率可能差别很大。',
  '说到这个，我想分享一个教训：一定要仔细阅读作者须知，格式问题是很多稿子被直接拒的原因。',
  '这个问题没有标准答案，建议结合自身情况综合考虑，不要盲目跟风追高分期刊。',
  '楼主加油！第一次发表确实会有很多不确定性，但坚持下去一定会有好结果的。',
  '我在这本期刊上发过文章，可以加我私聊，给你分享一些内部经验。',
  '从编辑的角度来说，投稿规范性非常重要，很多稿子连初审都过不了就是因为格式不对。',
  '关于这个问题，我查过一些数据：该领域top期刊的平均拒稿率大概在{pct}%左右。',
  '支持楼主的看法，不过我觉得还需要考虑一下目标读者群体，这对选择期刊也有很大影响。',
  '经历过类似的，当时收到一大堆修改意见，逐一回复花了将近{n}周，最终还是接受了。',
  '这种情况在学术圈其实很普遍，大家不要太焦虑，按流程走就好了。',
  '强烈建议使用投稿管理软件记录每次投稿的状态，方便后续跟进和统计。',
  '我导师说过，好的论文在哪儿投都能发出去，关键是要有足够的耐心和信心。',
  '楼主说的情况我也听说过，不过每个期刊的政策不一样，最好直接联系编辑部确认。',
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr, n = 1) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return n === 1 ? shuffled[0] : shuffled.slice(0, n);
}

function fillTemplate(template) {
  return template
    .replace(/{n2}/g, String(randomInt(4, 8)))
    .replace(/{n}/g, String(randomInt(2, 6)))
    .replace(/{pct}/g, String(randomInt(60, 90)))
    .replace(/{category}/g, pickRandom(['理工科', '人文社科', '医学', '经济管理', '综合']));
}

async function seed() {
  // 1. Get seed users (id + name)
  const seedUsers = await User.findAll({
    where: {
      email: { [Op.like]: 'seed-%@test.com' }
    },
    attributes: ['id', 'name']
  });

  if (seedUsers.length === 0) {
    console.log('[seed:posts] No seed users found. Run seed:users first.');
    return;
  }

  // 2. Get journals (journalId + name)
  const journals = await Journal.findAll({
    attributes: ['journalId', 'name'],
    limit: 200
  });

  const POST_COUNT = 100;
  const postsData = [];

  for (let i = 0; i < POST_COUNT; i++) {
    const user = pickRandom(seedUsers);
    const withJournal = Math.random() < 0.4 && journals.length > 0;
    let title;
    let journalId = null;

    if (withJournal) {
      const journal = pickRandom(journals);
      journalId = journal.journalId;
      const template = pickRandom(JOURNAL_TITLE_TEMPLATES);
      title = template.replace('{journalName}', journal.name);
    } else {
      const template = pickRandom(GENERAL_TITLE_TEMPLATES);
      title = fillTemplate(template);
    }

    // Ensure title doesn't exceed 200 chars
    if (title.length > 200) {
      title = title.slice(0, 197) + '...';
    }

    const paragraphCount = randomInt(2, 5);
    const content = faker.lorem.paragraphs(paragraphCount, '\n\n');
    const category = pickRandom(CATEGORIES);
    const tagCount = randomInt(1, 3);
    const tags = pickRandom(TAGS, tagCount);

    postsData.push({
      userId: user.id,
      title,
      content,
      category,
      tags,
      journalId,
      viewCount: randomInt(0, 500),
      likeCount: 0,
      commentCount: 0,
      favoriteCount: 0,
      followCount: 0,
      hotScore: parseFloat((Math.random() * 100).toFixed(2)),
      isPinned: false,
      isDeleted: false,
      status: 'published'
    });
  }

  // 3. BulkCreate posts
  await Post.bulkCreate(postsData, { validate: true });
  console.log(`[seed:posts] Created ${POST_COUNT} seed posts.`);

  // 4. Query back for post IDs
  const createdPosts = await Post.findAll({
    where: {
      userId: { [Op.in]: seedUsers.map(u => u.id) },
      isDeleted: false,
      status: 'published'
    },
    attributes: ['id', 'userId'],
    order: [['id', 'DESC']],
    limit: POST_COUNT
  });

  if (createdPosts.length === 0) {
    console.log('[seed:posts] Could not find created posts to attach comments.');
    return;
  }

  // 5. Generate ~300 post comments spread across posts
  // ~210 top-level, ~90 replies
  const TOTAL_COMMENTS = 300;
  const TOP_LEVEL_COUNT = 210;
  const REPLY_COUNT = TOTAL_COMMENTS - TOP_LEVEL_COUNT;

  // Build a user lookup map
  const userMap = {};
  for (const u of seedUsers) {
    userMap[u.id] = u.name;
  }

  // Spread comments across posts (some posts get more, some fewer)
  // Assign top-level comments per post proportionally
  const postIds = createdPosts.map(p => p.id);

  // Create a comment distribution: randomize how many comments each post gets
  const commentDist = new Array(postIds.length).fill(0);
  for (let i = 0; i < TOP_LEVEL_COUNT; i++) {
    commentDist[i % postIds.length]++;
  }
  // Shuffle distribution for variety
  for (let i = commentDist.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [commentDist[i], commentDist[j]] = [commentDist[j], commentDist[i]];
  }

  let totalCommentsCreated = 0;
  let totalRepliesCreated = 0;

  // Track how many replies we still need to create
  let repliesRemaining = REPLY_COUNT;

  for (let pi = 0; pi < postIds.length; pi++) {
    const postId = postIds[pi];
    const topLevelForThisPost = commentDist[pi];

    if (topLevelForThisPost === 0) continue;

    const createdTopLevel = [];

    // Create top-level comments for this post
    for (let ci = 0; ci < topLevelForThisPost; ci++) {
      const user = pickRandom(seedUsers);
      const template = pickRandom(COMMENT_TEMPLATES);
      const content = fillTemplate(template);

      const comment = await PostComment.create({
        postId,
        userId: user.id,
        userName: userMap[user.id] || user.name,
        parentId: null,
        content,
        likeCount: randomInt(0, 20),
        isDeleted: false
      });
      createdTopLevel.push(comment);
      totalCommentsCreated++;
    }

    // Distribute replies to this post proportionally
    // Roughly: replies proportional to top-level count among posts
    const isLastPost = pi === postIds.length - 1;
    const repliesForThisPost = isLastPost
      ? repliesRemaining
      : Math.min(
          repliesRemaining,
          Math.round(REPLY_COUNT * (topLevelForThisPost / TOP_LEVEL_COUNT))
        );

    if (repliesForThisPost > 0 && createdTopLevel.length > 0) {
      // Track depth: commentId -> depth (1 = top-level, 2 = reply to top, 3 = reply to reply)
      const depthMap = {};
      for (const c of createdTopLevel) {
        depthMap[c.id] = 1;
      }

      // All eligible parents (depth < 3)
      const eligibleParents = [...createdTopLevel];

      for (let ri = 0; ri < repliesForThisPost; ri++) {
        if (eligibleParents.length === 0) break;

        const parentComment = pickRandom(eligibleParents);
        const parentDepth = depthMap[parentComment.id] || 1;

        const user = pickRandom(seedUsers);
        const template = pickRandom(COMMENT_TEMPLATES);
        const content = fillTemplate(template);

        const reply = await PostComment.create({
          postId,
          userId: user.id,
          userName: userMap[user.id] || user.name,
          parentId: parentComment.id,
          content,
          likeCount: randomInt(0, 10),
          isDeleted: false
        });

        const replyDepth = parentDepth + 1;
        depthMap[reply.id] = replyDepth;

        // Only add to eligible parents if depth < 3
        if (replyDepth < 3) {
          eligibleParents.push(reply);
        }

        totalRepliesCreated++;
        repliesRemaining--;
      }
    }

    // Update commentCount for this post
    const actualCount = await PostComment.count({
      where: { postId, isDeleted: false }
    });
    await Post.update({ commentCount: actualCount }, { where: { id: postId } });
  }

  console.log(`[seed:posts] Created ${totalCommentsCreated} top-level comments and ${totalRepliesCreated} replies (total: ${totalCommentsCreated + totalRepliesCreated}).`);
}

async function reset() {
  const seedUserIds = await getSeedUserIds();

  if (seedUserIds.length === 0) {
    console.log('[seed:posts] No seed users found, nothing to reset.');
    return;
  }

  // 1. Delete PostCommentLikes by seed users
  const likesDeleted = await PostCommentLike.destroy({
    where: { userId: { [Op.in]: seedUserIds } }
  });
  console.log(`[seed:posts] Deleted ${likesDeleted} post comment likes.`);

  // 2. Delete PostComments by seed users
  const commentsDeleted = await PostComment.destroy({
    where: { userId: { [Op.in]: seedUserIds } }
  });
  console.log(`[seed:posts] Deleted ${commentsDeleted} post comments.`);

  // 3. Delete Posts by seed users
  const postsDeleted = await Post.destroy({
    where: { userId: { [Op.in]: seedUserIds } }
  });
  console.log(`[seed:posts] Deleted ${postsDeleted} posts.`);
}

module.exports = { seed, reset };
