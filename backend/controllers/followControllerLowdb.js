const { getDB } = require('../config/databaseLowdb');
const badgeService = require('../services/badgeService');

// 关注用户
const followUser = async (req, res) => {
  try {
    const { followingId } = req.body;
    const db = getDB();

    // 不能关注自己
    if (req.user.id === parseInt(followingId)) {
      return res.status(400).json({
        success: false,
        message: '不能关注自己'
      });
    }

    // 验证被关注用户是否存在
    const targetUser = db.data.users.find(u => u.id === parseInt(followingId));
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 检查是否已关注
    const existing = db.data.follows.find(
      f => f.followerId === req.user.id && f.followingId === parseInt(followingId)
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: '已经关注过该用户'
      });
    }

    // 创建关注记录
    const newFollow = {
      id: db.data.follows.length > 0
        ? Math.max(...db.data.follows.map(f => f.id)) + 1
        : 1,
      followerId: req.user.id,
      followingId: parseInt(followingId),
      createdAt: new Date().toISOString()
    };

    db.data.follows.push(newFollow);
    await db.write();

    // 检查被关注者的粉丝徽章
    let targetUserNewBadges = [];
    try {
      targetUserNewBadges = await badgeService.checkAndGrantBadges(parseInt(followingId), 'followerCount');
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
    res.status(500).json({
      success: false,
      message: '关注失败'
    });
  }
};

// 取消关注
const unfollowUser = async (req, res) => {
  try {
    const { followingId } = req.params;
    const db = getDB();

    const followIndex = db.data.follows.findIndex(
      f => f.followerId === req.user.id && f.followingId === parseInt(followingId)
    );

    if (followIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '未关注该用户'
      });
    }

    db.data.follows.splice(followIndex, 1);
    await db.write();

    res.json({
      success: true,
      message: '取消关注成功'
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({
      success: false,
      message: '取消关注失败'
    });
  }
};

// 检查是否已关注
const checkFollow = async (req, res) => {
  try {
    const { followingId } = req.params;
    const db = getDB();

    const isFollowing = db.data.follows.some(
      f => f.followerId === req.user.id && f.followingId === parseInt(followingId)
    );

    res.json({
      success: true,
      data: { isFollowing }
    });
  } catch (error) {
    console.error('Error checking follow:', error);
    res.status(500).json({
      success: false,
      message: '检查关注状态失败'
    });
  }
};

// 获取粉丝列表
const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const db = getDB();

    const followers = db.data.follows
      .filter(f => f.followingId === parseInt(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedFollowers = followers.slice(startIndex, endIndex);

    const followersWithUser = paginatedFollowers.map(follow => {
      const user = db.data.users.find(u => u.id === follow.followerId);
      return {
        id: follow.id,
        user: user ? {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar
        } : null,
        createdAt: follow.createdAt
      };
    });

    res.json({
      success: true,
      data: {
        followers: followersWithUser,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(followers.length / parseInt(limit)),
          totalItems: followers.length,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting followers:', error);
    res.status(500).json({
      success: false,
      message: '获取粉丝列表失败'
    });
  }
};

// 获取关注列表
const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const db = getDB();

    const following = db.data.follows
      .filter(f => f.followerId === parseInt(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedFollowing = following.slice(startIndex, endIndex);

    const followingWithUser = paginatedFollowing.map(follow => {
      const user = db.data.users.find(u => u.id === follow.followingId);
      return {
        id: follow.id,
        user: user ? {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar
        } : null,
        createdAt: follow.createdAt
      };
    });

    res.json({
      success: true,
      data: {
        following: followingWithUser,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(following.length / parseInt(limit)),
          totalItems: following.length,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting following:', error);
    res.status(500).json({
      success: false,
      message: '获取关注列表失败'
    });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  checkFollow,
  getFollowers,
  getFollowing
};
