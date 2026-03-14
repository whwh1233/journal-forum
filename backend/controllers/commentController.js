const { Comment, CommentLike, Journal, JournalRatingCache, User, Badge, UserBadge, Favorite } = require('../models');
const { sequelize } = require('../config/database');
const badgeService = require('../services/badgeService');
const notificationService = require('../services/notificationService');
const { calculateJournalHotScore, calculateJournalAllTimeScore } = require('../utils/hotScore');

// 多维评分维度定义
const DIMENSION_KEYS = ['reviewSpeed', 'editorAttitude', 'acceptDifficulty', 'reviewQuality', 'overallExperience'];
const DIMENSION_LABELS = {
    reviewSpeed: '审稿速度',
    editorAttitude: '编辑态度',
    acceptDifficulty: '录用难度',
    reviewQuality: '审稿质量',
    overallExperience: '综合体验'
};

// 验证多维评分
const validateDimensionRatings = (dimensionRatings) => {
    if (!dimensionRatings || typeof dimensionRatings !== 'object') return '多维评分数据无效';
    for (const key of Object.keys(dimensionRatings)) {
        if (!DIMENSION_KEYS.includes(key)) return `无效的评分维度: ${key}`;
        const val = dimensionRatings[key];
        if (typeof val !== 'number' || val < 1 || val > 5) return `${DIMENSION_LABELS[key] || key} 评分必须在 1-5 之间`;
    }
    if (!dimensionRatings.overallExperience) return '综合体验维度为必填';
    return null;
};

// 更新期刊评分缓存表
const updateJournalRatingCache = async (journalId) => {
    const topLevelComments = await Comment.findAll({
        where: {
            journalId,
            parentId: null,
            isDeleted: false
        }
    });

    if (topLevelComments.length === 0) {
        // 无评论时删除缓存记录
        await JournalRatingCache.destroy({ where: { journalId } });
        return { rating: 0, ratingCount: 0, dimensionAverages: {} };
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

    // 计算综合评分
    const validAvgs = Object.values(averages).filter(v => v !== null);
    const rating = validAvgs.length > 0
        ? Math.round((validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length) * 10) / 10
        : 0;

    // Compute hot ranking scores before upsert
    const { Op } = require('sequelize');
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000);

    const [recentCommentCount, recentFavoriteCount, totalFavoriteCount, journal] = await Promise.all([
      Comment.count({ where: { journalId, parentId: null, isDeleted: false, createdAt: { [Op.gte]: sevenDaysAgo } } }),
      Favorite.count({ where: { journalId, createdAt: { [Op.gte]: sevenDaysAgo } } }),
      Favorite.count({ where: { journalId } }),
      Journal.findByPk(journalId, { attributes: ['impactFactor'] })
    ]);

    const impactFactor = journal ? journal.impactFactor : null;
    const hotScore = calculateJournalHotScore(recentCommentCount, recentFavoriteCount, rating);
    const allTimeScore = calculateJournalAllTimeScore(
      topLevelComments.length, totalFavoriteCount, rating, impactFactor
    );

    // Single upsert with all fields (rating + hot ranking scores)
    await JournalRatingCache.upsert({
        journalId,
        rating,
        ratingCount: topLevelComments.length,
        reviewSpeed: averages.reviewSpeed,
        editorAttitude: averages.editorAttitude,
        acceptDifficulty: averages.acceptDifficulty,
        reviewQuality: averages.reviewQuality,
        overallExperience: averages.overallExperience,
        hotScore,
        allTimeScore,
        favoriteCount: totalFavoriteCount
    });

    return {
        rating,
        ratingCount: topLevelComments.length,
        dimensionAverages: averages
    };
};

