const { Badge, UserBadge, User, Comment, Favorite, Follow } = require('../models');
const { Op } = require('sequelize');

/**
 * 徽章服务层 - Sequelize 版
 * 处理徽章的授予、撤销、查询等业务逻辑
 */
class BadgeService {
  async getUserStats(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const commentCount = await Comment.count({
      where: { userId, isDeleted: false }
    });

    const favoriteCount = await Favorite.count({ where: { userId } });

    const followerCount = await Follow.count({ where: { followingId: userId } });

    const followingCount = await Follow.count({ where: { followerId: userId } });

    const points = (commentCount * 5) + (favoriteCount * 2) + (followerCount * 10);
    const level = Math.min(Math.floor(points / 100) + 1, 100);

    return {
      commentCount,
      favoriteCount,
      followerCount,
      followingCount,
      points,
      level,
      role: user.role || 'user',
      createdAt: user.createdAt
    };
  }

  async checkAndGrantBadges(userId, metric) {
    const stats = await this.getUserStats(userId);
    const currentValue = stats[metric];

    if (currentValue === undefined) {
      throw new Error(`无效的指标类型: ${metric}`);
    }

    const eligibleBadges = await Badge.findAll({
      where: {
        isActive: true,
        type: 'auto'
      }
    });

    // 过滤符合条件的徽章
    const matchedBadges = eligibleBadges.filter(b =>
      b.triggerCondition &&
      b.triggerCondition.metric === metric &&
      b.triggerCondition.threshold <= currentValue
    );

    const ownedBadgeIds = (await UserBadge.findAll({
      where: { userId },
      attributes: ['badgeId']
    })).map(ub => ub.badgeId);

    const newBadges = matchedBadges.filter(b => !ownedBadgeIds.includes(b.id));

    const grantedBadges = [];
    for (const badge of newBadges) {
      const userBadge = await UserBadge.create({
        userId,
        badgeId: badge.id,
        grantedAt: new Date(),
        isNew: true
      });

      grantedBadges.push({
        ...badge.toJSON(),
        userBadgeId: userBadge.id,
        grantedAt: userBadge.grantedAt
      });
    }

    return grantedBadges;
  }

  async checkIdentityBadges(userId) {
    const stats = await this.getUserStats(userId);
    const grantedBadges = [];

    const ownedBadgeIds = (await UserBadge.findAll({
      where: { userId },
      attributes: ['badgeId']
    })).map(ub => ub.badgeId);

    // 检查早期用户徽章
    const earlyUserDeadline = new Date('2026-06-01T00:00:00.000Z');
    const userCreatedAt = new Date(stats.createdAt);

    if (userCreatedAt < earlyUserDeadline) {
      const pioneerBadge = await Badge.findOne({
        where: { code: 'pioneer', isActive: true }
      });

      if (pioneerBadge && !ownedBadgeIds.includes(pioneerBadge.id)) {
        const userBadge = await UserBadge.create({
          userId,
          badgeId: pioneerBadge.id,
          grantedAt: new Date(),
          isNew: true
        });
        grantedBadges.push({
          ...pioneerBadge.toJSON(),
          userBadgeId: userBadge.id,
          grantedAt: userBadge.grantedAt
        });
      }
    }

    // 检查管理员徽章
    if (stats.role === 'admin') {
      const adminBadge = await Badge.findOne({
        where: { code: 'admin', isActive: true }
      });

      if (adminBadge && !ownedBadgeIds.includes(adminBadge.id)) {
        const userBadge = await UserBadge.create({
          userId,
          badgeId: adminBadge.id,
          grantedAt: new Date(),
          isNew: true
        });
        grantedBadges.push({
          ...adminBadge.toJSON(),
          userBadgeId: userBadge.id,
          grantedAt: userBadge.grantedAt
        });
      }
    }

    return grantedBadges;
  }

  async grantBadge(badgeId, userId, grantedBy) {
    const badge = await Badge.findByPk(badgeId);
    if (!badge) throw new Error('徽章不存在');

    const user = await User.findByPk(userId);
    if (!user) throw new Error('用户不存在');

    const existing = await UserBadge.findOne({
      where: { userId, badgeId }
    });

    if (existing) {
      return { alreadyOwned: true, badge: badge.toJSON(), userBadge: existing.toJSON() };
    }

    const userBadge = await UserBadge.create({
      userId,
      badgeId,
      grantedBy,
      grantedAt: new Date(),
      isNew: true
    });

    return { alreadyOwned: false, badge: badge.toJSON(), userBadge: userBadge.toJSON() };
  }

  async revokeBadge(badgeId, userId) {
    const userBadge = await UserBadge.findOne({
      where: { userId, badgeId }
    });

    if (!userBadge) throw new Error('用户未拥有该徽章');

    const revokedData = userBadge.toJSON();
    await userBadge.destroy();

    return { success: true, revokedUserBadge: revokedData };
  }

  async getUserBadges(userId) {
    const userBadges = await UserBadge.findAll({
      where: { userId },
      include: [{ model: Badge, as: 'badge' }]
    });

    return userBadges
      .map(ub => {
        if (!ub.badge) return null;
        return {
          ...ub.badge.toJSON(),
          userBadgeId: ub.id,
          grantedBy: ub.grantedBy,
          grantedAt: ub.grantedAt,
          isNew: ub.isNew
        };
      })
      .filter(b => b !== null)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  async getUserPinnedBadges(userId) {
    const user = await User.findByPk(userId);
    if (!user) return [];

    if (user.pinnedBadges && user.pinnedBadges.length > 0) {
      const pinnedBadges = [];
      for (const badgeId of user.pinnedBadges.slice(0, 3)) {
        const userBadge = await UserBadge.findOne({
          where: { userId, badgeId }
        });
        if (!userBadge) continue;
        const badge = await Badge.findByPk(badgeId);
        if (!badge) continue;
        pinnedBadges.push({
          ...badge.toJSON(),
          userBadgeId: userBadge.id,
          grantedAt: userBadge.grantedAt,
          isNew: userBadge.isNew
        });
      }
      return pinnedBadges;
    }

    const allBadges = await this.getUserBadges(userId);
    return allBadges.slice(0, 3);
  }

  async markBadgesAsRead(userId) {
    const [markedCount] = await UserBadge.update(
      { isNew: false },
      { where: { userId, isNew: true } }
    );
    return markedCount;
  }

  async hasNewBadges(userId) {
    const count = await UserBadge.count({
      where: { userId, isNew: true }
    });
    return count > 0;
  }
}

module.exports = new BadgeService();
