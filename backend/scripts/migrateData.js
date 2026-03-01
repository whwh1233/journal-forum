/**
 * 数据迁移脚本：LowDB (JSON) → MySQL
 * 运行方法：node scripts/migrateData.js
 *
 * 迁移对象：
 *   users, journals, comments, favorites, follows, badges, userBadges
 *
 * 注意事项：
 *   - 用户 ID 从整数迁移为 UUID
 *   - 评论 ID 从字符串迁移为整数(auto-increment)，旧 ID 保存到 legacyId
 *   - 所有外键引用同步更新
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { connectDB } = require('../config/database');
const {
    sequelize,
    User,
    Journal,
    Comment,
    CommentLike,
    Favorite,
    Follow,
    Badge,
    UserBadge,
    syncDatabase
} = require('../models');

const DB_JSON_PATH = path.join(__dirname, '..', 'database.json');

// 用户 ID 映射表 (旧整数 ID → 新 UUID)
const userIdMap = {};
// 评论 ID 映射表 (旧字符串 ID → 新整数 ID)
const commentIdMap = {};
// 期刊 ID 映射 (可能需要，如果 JSON ID 和 DB 自增不一致)
const journalIdMap = {};

async function migrate() {
    console.log('========================================');
    console.log(' LowDB → MySQL 数据迁移');
    console.log('========================================\n');

    // 1. 读取 JSON 数据
    console.log('[1/8] 读取 database.json...');
    if (!fs.existsSync(DB_JSON_PATH)) {
        console.error('❌ database.json 不存在:', DB_JSON_PATH);
        process.exit(1);
    }
    const rawData = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf-8'));
    console.log(`  ✅ 读取完成：${Object.keys(rawData).length} 个集合`);

    // 2. 连接数据库并同步模型（force: true → 重建表）
    console.log('\n[2/8] 连接 MySQL 并创建表...');
    await connectDB();
    await syncDatabase({ force: true }); // ⚠️ 会清空现有数据
    // 临时禁用外键检查（迁移期间可能有孤立引用）
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('  ✅ 表创建完成（外键检查已暂时禁用）');

    // 3. 迁移用户
    console.log('\n[3/8] 迁移用户...');
    const users = rawData.users || [];
    for (const u of users) {
        const newId = uuidv4();
        userIdMap[String(u.id)] = newId;

        await User.unscoped().create({
            id: newId,
            email: u.email,
            password: u.password, // 已加密的密码直接迁移
            name: u.name || '',
            avatar: u.avatar || '',
            bio: u.bio || '',
            location: u.location || '',
            institution: u.institution || '',
            website: u.website || '',
            role: u.role || 'user',
            status: u.status || 'active',
            pinnedBadges: u.pinnedBadges || null,
            createdAt: u.createdAt || new Date(),
            updatedAt: u.createdAt || new Date()
        }, { silent: true });
    }
    console.log(`  ✅ 迁移 ${users.length} 个用户`);

    // 4. 迁移期刊
    console.log('\n[4/8] 迁移期刊...');
    const journals = rawData.journals || [];
    for (const j of journals) {
        const newJournal = await Journal.create({
            title: j.title,
            issn: j.issn,
            category: j.category,
            rating: j.rating || 0,
            description: j.description || '',
            dimensionAverages: j.dimensionAverages || null,
            reviews: j.reviews || [],
            createdAt: j.createdAt || new Date(),
            updatedAt: j.createdAt || new Date()
        }, { silent: true });
        journalIdMap[j.id] = newJournal.id;
    }
    console.log(`  ✅ 迁移 ${journals.length} 个期刊`);

    // 5. 迁移评论（两遍：先迁移顶级，再迁移回复以保证 parentId 正确）
    console.log('\n[5/8] 迁移评论...');
    const comments = rawData.comments || [];

    // 第一遍：顶级评论（parentId 为 null 或 undefined）
    const topComments = comments.filter(c => !c.parentId);
    const replyComments = comments.filter(c => c.parentId);

    for (const c of topComments) {
        const mappedUserId = userIdMap[String(c.userId)] || c.userId;
        const mappedJournalId = journalIdMap[c.journalId] || c.journalId;

        const newComment = await Comment.create({
            legacyId: String(c.id),
            userId: mappedUserId,
            userName: c.userName || '',
            journalId: mappedJournalId,
            parentId: null,
            content: c.content,
            rating: c.rating || null,
            dimensionRatings: c.dimensionRatings || null,
            isDeleted: c.isDeleted || false,
            likeCount: (c.likes || []).length,
            createdAt: c.createdAt || new Date(),
            updatedAt: c.createdAt || new Date()
        }, { silent: true });

        commentIdMap[String(c.id)] = newComment.id;

        // 迁移点赞到 CommentLike 表
        if (c.likes && c.likes.length > 0) {
            for (const likeUserId of c.likes) {
                const mappedLikeUserId = userIdMap[String(likeUserId)] || likeUserId;
                try {
                    await CommentLike.create({
                        commentId: newComment.id,
                        userId: String(mappedLikeUserId)
                    }, { silent: true });
                } catch (e) {
                    // 忽略重复点赞等错误
                }
            }
        }
    }

    // 第二遍：回复评论（可能需要多轮确保所有父评论已迁移）
    let remaining = [...replyComments];
    let maxPasses = 5;
    while (remaining.length > 0 && maxPasses > 0) {
        const nextRemaining = [];
        for (const c of remaining) {
            const parentNewId = commentIdMap[String(c.parentId)];
            if (!parentNewId) {
                nextRemaining.push(c);
                continue;
            }

            const mappedUserId = userIdMap[String(c.userId)] || c.userId;
            const mappedJournalId = journalIdMap[c.journalId] || c.journalId;

            const newComment = await Comment.create({
                legacyId: String(c.id),
                userId: mappedUserId,
                userName: c.userName || '',
                journalId: mappedJournalId,
                parentId: parentNewId,
                content: c.content,
                rating: c.rating || null,
                dimensionRatings: c.dimensionRatings || null,
                isDeleted: c.isDeleted || false,
                likeCount: (c.likes || []).length,
                createdAt: c.createdAt || new Date(),
                updatedAt: c.createdAt || new Date()
            }, { silent: true });

            commentIdMap[String(c.id)] = newComment.id;

            // 迁移点赞
            if (c.likes && c.likes.length > 0) {
                for (const likeUserId of c.likes) {
                    const mappedLikeUserId = userIdMap[String(likeUserId)] || likeUserId;
                    try {
                        await CommentLike.create({
                            commentId: newComment.id,
                            userId: String(mappedLikeUserId)
                        }, { silent: true });
                    } catch (e) { /* 忽略 */ }
                }
            }
        }
        remaining = nextRemaining;
        maxPasses--;
    }

    if (remaining.length > 0) {
        console.warn(`  ⚠️ ${remaining.length} 条回复评论无法找到父评论，已跳过`);
    }
    console.log(`  ✅ 迁移 ${comments.length - remaining.length} 条评论`);

    // 6. 迁移收藏
    console.log('\n[6/8] 迁移收藏...');
    const favorites = rawData.favorites || [];
    let favMigrated = 0;
    for (const f of favorites) {
        const mappedUserId = userIdMap[String(f.userId)] || f.userId;
        const mappedJournalId = journalIdMap[f.journalId] || f.journalId;
        try {
            await Favorite.create({
                userId: String(mappedUserId),
                journalId: mappedJournalId,
                createdAt: f.createdAt || new Date()
            }, { silent: true });
            favMigrated++;
        } catch (e) {
            console.warn(`  ⚠️ 收藏迁移失败 (user:${f.userId}, journal:${f.journalId}): ${e.message}`);
        }
    }
    console.log(`  ✅ 迁移 ${favMigrated} 条收藏`);

    // 7. 迁移关注
    console.log('\n[7/8] 迁移关注...');
    const follows = rawData.follows || [];
    let followMigrated = 0;
    for (const f of follows) {
        const mappedFollowerId = userIdMap[String(f.followerId)] || f.followerId;
        const mappedFollowingId = userIdMap[String(f.followingId)] || f.followingId;
        try {
            await Follow.create({
                followerId: String(mappedFollowerId),
                followingId: String(mappedFollowingId),
                createdAt: f.createdAt || new Date()
            }, { silent: true });
            followMigrated++;
        } catch (e) {
            console.warn(`  ⚠️ 关注迁移失败: ${e.message}`);
        }
    }
    console.log(`  ✅ 迁移 ${followMigrated} 条关注`);

    // 8. 迁移徽章与用户徽章
    console.log('\n[8/8] 迁移徽章...');
    const badges = rawData.badges || [];
    const badgeIdMap = {};
    for (const b of badges) {
        const newBadge = await Badge.create({
            code: b.code,
            name: b.name,
            description: b.description || '',
            icon: b.icon || '',
            color: b.color || '#6366f1',
            category: b.category || 'honor',
            type: b.type || 'manual',
            triggerCondition: b.triggerCondition || null,
            priority: b.priority || 0,
            isActive: b.isActive !== false,
            createdAt: b.createdAt || new Date()
        }, { silent: true });
        badgeIdMap[b.id] = newBadge.id;
    }
    console.log(`  ✅ 迁移 ${badges.length} 个徽章`);

    const userBadges = rawData.userBadges || [];
    let ubMigrated = 0;
    for (const ub of userBadges) {
        const mappedUserId = userIdMap[String(ub.userId)] || ub.userId;
        const mappedBadgeId = badgeIdMap[ub.badgeId] || ub.badgeId;
        const mappedGrantedBy = ub.grantedBy ? (userIdMap[String(ub.grantedBy)] || ub.grantedBy) : null;
        try {
            await UserBadge.create({
                userId: String(mappedUserId),
                badgeId: mappedBadgeId,
                grantedBy: mappedGrantedBy ? String(mappedGrantedBy) : null,
                grantedAt: ub.grantedAt || new Date(),
                isNew: ub.isNew !== false
            });
            ubMigrated++;
        } catch (e) {
            console.warn(`  ⚠️ 用户徽章迁移失败: ${e.message}`);
        }
    }
    console.log(`  ✅ 迁移 ${ubMigrated} 条用户徽章`);

    // 输出映射摘要
    console.log('\n========================================');
    console.log(' 迁移完成 ✅');
    console.log('========================================');
    console.log(`  用户:     ${users.length} → ${Object.keys(userIdMap).length} (UUID)`);
    console.log(`  期刊:     ${journals.length}`);
    console.log(`  评论:     ${comments.length - remaining.length}`);
    console.log(`  收藏:     ${favMigrated}`);
    console.log(`  关注:     ${followMigrated}`);
    console.log(`  徽章:     ${badges.length}`);
    console.log(`  用户徽章: ${ubMigrated}`);
    console.log('\n  用户 ID 映射:');
    for (const [oldId, newId] of Object.entries(userIdMap)) {
        const u = users.find(u => u.id == oldId);
        console.log(`    ${oldId} → ${newId} (${u?.email || '?'})`);
    }

    // 重新启用外键检查
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n  ✅ 外键检查已重新启用');

    await sequelize.close();
    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ 迁移失败:', err);
    process.exit(1);
});
