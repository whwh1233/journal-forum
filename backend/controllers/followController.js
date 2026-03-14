const { Follow, User } = require('../models');
const badgeService = require('../services/badgeService');
const notificationService = require('../services/notificationService');

// 关注用户
const followUser = async (req, res) => {
    try {
        const { followingId } = req.body;

        if (req.user.id === followingId) {
            return res.status(400).json({ success: false, message: '不能关注自己' });
        }

        const targetUser = await User.findByPk(followingId);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        const existing = await Follow.findOne({
            where: { followerId: req.user.id, followingId }
        });

        if (existing) {
            return res.status(400).json({ success: false, message: '已经关注过该用户' });
        }

        const newFollow = await Follow.create({
            followerId: req.user.id,
            followingId
        });

        // Notify: new_follower
        try {
            await notificationService.create({
                recipientId: followingId,
                senderId: req.user.id,
                type: 'new_follower',
                entityType: null,
                entityId: null,
                content: {
                    title: `${req.user.name} 关注了你`,
                    body: ''
                }
            });
        } catch (err) {
            console.error('Notification (new_follower) failed:', err.message);
        }

        // 检查被关注者的粉丝徽章
        let targetUserNewBadges = [];
        try {
            targetUserNewBadges = await badgeService.checkAndGrantBadges(followingId, 'followerCount');
        } catch (err) {
            console.error('Badge check failed:', err);
        }

        res.status(201).json({
            success: true,
            data: {
                follow: newFollow,
                targetUserNewBadges: targetUserNewBadges.length > 0 ? targetUserNewBadges : undefined
            }
        });
    } catch (error) {
        console.error('Error following user:', error);
        res.status(500).json({ success: false, message: '关注失败' });
    }
};

// 取消关注
const unfollowUser = async (req, res) => {
    try {
        const { followingId } = req.params;

        const follow = await Follow.findOne({
            where: { followerId: req.user.id, followingId }
        });

        if (!follow) {
            return res.status(404).json({ success: false, message: '未关注该用户' });
        }

        await follow.destroy();
        res.json({ success: true, message: '取消关注成功' });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        res.status(500).json({ success: false, message: '取消关注失败' });
    }
};

// 检查是否已关注
const checkFollow = async (req, res) => {
    try {
        const { followingId } = req.params;

        const follow = await Follow.findOne({
            where: { followerId: req.user.id, followingId }
        });

        res.json({ success: true, data: { isFollowing: !!follow } });
    } catch (error) {
        console.error('Error checking follow:', error);
        res.status(500).json({ success: false, message: '检查关注状态失败' });
    }
};

// 获取粉丝列表
const getFollowers = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Follow.findAndCountAll({
            where: { followingId: userId },
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset,
            include: [{
                model: User,
                as: 'follower',
                attributes: ['id', 'email', 'name', 'avatar']
            }]
        });

        const followersWithUser = rows.map(f => ({
            id: f.id,
            user: f.follower,
            createdAt: f.createdAt
        }));

        res.json({
            success: true,
            data: {
                followers: followersWithUser,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / parseInt(limit)),
                    totalItems: count,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error getting followers:', error);
        res.status(500).json({ success: false, message: '获取粉丝列表失败' });
    }
};

// 获取关注列表
const getFollowing = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Follow.findAndCountAll({
            where: { followerId: userId },
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset,
            include: [{
                model: User,
                as: 'followedUser',
                attributes: ['id', 'email', 'name', 'avatar']
            }]
        });

        const followingWithUser = rows.map(f => ({
            id: f.id,
            user: f.followedUser,
            createdAt: f.createdAt
        }));

        res.json({
            success: true,
            data: {
                following: followingWithUser,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / parseInt(limit)),
                    totalItems: count,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error getting following:', error);
        res.status(500).json({ success: false, message: '获取关注列表失败' });
    }
};

module.exports = { followUser, unfollowUser, checkFollow, getFollowers, getFollowing };
