const { Badge, UserBadge, User } = require('../models');
const badgeService = require('../services/badgeService');

// ==================== 公开接口 ====================

const getAllBadges = async (req, res) => {
    try {
        const badges = await Badge.findAll({
            where: { isActive: true },
            attributes: { exclude: ['triggerCondition'] },
            order: [['priority', 'DESC']]
        });

        res.json({ success: true, data: badges });
    } catch (error) {
        console.error('Error getting all badges:', error);
        res.status(500).json({ success: false, message: '获取徽章列表失败' });
    }
};

const getUserBadges = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        const badges = await badgeService.getUserBadges(userId);
        const pinnedBadges = await badgeService.getUserPinnedBadges(userId);

        const sanitizedBadges = badges.map(({ isNew, ...badge }) => badge);
        const sanitizedPinnedBadges = pinnedBadges.map(({ isNew, ...badge }) => badge);

        res.json({
            success: true,
            data: { badges: sanitizedBadges, pinnedBadges: sanitizedPinnedBadges }
        });
    } catch (error) {
        console.error('Error getting user badges:', error);
        res.status(500).json({ success: false, message: '获取用户徽章失败' });
    }
};

// ==================== 用户接口（需登录） ====================

const getMyBadges = async (req, res) => {
    try {
        const userId = req.user.id;
        const badges = await badgeService.getUserBadges(userId);
        const pinnedBadges = await badgeService.getUserPinnedBadges(userId);
        const hasNewBadges = await badgeService.hasNewBadges(userId);

        res.json({
            success: true,
            data: { badges, pinnedBadges, hasNewBadges }
        });
    } catch (error) {
        console.error('Error getting my badges:', error);
        res.status(500).json({ success: false, message: '获取我的徽章失败' });
    }
};

const setPinnedBadges = async (req, res) => {
    try {
        const { badgeIds } = req.body;
        const userId = req.user.id;

        if (!Array.isArray(badgeIds)) {
            return res.status(400).json({ success: false, message: 'badgeIds 必须是数组' });
        }
        if (badgeIds.length > 3) {
            return res.status(400).json({ success: false, message: '最多只能置顶3个徽章' });
        }

        const userBadgeIds = (await UserBadge.findAll({
            where: { userId },
            attributes: ['badgeId']
        })).map(ub => ub.badgeId);

        const invalidBadgeIds = badgeIds.filter(id => !userBadgeIds.includes(id));
        if (invalidBadgeIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: `您未拥有以下徽章: ${invalidBadgeIds.join(', ')}`
            });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        await user.update({ pinnedBadges: badgeIds });
        const pinnedBadges = await badgeService.getUserPinnedBadges(userId);

        res.json({ success: true, data: { pinnedBadges } });
    } catch (error) {
        console.error('Error setting pinned badges:', error);
        res.status(500).json({ success: false, message: '设置置顶徽章失败' });
    }
};

const markBadgesAsRead = async (req, res) => {
    try {
        const markedCount = await badgeService.markBadgesAsRead(req.user.id);
        res.json({ success: true, data: { markedCount } });
    } catch (error) {
        console.error('Error marking badges as read:', error);
        res.status(500).json({ success: false, message: '标记徽章已读失败' });
    }
};

// ==================== 管理员接口 ====================

const adminGetAllBadges = async (req, res) => {
    try {
        const badges = await Badge.findAll({ order: [['priority', 'DESC']] });

        const badgesWithCount = await Promise.all(
            badges.map(async (badge) => {
                const holderCount = await UserBadge.count({ where: { badgeId: badge.id } });
                return { ...badge.toJSON(), holderCount };
            })
        );

        res.json({ success: true, data: badgesWithCount });
    } catch (error) {
        console.error('Error getting all badges for admin:', error);
        res.status(500).json({ success: false, message: '获取徽章列表失败' });
    }
};

const createBadge = async (req, res) => {
    try {
        const { code, name, description, icon, color, category, type, priority, triggerCondition } = req.body;

        if (!code || !name || !icon) {
            return res.status(400).json({ success: false, message: '缺少必填字段: code, name, icon' });
        }

        const existing = await Badge.findOne({ where: { code } });
        if (existing) {
            return res.status(400).json({ success: false, message: `徽章代码 "${code}" 已存在` });
        }

        const newBadge = await Badge.create({
            code,
            name,
            description: description || '',
            icon,
            color: color || '#6366f1',
            category: category || 'honor',
            type: type || 'manual',
            priority: priority || 0,
            isActive: true,
            triggerCondition: type === 'auto' ? triggerCondition : null
        });

        res.status(201).json({ success: true, data: newBadge });
    } catch (error) {
        console.error('Error creating badge:', error);
        res.status(500).json({ success: false, message: '创建徽章失败' });
    }
};

