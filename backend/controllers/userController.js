const { User, Comment, Favorite, Follow, Journal } = require('../models');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置头像上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `user-${req.user.id}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif)'));
        }
    }
});

// 计算用户统计信息
const calculateUserStats = async (userId) => {
    const commentCount = await Comment.count({
        where: { userId, isDeleted: false }
    });

    const favoriteCount = await Favorite.count({
        where: { userId }
    });

    const followingCount = await Follow.count({
        where: { followerId: userId }
    });

    const followerCount = await Follow.count({
        where: { followingId: userId }
    });

    // 计算积分：评论记 5 分，收藏记 2 分，粉丝记 10 分
    const points = (commentCount * 5) + (favoriteCount * 2) + (followerCount * 10);
    const level = Math.min(Math.floor(points / 100) + 1, 100);

    return {
        commentCount,
        favoriteCount,
        followingCount,
        followerCount,
        points,
        level
    };
};

// 获取用户资料
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }

        const stats = await calculateUserStats(userId);

        const userProfile = {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            bio: user.bio,
            location: user.location,
            institution: user.institution,
            website: user.website,
            role: user.role,
            createdAt: user.createdAt,
            stats
        };

        res.json(userProfile);
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({ message: '获取用户资料失败' });
    }
};

// 更新用户资料（仅本人）
const updateUserProfile = async (req, res) => {
    try {
        const { name, bio, location, institution, website } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }

        if (website && !website.match(/^https?:\/\/.+/)) {
            return res.status(400).json({ message: '网站地址格式不正确，必须以 http:// 或 https:// 开头' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (bio !== undefined) updateData.bio = bio;
        if (location !== undefined) updateData.location = location;
        if (institution !== undefined) updateData.institution = institution;
        if (website !== undefined) updateData.website = website;

        await user.update(updateData);

        // 返回更新后的资料（不包含密码）
        const userData = user.toJSON();
        delete userData.password;
        res.json(userData);
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: '更新用户资料失败' });
    }
};

// 上传头像
const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '请选择要上传的图片' });
        }

        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }

        // 删除旧头像
        if (user.avatar) {
            const oldAvatarPath = path.join(__dirname, '..', user.avatar.replace('/uploads', 'uploads'));
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        const avatarPath = `/uploads/avatars/${req.file.filename}`;
        await user.update({ avatar: avatarPath });

        res.json({ message: '头像上传成功', avatar: avatarPath });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(500).json({ message: '上传头像失败' });
    }
};

// 修改密码
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.scope('withPassword').findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: '当前密码不正确' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: '新密码长度至少为6位' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await user.update({ password: hashedPassword });

        res.json({ message: '密码修改成功' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: '修改密码失败' });
    }
};

// 获取我的评论（分页）
const getUserComments = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Comment.findAndCountAll({
            where: { userId: req.user.id, isDeleted: false },
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        const commentsWithJournal = await Promise.all(
            rows.map(async (comment) => {
                const journal = await Journal.findByPk(comment.journalId);
                return {
                    id: comment.legacyId || comment.id,
                    journalId: comment.journalId,
                    journalTitle: journal?.name || '未知期刊',
                    content: comment.content,
                    rating: comment.rating,
                    createdAt: comment.createdAt
                };
            })
        );

        res.json({
            comments: commentsWithJournal,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                totalItems: count,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error getting user comments:', error);
        res.status(500).json({ message: '获取用户评论失败' });
    }
};

// 获取我的收藏（分页）
const getUserFavorites = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Favorite.findAndCountAll({
            where: { userId: req.user.id },
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset,
            include: [{ model: Journal, as: 'journal' }]
        });

        const favoritesWithJournal = rows.map(f => ({
            id: f.id,
            journal: f.journal,
            createdAt: f.createdAt
        }));

        res.json({
            favorites: favoritesWithJournal,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                totalItems: count,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error getting user favorites:', error);
        res.status(500).json({ message: '获取用户收藏失败' });
    }
};

// 获取用户活动统计
const getUserActivity = async (req, res) => {
    try {
        const stats = await calculateUserStats(req.user.id);

        const recentComments = await Comment.findAll({
            where: { userId: req.user.id, isDeleted: false },
            order: [['created_at', 'DESC']],
            limit: 5
        });

        const recentFavorites = await Favorite.findAll({
            where: { userId: req.user.id },
            order: [['created_at', 'DESC']],
            limit: 5
        });

        const recentActivity = [
            ...recentComments.map(c => ({
                type: 'comment',
                data: c.toJSON(),
                createdAt: c.createdAt
            })),
            ...recentFavorites.map(f => ({
                type: 'favorite',
                data: f.toJSON(),
                createdAt: f.createdAt
            }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ stats, recentActivity });
    } catch (error) {
        console.error('Error getting user activity:', error);
        res.status(500).json({ message: '获取用户活动失败' });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    uploadAvatar: [upload.single('avatar'), uploadAvatar],
    updatePassword,
    getUserComments,
    getUserFavorites,
    getUserActivity
};