// 递归构建评论树（最多3层）
const buildCommentTree = (comments, parentId = null, level = 0, userBadgeMap = {}) => {
    if (level >= 3) return [];

    return comments
        .filter(comment => {
            const cParentId = comment.parentId || null;
            return cParentId === parentId;
        })
        .map(comment => {
            const userBadges = userBadgeMap[comment.userId] || [];
            return {
                ...comment,
                userBadges,
                replies: level < 2 ? buildCommentTree(comments, comment.id, level + 1, userBadgeMap) : []
            };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// 获取期刊的所有评论
const getCommentsByJournalId = async (req, res) => {
    try {
        const { journalId } = req.params;
        const { sort = 'newest' } = req.query;

        // 尝试从 token 获取当前用户 ID
        let currentUserId = null;
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const jwt = require('jsonwebtoken');
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
                currentUserId = String(decoded.id);
            }
        } catch (e) { /* 未登录，忽略 */ }

        // 获取该期刊的所有评论
        const comments = await Comment.findAll({
            where: { journalId },
            order: [['created_at', 'DESC']]
        });

        // 获取所有评论的点赞信息
        const commentIds = comments.map(c => c.id);
        const likes = commentIds.length > 0
            ? await CommentLike.findAll({ where: { commentId: commentIds } })
            : [];

        // 构建点赞映射
        const likesMap = {};
        likes.forEach(like => {
            if (!likesMap[like.commentId]) likesMap[like.commentId] = [];
            likesMap[like.commentId].push(String(like.userId));
        });

        // 获取所有涉及的用户ID
        const userIds = [...new Set(comments.map(c => c.userId))];

        // 获取所有用户的置顶徽章
        const userBadgeMap = {};
        if (userIds.length > 0) {
            const users = await User.findAll({
                where: { id: userIds },
                attributes: ['id', 'pinnedBadges']
            });

            for (const u of users) {
                if (u.pinnedBadges && u.pinnedBadges.length > 0) {
                    const badges = await Badge.findAll({
                        where: { id: u.pinnedBadges, isActive: true }
                    });
                    userBadgeMap[u.id] = badges.map(b => b.toJSON());
                } else {
                    userBadgeMap[u.id] = [];
                }
            }
        }

        // 附加 likeCount 和 isLikedByMe
        const commentsData = comments.map(c => {
            const cData = c.toJSON();
            const commentLikes = likesMap[c.id] || [];
            cData.likeCount = commentLikes.length;
            cData.isLikedByMe = currentUserId ? commentLikes.includes(currentUserId) : false;
            // 兼容前端需要的 id 格式 - 如果有 legacyId 用 legacyId，否则用数字 id
            if (cData.legacyId) {
                cData.id = cData.legacyId;
            }
            return cData;
        });

        // 构建评论树
        let commentTree = buildCommentTree(commentsData, null, 0, userBadgeMap);

        // 排序
        if (sort === 'oldest') {
            commentTree.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sort === 'rating') {
            commentTree.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sort === 'helpful') {
            commentTree.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
        }

        res.json(commentTree);
    } catch (error) {
        console.error('Error getting comments:', error);
        res.status(500).json({ message: '获取评论失败' });
    }
};

// 创建评论或回复
const createComment = async (req, res) => {
    try {
        const { journalId, parentId, content, rating, dimensionRatings } = req.body;

        // 验证期刊是否存在
        const journal = await Journal.findByPk(journalId);
        if (!journal) {
            return res.status(404).json({ message: '期刊不存在' });
        }

        // 如果是回复，验证父评论是否存在
        let resolvedParentId = null;
        if (parentId) {
            // parentId 可能是 legacyId 字符串 或 数字 id
            let parentComment;
            if (typeof parentId === 'string' && isNaN(parentId)) {
                parentComment = await Comment.findOne({ where: { legacyId: parentId } });
            } else {
                parentComment = await Comment.findByPk(parentId);
            }

            if (!parentComment) {
                return res.status(404).json({ message: '父评论不存在' });
            }

            // 检查层级
            const getCommentLevel = async (commentId, level = 0) => {
                const comment = await Comment.findByPk(commentId);
                if (!comment || !comment.parentId || level >= 3) return level;
                return getCommentLevel(comment.parentId, level + 1);
            };

            if (await getCommentLevel(parentComment.id) >= 2) {
                return res.status(400).json({ message: '评论层级不能超过3层' });
            }

            resolvedParentId = parentComment.id;
        }

        // 顶级评论评分验证
        let finalRating = undefined;
        let finalDimensionRatings = undefined;

        if (!parentId) {
            if (dimensionRatings) {
                const dimError = validateDimensionRatings(dimensionRatings);
                if (dimError) {
                    return res.status(400).json({ message: dimError });
                }
                finalDimensionRatings = {};
                for (const key of DIMENSION_KEYS) {
                    if (dimensionRatings[key] !== undefined) {
                        finalDimensionRatings[key] = dimensionRatings[key];
                    }
                }
                finalRating = finalDimensionRatings.overallExperience;
            } else if (rating !== undefined && rating !== null) {
                if (rating < 1 || rating > 5) {
                    return res.status(400).json({ message: '评分必须在1-5之间' });
                }
                finalRating = rating;
            } else {
                return res.status(400).json({ message: '顶级评论必须包含评分' });
            }
        }

        const newComment = await Comment.create({
            userId: req.user.id,
            userName: req.user.name || req.user.email.split('@')[0],
            journalId,
            parentId: resolvedParentId,
            content,
            rating: finalRating,
            dimensionRatings: finalDimensionRatings || null,
            isDeleted: false,
            likeCount: 0
        });

        // 如果是顶级评论，更新期刊评分缓存表
        if (!parentId) {
            await updateJournalRatingCache(journalId);
        }

        // Notify: comment_reply
        if (parentId) {
            try {
                const parentComment = await Comment.findByPk(resolvedParentId);
                if (parentComment) {
                    await notificationService.create({
                        recipientId: parentComment.userId,
                        senderId: req.user.id,
                        type: 'comment_reply',
                        entityType: 'comment',
                        entityId: newComment.id,
                        content: {
                            title: `${req.user.name} 回复了你的评论`,
                            body: content.substring(0, 100),
                            commentContent: content.substring(0, 200),
                            journalTitle: journal ? journal.title : ''
                        }
                    });
                }
            } catch (err) {
                console.error('Notification (comment_reply) failed:', err.message);
            }
        }

        // Notify: journal_new_comment (to users who favorited this journal)
        try {
            const { Favorite } = require('../models');
            const favorites = await Favorite.findAll({
                where: { journalId },
                attributes: ['userId']
            });
            const recipientIds = favorites.map(f => f.userId);
            if (recipientIds.length > 0) {
                await notificationService.createBulk(recipientIds, {
                    senderId: req.user.id,
                    type: 'journal_new_comment',
                    entityType: 'journal',
                    entityId: journalId,
                    content: {
                        title: `你收藏的期刊「${journal ? journal.title : ''}」有新评论`,
                        body: content.substring(0, 100),
                        commentContent: content.substring(0, 200),
                        journalTitle: journal ? journal.title : ''
                    }
                });
            }
        } catch (err) {
            console.error('Notification (journal_new_comment) failed:', err.message);
        }

        // 检查评论徽章
        let newBadges = [];
        try {
            newBadges = await badgeService.checkAndGrantBadges(req.user.id, 'commentCount');
        } catch (err) {
            console.error('Badge check failed:', err);
        }

        const result = newComment.toJSON();
        result.newBadges = newBadges.length > 0 ? newBadges : undefined;

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ message: '创建评论失败' });
    }
};

