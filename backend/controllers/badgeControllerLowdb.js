const { getDB } = require('../config/databaseLowdb');
const badgeService = require('../services/badgeService');

// ==================== 公开接口 ====================

/**
 * 获取所有启用的徽章
 * GET /api/badges
 */
const getAllBadges = async (req, res) => {
  try {
    const db = getDB();

    const badges = db.data.badges
      .filter(b => b.isActive)
      .map(({ triggerCondition, ...badge }) => badge) // 移除内部字段
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    res.json({
      success: true,
      data: badges
    });
  } catch (error) {
    console.error('Error getting all badges:', error);
    res.status(500).json({
      success: false,
      message: '获取徽章列表失败'
    });
  }
};

/**
 * 获取指定用户的徽章
 * GET /api/badges/user/:userId
 */
const getUserBadges = async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDB();

    // 验证用户是否存在
    const user = db.data.users.find(u => u.id === parseInt(userId));
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const badges = badgeService.getUserBadges(parseInt(userId));
    const pinnedBadges = badgeService.getUserPinnedBadges(parseInt(userId));

    // 移除 isNew 字段（其他用户不需要看到）
    const sanitizedBadges = badges.map(({ isNew, ...badge }) => badge);
    const sanitizedPinnedBadges = pinnedBadges.map(({ isNew, ...badge }) => badge);

    res.json({
      success: true,
      data: {
        badges: sanitizedBadges,
        pinnedBadges: sanitizedPinnedBadges
      }
    });
  } catch (error) {
    console.error('Error getting user badges:', error);
    res.status(500).json({
      success: false,
      message: '获取用户徽章失败'
    });
  }
};

// ==================== 用户接口（需登录） ====================

/**
 * 获取当前用户徽章（含未读状态）
 * GET /api/badges/my
 */
const getMyBadges = async (req, res) => {
  try {
    const userId = req.user.id;

    const badges = badgeService.getUserBadges(userId);
    const pinnedBadges = badgeService.getUserPinnedBadges(userId);
    const hasNewBadges = badgeService.hasNewBadges(userId);

    res.json({
      success: true,
      data: {
        badges,
        pinnedBadges,
        hasNewBadges
      }
    });
  } catch (error) {
    console.error('Error getting my badges:', error);
    res.status(500).json({
      success: false,
      message: '获取我的徽章失败'
    });
  }
};

/**
 * 设置置顶徽章
 * PUT /api/badges/my/pinned
 * body: { badgeIds: [1, 2, 3] } - 最多3个
 */
const setPinnedBadges = async (req, res) => {
  try {
    const { badgeIds } = req.body;
    const userId = req.user.id;
    const db = getDB();

    // 验证参数
    if (!Array.isArray(badgeIds)) {
      return res.status(400).json({
        success: false,
        message: 'badgeIds 必须是数组'
      });
    }

    if (badgeIds.length > 3) {
      return res.status(400).json({
        success: false,
        message: '最多只能置顶3个徽章'
      });
    }

    // 验证用户是否拥有这些徽章
    const userBadgeIds = db.data.userBadges
      .filter(ub => ub.userId === userId)
      .map(ub => ub.badgeId);

    const invalidBadgeIds = badgeIds.filter(id => !userBadgeIds.includes(id));
    if (invalidBadgeIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `您未拥有以下徽章: ${invalidBadgeIds.join(', ')}`
      });
    }

    // 更新用户的置顶徽章
    const user = db.data.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    user.pinnedBadges = badgeIds;
    await db.write();

    const pinnedBadges = badgeService.getUserPinnedBadges(userId);

    res.json({
      success: true,
      data: {
        pinnedBadges
      }
    });
  } catch (error) {
    console.error('Error setting pinned badges:', error);
    res.status(500).json({
      success: false,
      message: '设置置顶徽章失败'
    });
  }
};

/**
 * 标记徽章为已读
 * POST /api/badges/my/read
 */
const markBadgesAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const markedCount = await badgeService.markBadgesAsRead(userId);

    res.json({
      success: true,
      data: {
        markedCount
      }
    });
  } catch (error) {
    console.error('Error marking badges as read:', error);
    res.status(500).json({
      success: false,
      message: '标记徽章已读失败'
    });
  }
};

// ==================== 管理员接口 ====================

/**
 * 获取所有徽章（含禁用的）+ 获得人数统计
 * GET /api/badges/admin/all
 */
