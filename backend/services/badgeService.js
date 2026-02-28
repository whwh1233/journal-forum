const { getDB } = require('../config/databaseLowdb');

/**
 * 徽章服务层
 * 处理徽章的授予、撤销、查询等业务逻辑
 */
class BadgeService {
  /**
   * 获取用户统计数据
   * @param {number} userId - 用户ID
   * @returns {Object} 用户统计数据
   */
  getUserStats(userId) {
    const db = getDB();
    const user = db.data.users.find(u => u.id === parseInt(userId));

    if (!user) {
      throw new Error('用户不存在');
    }

    // 统计评论数（不包括已删除的评论）
    const commentCount = db.data.comments.filter(
      c => c.userId === parseInt(userId) && !c.isDeleted
    ).length;

    // 统计收藏数
    const favoriteCount = db.data.favorites.filter(
      f => f.userId === parseInt(userId)
    ).length;

    // 统计粉丝数（关注该用户的人数）
    const followerCount = db.data.follows.filter(
      f => f.followingId === parseInt(userId)
    ).length;

    // 统计关注数（该用户关注的人数）
    const followingCount = db.data.follows.filter(
      f => f.followerId === parseInt(userId)
    ).length;

    return {
      commentCount,
      favoriteCount,
      followerCount,
      followingCount,
      role: user.role || 'user',
      createdAt: user.createdAt
    };
  }

  /**
   * 检查并授予活跃度徽章
   * @param {number} userId - 用户ID
   * @param {string} metric - 指标类型 ('commentCount' | 'favoriteCount' | 'followerCount')
   * @returns {Promise<Array>} 新获得的徽章数组
   */
  async checkAndGrantBadges(userId, metric) {
    const db = getDB();
    const stats = this.getUserStats(userId);
    const currentValue = stats[metric];

    if (currentValue === undefined) {
      throw new Error(`无效的指标类型: ${metric}`);
    }

    // 查询该指标的所有自动徽章
    const eligibleBadges = db.data.badges.filter(
      b => b.isActive &&
           b.type === 'auto' &&
           b.triggerCondition &&
           b.triggerCondition.metric === metric &&
           b.triggerCondition.threshold <= currentValue
    );

    // 获取用户已拥有的徽章ID
    const ownedBadgeIds = db.data.userBadges
      .filter(ub => ub.userId === parseInt(userId))
      .map(ub => ub.badgeId);

    // 筛选出尚未拥有的徽章
    const newBadges = eligibleBadges.filter(
      b => !ownedBadgeIds.includes(b.id)
    );

    // 授予新徽章
    const grantedBadges = [];
    for (const badge of newBadges) {
      const userBadge = {
        id: db.data.userBadges.length > 0
          ? Math.max(...db.data.userBadges.map(ub => ub.id)) + 1
          : 1,
        userId: parseInt(userId),
        badgeId: badge.id,
        grantedAt: new Date().toISOString(),
        isNew: true
      };

      db.data.userBadges.push(userBadge);
      grantedBadges.push({
        ...badge,
        userBadgeId: userBadge.id,
        grantedAt: userBadge.grantedAt
      });
    }

    if (grantedBadges.length > 0) {
      await db.write();
    }

    return grantedBadges;
  }

  /**
   * 检查身份徽章（登录时调用）
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 新获得的徽章数组
   */
  async checkIdentityBadges(userId) {
    const db = getDB();
    const stats = this.getUserStats(userId);
    const grantedBadges = [];

    // 获取用户已拥有的徽章ID
    const ownedBadgeIds = db.data.userBadges
      .filter(ub => ub.userId === parseInt(userId))
      .map(ub => ub.badgeId);

    // 检查早期用户徽章（注册时间 < 2026-06-01）
    const earlyUserDeadline = new Date('2026-06-01T00:00:00.000Z');
    const userCreatedAt = new Date(stats.createdAt);

    if (userCreatedAt < earlyUserDeadline) {
      const pioneerBadge = db.data.badges.find(
        b => b.code === 'pioneer' && b.isActive
      );

      if (pioneerBadge && !ownedBadgeIds.includes(pioneerBadge.id)) {
        const userBadge = {
          id: db.data.userBadges.length > 0
            ? Math.max(...db.data.userBadges.map(ub => ub.id)) + 1
            : 1,
          userId: parseInt(userId),
          badgeId: pioneerBadge.id,
          grantedAt: new Date().toISOString(),
          isNew: true
        };

        db.data.userBadges.push(userBadge);
        grantedBadges.push({
          ...pioneerBadge,
          userBadgeId: userBadge.id,
          grantedAt: userBadge.grantedAt
        });
      }
    }

    // 检查管理员徽章
    if (stats.role === 'admin') {
      const adminBadge = db.data.badges.find(
        b => b.code === 'admin' && b.isActive
      );

      if (adminBadge && !ownedBadgeIds.includes(adminBadge.id)) {
        const userBadge = {
          id: db.data.userBadges.length > 0
            ? Math.max(...db.data.userBadges.map(ub => ub.id)) + 1
            : 1,
          userId: parseInt(userId),
          badgeId: adminBadge.id,
          grantedAt: new Date().toISOString(),
          isNew: true
        };

        db.data.userBadges.push(userBadge);
        grantedBadges.push({
          ...adminBadge,
          userBadgeId: userBadge.id,
          grantedAt: userBadge.grantedAt
        });
      }
    }

    if (grantedBadges.length > 0) {
      await db.write();
    }

    return grantedBadges;
  }