// 更新评论
const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;

        // 支持 legacyId 或数字 id
        let comment;
        if (isNaN(commentId)) {
            comment = await Comment.findOne({ where: { legacyId: commentId } });
        } else {
            comment = await Comment.findByPk(commentId);
        }

        if (!comment) {
            return res.status(404).json({ message: '评论不存在' });
        }

        if (comment.userId !== req.user.id) {
            return res.status(403).json({ message: '只能编辑自己的评论' });
        }

        if (comment.isDeleted) {
            return res.status(400).json({ message: '已删除的评论无法编辑' });
        }

        await comment.update({ content });
        res.json(comment.toJSON());
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ message: '更新评论失败' });
    }
};

// 删除评论（软删除）
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        let comment;
        if (isNaN(commentId)) {
            comment = await Comment.findOne({ where: { legacyId: commentId } });
        } else {
            comment = await Comment.findByPk(commentId);
        }

        if (!comment) {
            return res.status(404).json({ message: '评论不存在' });
        }

        if (comment.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: '没有删除权限' });
        }

        await comment.update({
            isDeleted: true,
            content: '[该评论已被删除]'
        });

        // Notify: comment_deleted (admin deleted user's comment)
        if (req.user.role === 'admin' || req.user.role === 'superadmin') {
            try {
                const journalObj = await Journal.findByPk(comment.journalId);
                await notificationService.create({
                    recipientId: comment.userId,
                    senderId: req.user.id,
                    type: 'comment_deleted',
                    entityType: 'comment',
                    entityId: comment.id,
                    content: {
                        title: '你的评论已被管理员删除',
                        body: comment.content ? comment.content.substring(0, 100) : '',
                        reason: req.body.reason || '',
                        journalTitle: journalObj ? journalObj.title : ''
                    }
                });
            } catch (err) {
                console.error('Notification (comment_deleted) failed:', err.message);
            }
        }

        // 如果是顶级评论，重新计算期刊评分缓存
        if (!comment.parentId) {
            await updateJournalRatingCache(comment.journalId);
        }

        res.json({ message: '评论已删除', comment: comment.toJSON() });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: '删除评论失败' });
    }
};