const adminGetAllBadges = async (req, res) => {
  try {
    const db = getDB();

    const badges = db.data.badges.map(badge => {
      // 统计获得该徽章的人数
      const holderCount = db.data.userBadges.filter(
        ub => ub.badgeId === badge.id
      ).length;

      return {
        ...badge,
        holderCount
      };
    }).sort((a, b) => (b.priority || 0) - (a.priority || 0));

    res.json({
      success: true,
      data: badges
    });
  } catch (error) {
    console.error('Error getting all badges for admin:', error);
    res.status(500).json({
      success: false,
      message: '获取徽章列表失败'
    });
  }
};

/**
 * 创建新徽章
 * POST /api/badges/admin
 */
const createBadge = async (req, res) => {
  try {
    const { code, name, description, icon, color, type, priority, triggerCondition } = req.body;
    const db = getDB();

    // 验证必填字段
    if (!code || !name || !icon) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: code, name, icon'
      });
    }

    // 验证 code 唯一性
    const existingBadge = db.data.badges.find(b => b.code === code);
    if (existingBadge) {
      return res.status(400).json({
        success: false,
        message: `徽章代码 "${code}" 已存在`
      });
    }

    // 生成新ID
    const newId = db.data.badges.length > 0
      ? Math.max(...db.data.badges.map(b => b.id)) + 1
      : 1;

    const newBadge = {
      id: newId,
      code,
      name,
      description: description || '',
      icon,
      color: color || '#6366f1',
      type: type || 'manual',
      priority: priority || 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    // 如果是自动徽章，添加触发条件
    if (type === 'auto' && triggerCondition) {
      newBadge.triggerCondition = triggerCondition;
    }

    db.data.badges.push(newBadge);
    await db.write();

    res.status(201).json({
      success: true,
      data: newBadge
    });
  } catch (error) {
    console.error('Error creating badge:', error);
    res.status(500).json({
      success: false,
      message: '创建徽章失败'
    });
  }
};

/**
 * 编辑徽章
 * PUT /api/badges/admin/:id
 */
const updateBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, type, priority, triggerCondition, isActive } = req.body;
    const db = getDB();

    const badge = db.data.badges.find(b => b.id === parseInt(id));
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: '徽章不存在'
      });
    }

    // 更新字段
    if (name !== undefined) badge.name = name;
    if (description !== undefined) badge.description = description;
    if (icon !== undefined) badge.icon = icon;
    if (color !== undefined) badge.color = color;
    if (type !== undefined) badge.type = type;
    if (priority !== undefined) badge.priority = priority;
    if (isActive !== undefined) badge.isActive = isActive;
    if (triggerCondition !== undefined) badge.triggerCondition = triggerCondition;

    badge.updatedAt = new Date().toISOString();

    await db.write();

    res.json({
      success: true,
      data: badge
    });
  } catch (error) {
    console.error('Error updating badge:', error);
    res.status(500).json({
      success: false,
      message: '编辑徽章失败'
    });
  }
};

/**
 * 删除徽章（软删除，设置 isActive=false）
 * DELETE /api/badges/admin/:id
 */
const deleteBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const badge = db.data.badges.find(b => b.id === parseInt(id));
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: '徽章不存在'
      });
    }

    // 软删除
    badge.isActive = false;
    badge.deletedAt = new Date().toISOString();

    await db.write();

    res.json({
      success: true,
      message: '徽章已禁用'
    });
  } catch (error) {
    console.error('Error deleting badge:', error);
    res.status(500).json({
      success: false,
      message: '删除徽章失败'
    });
  }
};

/**
 * 授予徽章给用户
 * POST /api/badges/admin/:id/grant
 * body: { userId }
 */
const grantBadgeToUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const grantedBy = req.user.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: userId'
      });
    }

    const result = await badgeService.grantBadge(parseInt(id), parseInt(userId), grantedBy);

    if (result.alreadyOwned) {
      return res.json({
        success: true,
        message: '用户已拥有该徽章',
        data: result
      });
    }

    res.json({
      success: true,
      message: '徽章授予成功',
      data: result
    });
  } catch (error) {
    console.error('Error granting badge:', error);

    // 处理业务错误
    if (error.message === '徽章不存在' || error.message === '用户不存在') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: '授予徽章失败'
    });
  }
};

