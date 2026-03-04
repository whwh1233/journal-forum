const { User, Journal, Comment, Post, PostReport } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// 获取统计数据
const getStats = async (req, res, next) => {
    try {
        const userCount = await User.count();
        const journalCount = await Journal.count();
        const commentCount = await Comment.count({ where: { isDeleted: false } });

        res.status(200).json({
            success: true,
            data: { userCount, journalCount, commentCount }
        });
    } catch (error) {
        next(error);
    }
};

// 获取用户列表
const getUsers = async (req, res, next) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;

        const where = {};
        if (search) {
            where.email = { [Op.like]: `%${search.toLowerCase()}%` };
        }

        const offset = (page - 1) * limit;
        const { count, rows } = await User.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            offset: Number(offset),
            limit: Number(limit)
        });

        // 获取每个用户的评论数
        const usersWithComments = await Promise.all(
            rows.map(async (user) => {
                const commentCount = await Comment.count({
                    where: { userId: user.id, isDeleted: false }
                });
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role || 'user',
                    status: user.status || 'active',
                    createdAt: user.createdAt,
                    commentCount
                };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                users: usersWithComments,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: Number(limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// 更新用户（禁用/启用）
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: '用户未找到' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ success: false, message: '不能禁用管理员账号' });
        }

        await user.update({ status });

        res.status(200).json({
            success: true,
            data: {
                user: { id: user.id, email: user.email, status: user.status }
            }
        });
    } catch (error) {
        next(error);
    }
};

// 删除用户
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: '用户未找到' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ success: false, message: '不能删除管理员账号' });
        }

        // 软删除用户的评论
        await Comment.update(
            { isDeleted: true, content: '[该评论已被删除]' },
            { where: { userId: id } }
        );

        // 删除用户
        await user.destroy();

        res.status(200).json({ success: true, message: '用户删除成功' });
    } catch (error) {
        next(error);
    }
};

// 获取所有评论
const getComments = async (req, res, next) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;

        const where = {
            isDeleted: false,
            parentId: null  // 只显示顶级评论
        };

        if (search) {
            const searchTerm = `%${search}%`;
            where[Op.or] = [
                { content: { [Op.like]: searchTerm } },
                { userName: { [Op.like]: searchTerm } }
            ];
        }

        const offset = (page - 1) * limit;
        const { count, rows } = await Comment.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            offset: Number(offset),
            limit: Number(limit)
        });

        const commentsWithJournal = await Promise.all(
            rows.map(async (comment) => {
                const journal = await Journal.findByPk(comment.journalId);
                return {
                    id: comment.legacyId || String(comment.id),
                    journalId: comment.journalId,
                    journalTitle: journal?.title || '未知期刊',
                    author: comment.userName,
                    rating: comment.rating || 0,
                    content: comment.content,
                    createdAt: comment.createdAt
                };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                comments: commentsWithJournal,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: Number(limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// 删除评论
const deleteComment = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 查找评论（支持 legacy ID 和数字 ID）
        let comment;
        if (isNaN(id)) {
            comment = await Comment.findOne({ where: { legacyId: id } });
        } else {
            comment = await Comment.findByPk(id);
        }

        if (!comment) {
            return res.status(404).json({ success: false, message: '评论未找到' });
        }

        // 软删除
        await comment.update({
            isDeleted: true,
            content: '[该评论已被删除]'
        });

        // 重新计算期刊评分
        if (comment.rating && !comment.parentId) {
            const journal = await Journal.findByPk(comment.journalId);
            if (journal) {
                const activeComments = await Comment.findAll({
                    where: {
                        journalId: comment.journalId,
                        isDeleted: false,
                        parentId: null,
                        rating: { [Op.ne]: null }
                    }
                });

                if (activeComments.length > 0) {
                    const totalRating = activeComments.reduce((sum, c) => sum + c.rating, 0);
                    await journal.update({
                        rating: Math.round((totalRating / activeComments.length) * 10) / 10
                    });
                } else {
                    await journal.update({ rating: 0 });
                }
            }
        }

        res.status(200).json({ success: true, message: '评论删除成功' });
    } catch (error) {
        next(error);
    }
};

// 获取帖子举报列表
const getPostReports = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const where = {};
        if (status) {
            where.status = status;
        }

        const offset = (page - 1) * limit;
        const { count, rows } = await PostReport.findAndCountAll({
            where,
            include: [
                {
                    model: Post,
                    as: 'post',
                    attributes: ['id', 'title', 'content', 'userId']
                },
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['createdAt', 'DESC']],
            offset: Number(offset),
            limit: Number(limit)
        });

        const reports = rows.map(report => ({
            id: report.id,
            postId: report.postId,
            postTitle: report.post?.title || '[帖子已删除]',
            postContent: report.post?.content?.substring(0, 100) || '',
            reporterId: report.reporterId,
            reporterName: report.reporter?.name || '[用户已删除]',
            reporterEmail: report.reporter?.email || '',
            reason: report.reason,
            status: report.status,
            adminNote: report.adminNote,
            createdAt: report.createdAt,
            reviewedAt: report.reviewedAt
        }));

        res.status(200).json({
            success: true,
            data: {
                reports,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: Number(limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// 更新举报状态
const updatePostReportStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, adminNote, action } = req.body;

        const report = await PostReport.findByPk(id, {
            include: [{ model: Post, as: 'post' }]
        });

        if (!report) {
            return res.status(404).json({ success: false, message: '举报记录未找到' });
        }

        // 更新举报状态
        await report.update({
            status,
            adminNote,
            reviewedAt: new Date(),
            reviewedBy: req.user.id
        });

        // 执行相应操作
        if (action === 'delete_post' && report.post) {
            // 删除被举报的帖子
            await report.post.update({ isDeleted: true });
        } else if (action === 'warn_author' && report.post) {
            // 可以在这里添加警告用户的逻辑（发送通知等）
            // TODO: Implement warning system
        }

        res.status(200).json({
            success: true,
            message: '举报处理成功',
            data: {
                report: {
                    id: report.id,
                    status: report.status,
                    adminNote: report.adminNote
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// 批量处理举报
const batchProcessReports = async (req, res, next) => {
    try {
        const { reportIds, status, action } = req.body;

        if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
            return res.status(400).json({ success: false, message: '请提供有效的举报ID列表' });
        }

        const reports = await PostReport.findAll({
            where: { id: { [Op.in]: reportIds } },
            include: [{ model: Post, as: 'post' }]
        });

        if (reports.length === 0) {
            return res.status(404).json({ success: false, message: '未找到有效的举报记录' });
        }

        // 批量更新状态
        await PostReport.update(
            {
                status,
                reviewedAt: new Date(),
                reviewedBy: req.user.id
            },
            { where: { id: { [Op.in]: reportIds } } }
        );

        // 批量执行操作
        if (action === 'delete_posts') {
            const postIds = reports.map(r => r.postId).filter(Boolean);
            if (postIds.length > 0) {
                await Post.update(
                    { isDeleted: true },
                    { where: { id: { [Op.in]: postIds } } }
                );
            }
        }

        res.status(200).json({
            success: true,
            message: `成功处理 ${reports.length} 条举报`,
            data: { processed: reports.length }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStats,
    getUsers,
    updateUser,
    deleteUser,
    getComments,
    deleteComment,
    getPostReports,
    updatePostReportStatus,
    batchProcessReports
};