// 获取期刊多维评分汇总
const getRatingSummary = async (req, res) => {
    try {
        const { journalId } = req.params;

        const journal = await Journal.findByPk(journalId, {
            include: [{ model: JournalRatingCache, as: 'ratingCache' }]
        });
        if (!journal) {
            return res.status(404).json({ message: '期刊不存在' });
        }

        const cache = journal.ratingCache;
        const dimensionAverages = cache ? {
            reviewSpeed: cache.reviewSpeed,
            editorAttitude: cache.editorAttitude,
            acceptDifficulty: cache.acceptDifficulty,
            reviewQuality: cache.reviewQuality,
            overallExperience: cache.overallExperience
        } : {};

        res.json({
            journalId,
            rating: cache ? cache.rating : 0,
            ratingCount: cache ? cache.ratingCount : 0,
            dimensionAverages,
            dimensionLabels: DIMENSION_LABELS
        });
    } catch (error) {
        console.error('Error getting rating summary:', error);
        res.status(500).json({ message: '获取评分汇总失败' });
    }
};

// 点赞/取消点赞评论
const likeComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        let comment;
        if (isNaN(commentId)) {
            comment = await Comment.findOne({ where: { legacyId: commentId } });
        } else {
            comment = await Comment.findByPk(commentId);
        }

        if (!comment) {
            return res.status(404).json({ message: '评论不存在' });
        }
        if (comment.isDeleted) {
            return res.status(400).json({ message: '无法点赞已删除评论' });
        }

        // toggle 逻辑
        const existing = await CommentLike.findOne({
            where: { commentId: comment.id, userId }
        });

        let liked;
        if (existing) {
            await existing.destroy();
            liked = false;
        } else {
            await CommentLike.create({ commentId: comment.id, userId });
            liked = true;
        }

        // 更新计数
        const likeCount = await CommentLike.count({ where: { commentId: comment.id } });
        await comment.update({ likeCount });

        res.json({ liked, likeCount });
    } catch (error) {
        console.error('Error liking comment:', error);
        res.status(500).json({ message: '点赞失败' });
    }
};

module.exports = {
    getCommentsByJournalId,
    createComment,
    updateComment,
    deleteComment,
    getRatingSummary,
    likeComment
};