/**
 * 撤销用户徽章
 * POST /api/badges/admin/:id/revoke
 * body: { userId }
 */
const revokeBadgeFromUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: userId'
      });
    }

    const result = await badgeService.revokeBadge(parseInt(id), parseInt(userId));

    res.json({
      success: true,
      message: '徽章撤销成功',
      data: result
    });
  } catch (error) {
    console.error('Error revoking badge:', error);

    // 处理业务错误
    if (error.message === '用户未拥有该徽章') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: '撤销徽章失败'
    });
  }
};

/**
 * 徽章统计
 * GET /api/badges/admin/stats
 */
const getBadgeStats = async (req, res) => {
  try {
    const db = getDB();

    // 总徽章数
    const totalBadges = db.data.badges.length;
    const activeBadges = db.data.badges.filter(b => b.isActive).length;
    const inactiveBadges = totalBadges - activeBadges;

    // 按类型统计
    const byType = {
      auto: db.data.badges.filter(b => b.type === 'auto').length,
      manual: db.data.badges.filter(b => b.type === 'manual').length,
      identity: db.data.badges.filter(b => b.type === 'identity').length
    };

    // 总授予次数
    const totalGrants = db.data.userBadges.length;

    // 拥有徽章的用户数
    const usersWithBadges = new Set(db.data.userBadges.map(ub => ub.userId)).size;

    // 最受欢迎的徽章（按获得人数）
    const badgeHolderCounts = db.data.badges.map(badge => ({
      id: badge.id,
      name: badge.name,
      icon: badge.icon,
      count: db.data.userBadges.filter(ub => ub.badgeId === badge.id).length
    })).sort((a, b) => b.count - a.count);

    const topBadges = badgeHolderCounts.slice(0, 5);

    // 最近授予的徽章
    const recentGrants = db.data.userBadges
      .sort((a, b) => new Date(b.grantedAt) - new Date(a.grantedAt))
      .slice(0, 10)
      .map(ub => {
        const badge = db.data.badges.find(b => b.id === ub.badgeId);
        const user = db.data.users.find(u => u.id === ub.userId);
        return {
          userBadgeId: ub.id,
          badge: badge ? { id: badge.id, name: badge.name, icon: badge.icon } : null,
          user: user ? { id: user.id, name: user.name, email: user.email } : null,
          grantedAt: ub.grantedAt
        };
      });

    res.json({
      success: true,
      data: {
        totalBadges,
        activeBadges,
        inactiveBadges,
        byType,
        totalGrants,
        usersWithBadges,
        topBadges,
        recentGrants
      }
    });
  } catch (error) {
    console.error('Error getting badge stats:', error);
    res.status(500).json({
      success: false,
      message: '获取徽章统计失败'
    });
  }
};

/**
 * 批量授予徽章
 * POST /api/badges/admin/batch-grant
 * body: { badgeId, userIds: [] }
 */
const batchGrantBadge = async (req, res) => {
  try {
    const { badgeId, userIds } = req.body;
    const grantedBy = req.user.id;
    const db = getDB();

    // 验证参数
    if (!badgeId) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: badgeId'
      });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userIds 必须是非空数组'
      });
    }

    // 验证徽章是否存在
    const badge = db.data.badges.find(b => b.id === parseInt(badgeId));
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: '徽章不存在'
      });
    }

    const results = {
      success: [],
      alreadyOwned: [],
      failed: []
    };

    for (const userId of userIds) {
      try {
        const result = await badgeService.grantBadge(parseInt(badgeId), parseInt(userId), grantedBy);
        if (result.alreadyOwned) {
          results.alreadyOwned.push(userId);
        } else {
          results.success.push(userId);
        }
      } catch (error) {
        results.failed.push({
          userId,
          reason: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `成功授予 ${results.success.length} 人，${results.alreadyOwned.length} 人已拥有，${results.failed.length} 人失败`,
      data: results
    });
  } catch (error) {
    console.error('Error batch granting badge:', error);
    res.status(500).json({
      success: false,
      message: '批量授予徽章失败'
    });
  }
};

module.exports = {
  getAllBadges,
  getUserBadges,
  getMyBadges,
  setPinnedBadges,
  markBadgesAsRead,
  adminGetAllBadges,
  createBadge,
  updateBadge,
  deleteBadge,
  grantBadgeToUser,
  revokeBadgeFromUser,
  getBadgeStats,
  batchGrantBadge
};