  /**
   * 手动授予徽章
   * @param {number} badgeId - 徽章ID
   * @param {number} userId - 用户ID
   * @param {number} grantedBy - 授予者ID（管理员）
   * @returns {Promise<Object>} 授予结果
   */
  async grantBadge(badgeId, userId, grantedBy) {
    const db = getDB();

    // 验证徽章是否存在
    const badge = db.data.badges.find(b => b.id === parseInt(badgeId));
    if (!badge) {
      throw new Error('徽章不存在');
    }

    // 验证用户是否存在
    const user = db.data.users.find(u => u.id === parseInt(userId));
    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查是否已拥有该徽章（幂等处理）
    const existingUserBadge = db.data.userBadges.find(
      ub => ub.userId === parseInt(userId) && ub.badgeId === parseInt(badgeId)
    );

    if (existingUserBadge) {
      return {
        alreadyOwned: true,
        badge,
        userBadge: existingUserBadge
      };
    }

    // 创建用户徽章记录
    const userBadge = {
      id: db.data.userBadges.length > 0
        ? Math.max(...db.data.userBadges.map(ub => ub.id)) + 1
        : 1,
      userId: parseInt(userId),
      badgeId: parseInt(badgeId),
      grantedBy: parseInt(grantedBy),
      grantedAt: new Date().toISOString(),
      isNew: true
    };

    db.data.userBadges.push(userBadge);
    await db.write();

    return {
      alreadyOwned: false,
      badge,
      userBadge
    };
  }

  /**
   * 撤销徽章
   * @param {number} badgeId - 徽章ID
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 撤销结果
   */
  async revokeBadge(badgeId, userId) {
    const db = getDB();

    const userBadgeIndex = db.data.userBadges.findIndex(
      ub => ub.userId === parseInt(userId) && ub.badgeId === parseInt(badgeId)
    );

    if (userBadgeIndex === -1) {
      throw new Error('用户未拥有该徽章');
    }

    const revokedUserBadge = db.data.userBadges[userBadgeIndex];
    db.data.userBadges.splice(userBadgeIndex, 1);
    await db.write();

    return {
      success: true,
      revokedUserBadge
    };
  }

  /**
   * 获取用户的所有徽章
   * @param {number} userId - 用户ID
   * @returns {Array} 用户徽章列表，按优先级排序
   */
  getUserBadges(userId) {
    const db = getDB();

    const userBadges = db.data.userBadges.filter(
      ub => ub.userId === parseInt(userId)
    );

    // 关联徽章详情并按优先级排序
    const badgesWithDetails = userBadges
      .map(ub => {
        const badge = db.data.badges.find(b => b.id === ub.badgeId);
        if (!badge) return null;
        return {
          ...badge,
          userBadgeId: ub.id,
          grantedBy: ub.grantedBy,
          grantedAt: ub.grantedAt,
          isNew: ub.isNew
        };
      })
      .filter(b => b !== null)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return badgesWithDetails;
  }

  /**
   * 获取用户的置顶徽章（最多3个）
   * @param {number} userId - 用户ID
   * @returns {Array} 置顶徽章列表
   */
  getUserPinnedBadges(userId) {
    const db = getDB();
    const user = db.data.users.find(u => u.id === parseInt(userId));

    if (!user) {
      return [];
    }

    // 如果用户设置了置顶徽章
    if (user.pinnedBadges && user.pinnedBadges.length > 0) {
      const pinnedBadges = user.pinnedBadges
        .slice(0, 3)
        .map(badgeId => {
          const userBadge = db.data.userBadges.find(
            ub => ub.userId === parseInt(userId) && ub.badgeId === badgeId
          );
          if (!userBadge) return null;

          const badge = db.data.badges.find(b => b.id === badgeId);
          if (!badge) return null;

          return {
            ...badge,
            userBadgeId: userBadge.id,
            grantedAt: userBadge.grantedAt,
            isNew: userBadge.isNew
          };
        })
        .filter(b => b !== null);

      return pinnedBadges;
    }

    // 否则返回优先级最高的3个徽章
    return this.getUserBadges(userId).slice(0, 3);
  }

  /**
   * 标记徽章为已读
   * @param {number} userId - 用户ID
   * @returns {Promise<number>} 标记数量
   */
  async markBadgesAsRead(userId) {
    const db = getDB();
    let markedCount = 0;

    db.data.userBadges.forEach(ub => {
      if (ub.userId === parseInt(userId) && ub.isNew === true) {
        ub.isNew = false;
        markedCount++;
      }
    });

    if (markedCount > 0) {
      await db.write();
    }

    return markedCount;
  }

  /**
   * 检查是否有未读徽章
   * @param {number} userId - 用户ID
   * @returns {boolean} 是否有未读徽章
   */
  hasNewBadges(userId) {
    const db = getDB();

    return db.data.userBadges.some(
      ub => ub.userId === parseInt(userId) && ub.isNew === true
    );
  }
}

module.exports = new BadgeService();