const updateBadge = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon, color, type, priority, triggerCondition, isActive } = req.body;

        const badge = await Badge.findByPk(parseInt(id));
        if (!badge) {
            return res.status(404).json({ success: false, message: '徽章不存在' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (icon !== undefined) updateData.icon = icon;
        if (color !== undefined) updateData.color = color;
        if (type !== undefined) updateData.type = type;
        if (priority !== undefined) updateData.priority = priority;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (triggerCondition !== undefined) updateData.triggerCondition = triggerCondition;

        await badge.update(updateData);
        res.json({ success: true, data: badge });
    } catch (error) {
        console.error('Error updating badge:', error);
        res.status(500).json({ success: false, message: '编辑徽章失败' });
    }
};

const deleteBadge = async (req, res) => {
    try {
        const { id } = req.params;
        const badge = await Badge.findByPk(parseInt(id));
        if (!badge) {
            return res.status(404).json({ success: false, message: '徽章不存在' });
        }

        await badge.update({ isActive: false });
        res.json({ success: true, message: '徽章已禁用' });
    } catch (error) {
        console.error('Error deleting badge:', error);
        res.status(500).json({ success: false, message: '删除徽章失败' });
    }
};

const grantBadgeToUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const grantedBy = req.user.id;

        if (!userId) {
            return res.status(400).json({ success: false, message: '缺少必填字段: userId' });
        }

        const result = await badgeService.grantBadge(parseInt(id), userId, grantedBy);

        if (result.alreadyOwned) {
            return res.json({ success: true, message: '用户已拥有该徽章', data: result });
        }

        res.json({ success: true, message: '徽章授予成功', data: result });
    } catch (error) {
        console.error('Error granting badge:', error);
        if (error.message === '徽章不存在' || error.message === '用户不存在') {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: '授予徽章失败' });
    }
};

const revokeBadgeFromUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: '缺少必填字段: userId' });
        }

        const result = await badgeService.revokeBadge(parseInt(id), userId);
        res.json({ success: true, message: '徽章撤销成功', data: result });
    } catch (error) {
        console.error('Error revoking badge:', error);
        if (error.message === '用户未拥有该徽章') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: '撤销徽章失败' });
    }
};

const getBadgeStats = async (req, res) => {
    try {
        const totalBadges = await Badge.count();
        const activeBadges = await Badge.count({ where: { isActive: true } });
        const inactiveBadges = totalBadges - activeBadges;

        const byType = {
            auto: await Badge.count({ where: { type: 'auto' } }),
            manual: await Badge.count({ where: { type: 'manual' } })
        };

        const totalGrants = await UserBadge.count();
        const usersWithBadgesResult = await UserBadge.count({ distinct: true, col: 'user_id' });

        const badges = await Badge.findAll();
        const badgeHolderCounts = await Promise.all(
            badges.map(async (badge) => ({
                id: badge.id,
                name: badge.name,
                icon: badge.icon,
                count: await UserBadge.count({ where: { badgeId: badge.id } })
            }))
        );
        badgeHolderCounts.sort((a, b) => b.count - a.count);
        const topBadges = badgeHolderCounts.slice(0, 5);

        const recentGrantsRaw = await UserBadge.findAll({
            order: [['granted_at', 'DESC']],
            limit: 10,
            include: [
                { model: Badge, as: 'badge', attributes: ['id', 'name', 'icon'] },
                { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
            ]
        });

        const recentGrants = recentGrantsRaw.map(ub => ({
            userBadgeId: ub.id,
            badge: ub.badge,
            user: ub.user,
            grantedAt: ub.grantedAt
        }));

        res.json({
            success: true,
            data: {
                totalBadges, activeBadges, inactiveBadges, byType,
                totalGrants, usersWithBadges: usersWithBadgesResult,
                topBadges, recentGrants
            }
        });
    } catch (error) {
        console.error('Error getting badge stats:', error);
        res.status(500).json({ success: false, message: '获取徽章统计失败' });
    }
};

const batchGrantBadge = async (req, res) => {
    try {
        const { badgeId, userIds } = req.body;
        const grantedBy = req.user.id;

        if (!badgeId) {
            return res.status(400).json({ success: false, message: '缺少必填字段: badgeId' });
        }
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ success: false, message: 'userIds 必须是非空数组' });
        }

        const badge = await Badge.findByPk(parseInt(badgeId));
        if (!badge) {
            return res.status(404).json({ success: false, message: '徽章不存在' });
        }

        const results = { success: [], alreadyOwned: [], failed: [] };

        for (const userId of userIds) {
            try {
                const result = await badgeService.grantBadge(parseInt(badgeId), userId, grantedBy);
                if (result.alreadyOwned) {
                    results.alreadyOwned.push(userId);
                } else {
                    results.success.push(userId);
                }
            } catch (error) {
                results.failed.push({ userId, reason: error.message });
            }
        }

        res.json({
            success: true,
            message: `成功授予 ${results.success.length} 人，${results.alreadyOwned.length} 人已拥有，${results.failed.length} 人失败`,
            data: results
        });
    } catch (error) {
        console.error('Error batch granting badge:', error);
        res.status(500).json({ success: false, message: '批量授予徽章失败' });
    }
};

module.exports = {
    getAllBadges, getUserBadges, getMyBadges, setPinnedBadges, markBadgesAsRead,
    adminGetAllBadges, createBadge, updateBadge, deleteBadge,
    grantBadgeToUser, revokeBadgeFromUser, getBadgeStats, batchGrantBadge
};
