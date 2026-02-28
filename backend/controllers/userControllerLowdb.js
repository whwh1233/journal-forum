const { getDB } = require('../config/databaseLowdb');
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
const calculateUserStats = (userId, db) => {
  const commentCount = db.data.comments.filter(
    c => c.userId === parseInt(userId) && !c.isDeleted
  ).length;

  const favoriteCount = db.data.favorites?.filter(
    f => f.userId === parseInt(userId)
  ).length || 0;

  const followingCount = db.data.follows?.filter(
    f => f.followerId === parseInt(userId)
  ).length || 0;

  const followerCount = db.data.follows?.filter(
    f => f.followingId === parseInt(userId)
  ).length || 0;

  // 计算积分：评论记 5 分，收藏记 2 分，粉丝记 10 分
  const points = (commentCount * 5) + (favoriteCount * 2) + (followerCount * 10);

  // 计算等级：每100分升一级（最大Lv.100）
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
    const db = getDB();

    const user = db.data.users.find(u => u.id === parseInt(userId));

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 计算统计信息
    const stats = calculateUserStats(userId, db);

    // 返回公开信息（不包含密码）
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
    const db = getDB();

    const user = db.data.users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 验证 website URL 格式
    if (website && !website.match(/^https?:\/\/.+/)) {
      return res.status(400).json({ message: '网站地址格式不正确，必须以 http:// 或 https:// 开头' });
    }

    // 更新字段
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (institution !== undefined) user.institution = institution;
    if (website !== undefined) user.website = website;

    await db.write();

    // 返回更新后的资料（不包含密码）
    const { password, ...userProfile } = user;

    res.json(userProfile);
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

    const db = getDB();
    const user = db.data.users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 删除旧头像（如果存在）
    if (user.avatar) {
      const oldAvatarPath = path.join(__dirname, '..', user.avatar.replace('/uploads', 'uploads'));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // 保存新头像路径
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await db.write();

    res.json({
      message: '头像上传成功',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: '上传头像失败' });
  }
};

// 修改密码
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const db = getDB();

    const user = db.data.users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 验证当前密码
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '当前密码不正确' });
    }

    // 验证新密码强度
    if (newPassword.length < 6) {
      return res.status(400).json({ message: '新密码长度至少为6位' });
    }

    // 加密新密码
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await db.write();

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
    const db = getDB();

    // 获取用户所有评论
    const userComments = db.data.comments
      .filter(c => c.userId === req.user.id && !c.isDeleted)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 分页
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedComments = userComments.slice(startIndex, endIndex);

    // 组装评论数据（包含期刊信息）
    const commentsWithJournal = paginatedComments.map(comment => {
      const journal = db.data.journals.find(j => j.id === comment.journalId);
      return {
        id: comment.id,
        journalId: comment.journalId,
        journalTitle: journal?.title || '未知期刊',
        content: comment.content,
        rating: comment.rating,
        createdAt: comment.createdAt
      };
    });

    res.json({
      comments: commentsWithJournal,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(userComments.length / parseInt(limit)),
        totalItems: userComments.length,
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
    const db = getDB();

    // 获取用户所有收藏
    const userFavorites = db.data.favorites
      ?.filter(f => f.userId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) || [];

    // 分页
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedFavorites = userFavorites.slice(startIndex, endIndex);

    // 组装收藏数据（包含期刊信息）
    const favoritesWithJournal = paginatedFavorites.map(favorite => {
      const journal = db.data.journals.find(j => j.id === favorite.journalId);
      return {
        id: favorite.id,
        journal,
        createdAt: favorite.createdAt
      };
    });

    res.json({
      favorites: favoritesWithJournal,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(userFavorites.length / parseInt(limit)),
        totalItems: userFavorites.length,
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
    const db = getDB();
    const stats = calculateUserStats(req.user.id, db);

    // 获取最近活动（最近的评论和收藏）
    const recentComments = db.data.comments
      .filter(c => c.userId === req.user.id && !c.isDeleted)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const recentFavorites = db.data.favorites
      ?.filter(f => f.userId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5) || [];

    const recentActivity = [
      ...recentComments.map(c => ({
        type: 'comment',
        data: c,
        createdAt: c.createdAt
      })),
      ...recentFavorites.map(f => ({
        type: 'favorite',
        data: f,
        createdAt: f.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      stats,
      recentActivity
    });
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
