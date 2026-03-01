const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const path = require('path');
const fs = require('fs');

// 我们需要临时连接到 test 数据库
process.env.NODE_ENV = 'test';
const { connectDB, getDB } = require('../config/databaseLowdb');
const badgeService = require('../services/badgeService');

const initialBadges = require('../data/initialBadges').initialBadges;

const generateData = async () => {
    console.log('开始生成独立测试环境数据...');
    await connectDB();
    const db = getDB();

    // 清空除了基础结构外的所有数据
    db.data.users = [];
    db.data.journals = [];
    db.data.comments = [];
    db.data.favorites = [];
    db.data.follows = [];
    db.data.badges = initialBadges;
    db.data.userBadges = [];

    const defaultPassword = await bcrypt.hash('123456', 12);

    // 1. 生成用户 (网名风格)
    const usersTemplate = [
        { email: 'user1@test.com', name: '代码搬运工', bio: '只要 Ctrl+C 不坏，我就能写代码', institution: '家里蹲大学', title: '全栈开发' },
        { email: 'user2@test.com', name: '深夜撸串', bio: '不吃宵夜是没有灵魂的', institution: '干饭人协会', title: '资深吃货' },
        { email: 'user3@test.com', name: '学术垃圾制造机', bio: '每天都在制造新的学术垃圾', institution: '某不知名研究所', title: '苦逼研究生' },
        { email: 'user4@test.com', name: '前端切图仔', bio: 'CSS 才是世界上最好的语言', institution: '大厂打工仔', title: '前端工程师' },
        { email: 'user5@test.com', name: '不掉发的研究僧', bio: '只要我不洗头，就没人知道我掉头发', institution: '家里蹲大学', title: '在读硕士' },
        { email: 'user6@test.com', name: '摸鱼大师', bio: '只要老板看不见，我就是在工作', institution: '摸鱼协会', title: '资深摸鱼专员' },
        { email: 'user7@test.com', name: '早睡早起', bio: '从今天起，做一个早睡早起的人', institution: '养生堂', title: '养生专家' },
        { email: 'user8@test.com', name: 'BUG粉碎机', bio: '没有我修不好的 BUG，如果有，那就是产品需求', institution: '大厂打工仔', title: '后端研发' },
        { email: 'user9@test.com', name: '发际线保卫者', bio: '誓死保卫最后一道防线', institution: '防脱发协会', title: '安全工程师' },
        { email: 'user10@test.com', name: '论文写不完', bio: 'Deadline 才是第一生产力', institution: '某不知名研究所', title: '博士在读' }
    ];

    /* 主账号 - 保留给您的主测试账号，用于接收粉丝和产生互动 */
    db.data.users.push({
        id: 999, // 故意设置一个不同的ID
        email: '1249156074@qq.com',
        password: defaultPassword,
        name: '超级管理员',
        avatar: '',
        bio: '系统总管',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString()
    });

    const users = usersTemplate.map((u, i) => ({
        id: i + 1,
        email: u.email,
        password: defaultPassword,
        name: u.name,
        avatar: '',
        bio: u.bio,
        institution: u.institution,
        location: '互联网',
        website: '',
        role: 'user',
        status: 'active',
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString()
    }));
    db.data.users.push(...users);

    // 2. 生成学术风格但通俗可读的期刊
    const journalsTemplate = [
        { title: '程序员颈椎保护指南', category: 'medicine', description: '专为久坐人群打造的康复与预防措施，拯救你的脖子。' },
        { title: '深夜外卖品鉴学报', category: 'life', description: '基于大数据分析的城市深夜餐饮质量评估。' },
        { title: 'JavaScript 框架发展史', category: 'computer-science', description: '从 jQuery 到 React/Vue 的演变与技术更迭反思。' },
        { title: '量子力学入门与放弃', category: 'physics', description: '从薛定谔的猫到平行宇宙，通俗易懂的劝退指南。' },
        { title: '摸鱼经济学', category: 'economics', description: '探讨如何在工作时长与个人产出之间取得微妙的平衡。' },
        { title: 'AI 绘画提示词工程学', category: 'computer-science', description: '如何用自然语言让 AI 画出你脑海中的画面。' },
        { title: '当代青年熬夜实录', category: 'sociology', description: '对现代人睡眠剥夺现象的社会学调查与反思。' },
        { title: '防脱发洗发水功效评估', category: 'biology', description: '市面常见防脱发产品的活性成分与实际效果盲测。' },
        { title: '开源项目生存指南', category: 'computer-science', description: '如何让你的 Github 项目获得 10k stars。' },
        { title: '人体工程学键盘评测', category: 'engineering', description: '不同配列键盘对程序员手腕健康的影响分析。' },
        { title: '猫咪语言翻译研究', category: 'biology', description: '初步探索猫咪叫声与情绪状态的映射关系。' },
        { title: '互联网行业黑话大全', category: 'linguistics', description: '赋能、抓手、闭环：当代企业词汇的语义解析。' },
        { title: '咖啡因耐受度与工作效率', category: 'medicine', description: '探讨咖啡因摄入量与程序员代码产出之间的非线性关系。' },
        { title: '如何优雅地写 BUG', category: 'computer-science', description: '反向工程：那些让人抓狂的隐蔽代码缺陷是如何产生的。' },
        { title: '下班后的时间管理', category: 'management', description: '拒绝躺平，如何在下班后提升自我的实践探索。' }
    ];

    const journals = journalsTemplate.map((j, i) => ({
        id: i + 1,
        title: j.title,
        issn: `1000-${1000 + i}`,
        category: j.category,
        rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
        description: j.description,
        reviews: [],
        createdAt: new Date(Date.now() - Math.random() * 5000000000).toISOString()
    }));
    db.data.journals = journals;

    // 3. 生成评论盖楼 (在前几本热门期刊下)
    // 期刊 1 盖楼
    const c1 = {
        id: `1-${Date.now()}-1`, userId: 1, userName: '代码搬运工', journalId: 1, parentId: null,
        content: '这篇文章简直是我的救星，照着做了几天感觉脖子舒服多了！', rating: 5, createdAt: new Date().toISOString(), isDeleted: false
    };
    const c2 = {
        id: `1-${Date.now()}-2`, userId: 2, userName: '深夜撸串', journalId: 1, parentId: c1.id,
        content: '真的有用吗？我最近脖子也咔咔响，先收藏了。', createdAt: new Date().toISOString(), isDeleted: false
    };
    const c3 = {
        id: `1-${Date.now()}-3`, userId: 1, userName: '代码搬运工', journalId: 1, parentId: c2.id,
        content: '强烈推荐里面那个热敷的方法。', createdAt: new Date().toISOString(), isDeleted: false
    };
    const c4 = {
        id: `1-${Date.now()}-4`, userId: 999, userName: '超级管理员', journalId: 1, parentId: c3.id,
        content: '亲身实践，确实有效。大家写代码也要注意休息哦。', createdAt: new Date().toISOString(), isDeleted: false
    };

    // 期刊 2 盖楼
    const c5 = {
        id: `2-${Date.now()}-5`, userId: 8, userName: 'BUG粉碎机', journalId: 2, parentId: null,
        content: '强烈抗议里面没有评测我最爱的那家烧烤！', rating: 3, createdAt: new Date().toISOString(), isDeleted: false
    };
    const c6 = {
        id: `2-${Date.now()}-6`, userId: 6, userName: '摸鱼大师', journalId: 2, parentId: c5.id,
        content: '兄弟哪家烧烤，求推荐指路。', createdAt: new Date().toISOString(), isDeleted: false
    };

    db.data.comments.push(c1, c2, c3, c4, c5, c6);

    // 4. 重磅戏：关注粉丝网络与收藏
    let followIdCounter = 1;
    let favIdCounter = 1;

    // 给每个人随机生成关注、粉丝、收藏
    for (let i = 1; i <= 10; i++) {
        // 随机收藏 2-5 本书
        const favCount = Math.floor(Math.random() * 4) + 2;
        for (let f = 0; f < favCount; f++) {
            const targetJ = Math.floor(Math.random() * 15) + 1;
            // 避免重复收藏同一本
            if (!db.data.favorites.some(fav => fav.userId === i && fav.journalId === targetJ)) {
                db.data.favorites.push({
                    id: favIdCounter++,
                    userId: i,
                    journalId: targetJ,
                    createdAt: new Date().toISOString()
                });
            }
        }

        // 随机关注别人 3-6 个人 (不包括自己)
        const followCount = Math.floor(Math.random() * 4) + 3;
        for (let k = 0; k < followCount; k++) {
            let targetUser = Math.floor(Math.random() * 10) + 1;
            // 强制有些人关注 999 账号，帮主账号刷粉丝
            if (Math.random() > 0.5) targetUser = 999;

            if (targetUser !== i && !db.data.follows.some(fl => fl.followerId === i && fl.followingId === targetUser)) {
                db.data.follows.push({
                    id: followIdCounter++,
                    followerId: i,
                    followingId: targetUser,
                    createdAt: new Date().toISOString()
                });
            }
        }
    }

    // 强行给 999 主账号填几条数据，确保Dashboard一开始就不为空
    db.data.favorites.push({ id: favIdCounter++, userId: 999, journalId: 1, createdAt: new Date().toISOString() });
    db.data.favorites.push({ id: favIdCounter++, userId: 999, journalId: 3, createdAt: new Date().toISOString() });
    db.data.follows.push({ id: followIdCounter++, followerId: 999, followingId: 1, createdAt: new Date().toISOString() });
    db.data.follows.push({ id: followIdCounter++, followerId: 999, followingId: 4, createdAt: new Date().toISOString() });

    console.log(`生成完成!\n- 用户数: ${db.data.users.length}\n- 期刊数: ${db.data.journals.length}\n- 评论数: ${db.data.comments.length}\n- 互动关联: ${db.data.follows.length} 个关注, ${db.data.favorites.length} 个收藏`);

    await db.write();

    // 5. 结算徽章 (计算在刚才的数据生成中获得的所有徽章)
    console.log('开始为测试用户结算初始徽章...');
    const allUserIds = [999, ...Array.from({ length: 10 }, (_, i) => i + 1)];
    for (const uid of allUserIds) {
        await badgeService.checkIdentityBadges(uid);
        await badgeService.checkAndGrantBadges(uid, 'commentCount');
        await badgeService.checkAndGrantBadges(uid, 'favoriteCount');
        await badgeService.checkAndGrantBadges(uid, 'followerCount');
    }
    console.log(`徽章结算完毕！总计颁发了 ${db.data.userBadges.length} 枚徽章。`);

    console.log('数据已写入 database.test.json。请尽情测试！');
};

generateData().catch(console.error);
