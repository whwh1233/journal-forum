# 徽章系统实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现用户徽章系统，支持自动/手动授予徽章、用户置顶展示、管理员完整管理功能。

**Architecture:** 后端新增 badges 和 userBadges 数据集合，通过 badgeService 实现自动授予逻辑。前端新增 badges feature 模块，包含展示组件和管理页面。在现有评论/收藏/关注操作后触发徽章检查。

**Tech Stack:** Node.js + Express + LowDB (后端)，React + TypeScript + Lucide Icons (前端)，使用 ui-ux-pro-max skill 设计 UI 样式。

---

## Task 1: 后端数据模型初始化

**Files:**
- Modify: `backend/config/databaseLowdb.js:10-17`
- Create: `backend/data/initialBadges.js`

**Step 1: 创建初始徽章数据文件**

创建 `backend/data/initialBadges.js`:

```javascript
const initialBadges = [
  // 评论徽章 - 科举体系
  {
    id: 1,
    code: 'comment_5',
    name: '童生',
    description: '初涉学海，发表 5 条评论',
    icon: 'Feather',
    color: '#8B5CF6',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'commentCount', threshold: 5 },
    priority: 10,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    code: 'comment_15',
    name: '秀才',
    description: '小有见地，发表 15 条评论',
    icon: 'PenLine',
    color: '#6366F1',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'commentCount', threshold: 15 },
    priority: 20,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    code: 'comment_30',
    name: '举人',
    description: '声名渐起，发表 30 条评论',
    icon: 'Scroll',
    color: '#4F46E5',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'commentCount', threshold: 30 },
    priority: 30,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    code: 'comment_50',
    name: '进士',
    description: '金榜题名，发表 50 条评论',
    icon: 'GraduationCap',
    color: '#4338CA',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'commentCount', threshold: 50 },
    priority: 40,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  // 收藏徽章 - 藏书家体系
  {
    id: 5,
    code: 'favorite_5',
    name: '书童',
    description: '初入书阁，收藏 5 刊',
    icon: 'BookOpen',
    color: '#059669',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'favoriteCount', threshold: 5 },
    priority: 10,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 6,
    code: 'favorite_15',
    name: '藏书郎',
    description: '涉猎渐广，收藏 15 刊',
    icon: 'BookMarked',
    color: '#047857',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'favoriteCount', threshold: 15 },
    priority: 20,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 7,
    code: 'favorite_30',
    name: '典籍使',
    description: '博览群书，收藏 30 刊',
    icon: 'Library',
    color: '#065F46',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'favoriteCount', threshold: 30 },
    priority: 30,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 8,
    code: 'favorite_50',
    name: '文渊阁士',
    description: '学富五车，收藏 50 刊',
    icon: 'Crown',
    color: '#064E3B',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'favoriteCount', threshold: 50 },
    priority: 40,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  // 粉丝徽章 - 学术职称体系
  {
    id: 9,
    code: 'follower_5',
    name: '助教',
    description: '初登讲台，5 人关注',
    icon: 'User',
    color: '#DC2626',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'followerCount', threshold: 5 },
    priority: 10,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 10,
    code: 'follower_15',
    name: '讲师',
    description: '桃李初开，15 人关注',
    icon: 'Users',
    color: '#B91C1C',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'followerCount', threshold: 15 },
    priority: 20,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 11,
    code: 'follower_30',
    name: '副教授',
    description: '声望渐隆，30 人关注',
    icon: 'UserCheck',
    color: '#991B1B',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'followerCount', threshold: 30 },
    priority: 30,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 12,
    code: 'follower_50',
    name: '教授',
    description: '桃李满园，50 人关注',
    icon: 'Award',
    color: '#7F1D1D',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'followerCount', threshold: 50 },
    priority: 40,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  // 身份徽章
  {
    id: 13,
    code: 'early_bird',
    name: '拓荒学者',
    description: '平台早期建设者',
    icon: 'Sunrise',
    color: '#F59E0B',
    category: 'identity',
    type: 'auto',
    triggerCondition: { metric: 'accountAge', threshold: new Date('2026-06-01').getTime() },
    priority: 100,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 14,
    code: 'verified_admin',
    name: '学监',
    description: '平台管理员',
    icon: 'Shield',
    color: '#1D4ED8',
    category: 'identity',
    type: 'auto',
    triggerCondition: { metric: 'role', threshold: 'admin' },
    priority: 200,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  // 荣誉徽章（手动授予）
  {
    id: 15,
    code: 'outstanding_contributor',
    name: '翰林待诏',
    description: '对社区有突出贡献',
    icon: 'Medal',
    color: '#CA8A04',
    category: 'honor',
    type: 'manual',
    priority: 150,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 16,
    code: 'quality_reviewer',
    name: '太学博士',
    description: '评论质量卓越',
    icon: 'Sparkles',
    color: '#9333EA',
    category: 'honor',
    type: 'manual',
    priority: 150,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 17,
    code: 'helpful_member',
    name: '乐道先生',
    description: '热心帮助他人',
    icon: 'Heart',
    color: '#EC4899',
    category: 'honor',
    type: 'manual',
    priority: 150,
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

module.exports = { initialBadges };
```

**Step 2: 修改数据库配置**

修改 `backend/config/databaseLowdb.js`，在 defaultData 中添加 badges 和 userBadges:

```javascript
// 默认数据结构
const defaultData = {
  journals: [],
  users: [],
  comments: [],
  favorites: [],
  follows: [],
  badges: [],      // 新增
  userBadges: [],  // 新增
  migrated: {}
};
```

在 connectDB 函数中添加初始化逻辑:

```javascript
// 确保所有必需的数组存在
if (!db.data.badges) db.data.badges = [];
if (!db.data.userBadges) db.data.userBadges = [];

// 初始化徽章数据（仅当为空时）
if (db.data.badges.length === 0) {
  const { initialBadges } = require('../data/initialBadges');
  db.data.badges = initialBadges;
  await db.write();
  console.log('Initial badges data loaded');
}
```

**Step 3: 运行后端验证数据库初始化**

Run: `cd backend && npm start`
Expected: 控制台输出 "Initial badges data loaded"

**Step 4: 提交**

```bash
git add backend/data/initialBadges.js backend/config/databaseLowdb.js
git commit -m "feat(badges): 添加徽章数据模型和初始数据"
```

---

## Task 2: 后端徽章服务层

**Files:**
- Create: `backend/services/badgeService.js`

**Step 1: 创建徽章服务**

创建 `backend/services/badgeService.js`:

```javascript
const { getDB } = require('../config/databaseLowdb');

class BadgeService {
  /**
   * 获取用户的统计数据
   */
  getUserStats(userId) {
    const db = getDB();
    const commentCount = db.data.comments.filter(
      c => c.userId === userId && !c.isDeleted
    ).length;
    const favoriteCount = db.data.favorites.filter(
      f => f.userId === userId
    ).length;
    const followerCount = db.data.follows.filter(
      f => f.followingId === userId
    ).length;
    const followingCount = db.data.follows.filter(
      f => f.followerId === userId
    ).length;
    const user = db.data.users.find(u => u.id === userId);

    return {
      commentCount,
      favoriteCount,
      followerCount,
      followingCount,
      role: user?.role || 'user',
      createdAt: user?.createdAt
    };
  }

  /**
   * 检查并授予活跃度徽章
   * @param {number} userId - 用户ID
   * @param {string} metric - 检查的指标类型
   * @returns {Array} 新获得的徽章列表
   */
  async checkAndGrantBadges(userId, metric) {
    const db = getDB();
    const stats = this.getUserStats(userId);
    const newBadges = [];

    // 获取该指标类型的所有自动徽章
    const autoBadges = db.data.badges.filter(
      b => b.type === 'auto' &&
           b.isActive &&
           b.triggerCondition?.metric === metric
    );

    for (const badge of autoBadges) {
      // 检查用户是否已拥有该徽章
      const hasOwnedBadge = db.data.userBadges.some(
        ub => ub.userId === userId && ub.badgeId === badge.id
      );

      if (hasOwnedBadge) continue;

      // 检查是否满足条件
      const currentValue = stats[metric];
      const threshold = badge.triggerCondition.threshold;

      if (currentValue >= threshold) {
        // 授予徽章
        const userBadge = {
          id: db.data.userBadges.length > 0
            ? Math.max(...db.data.userBadges.map(ub => ub.id)) + 1
            : 1,
          userId,
          badgeId: badge.id,
          grantedAt: new Date().toISOString(),
          isNew: true
        };

        db.data.userBadges.push(userBadge);
        newBadges.push({
          ...badge,
          grantedAt: userBadge.grantedAt
        });
      }
    }

    if (newBadges.length > 0) {
      await db.write();
    }

    return newBadges;
  }

  /**
   * 检查身份徽章（登录时调用）
   * @param {number} userId - 用户ID
   * @returns {Array} 新获得的徽章列表
   */
  async checkIdentityBadges(userId) {
    const db = getDB();
    const user = db.data.users.find(u => u.id === userId);
    if (!user) return [];

    const newBadges = [];

    // 检查早期用户徽章
    const earlyBirdBadge = db.data.badges.find(b => b.code === 'early_bird');
    if (earlyBirdBadge && earlyBirdBadge.isActive) {
      const hasOwned = db.data.userBadges.some(
        ub => ub.userId === userId && ub.badgeId === earlyBirdBadge.id
      );

      if (!hasOwned) {
        const userCreatedAt = new Date(user.createdAt).getTime();
        const threshold = earlyBirdBadge.triggerCondition.threshold;

        if (userCreatedAt < threshold) {
          const userBadge = {
            id: db.data.userBadges.length > 0
              ? Math.max(...db.data.userBadges.map(ub => ub.id)) + 1
              : 1,
            userId,
            badgeId: earlyBirdBadge.id,
            grantedAt: new Date().toISOString(),
            isNew: true
          };
          db.data.userBadges.push(userBadge);
          newBadges.push({
            ...earlyBirdBadge,
            grantedAt: userBadge.grantedAt
          });
        }
      }
    }

    // 检查管理员徽章
    const adminBadge = db.data.badges.find(b => b.code === 'verified_admin');
    if (adminBadge && adminBadge.isActive && user.role === 'admin') {
      const hasOwned = db.data.userBadges.some(
        ub => ub.userId === userId && ub.badgeId === adminBadge.id
      );

      if (!hasOwned) {
        const userBadge = {
          id: db.data.userBadges.length > 0
            ? Math.max(...db.data.userBadges.map(ub => ub.id)) + 1
            : 1,
          userId,
          badgeId: adminBadge.id,
          grantedAt: new Date().toISOString(),
          isNew: true
        };
        db.data.userBadges.push(userBadge);
        newBadges.push({
          ...adminBadge,
          grantedAt: userBadge.grantedAt
        });
      }
    }

    if (newBadges.length > 0) {
      await db.write();
    }

    return newBadges;
  }

  /**
   * 手动授予徽章
   * @param {number} badgeId - 徽章ID
   * @param {number} userId - 用户ID
   * @param {number} grantedBy - 授予者ID
   * @returns {Object} 授予结果
   */
  async grantBadge(badgeId, userId, grantedBy) {
    const db = getDB();

    const badge = db.data.badges.find(b => b.id === badgeId);
    if (!badge) {
      throw new Error('徽章不存在');
    }

    const user = db.data.users.find(u => u.id === userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查是否已拥有
    const hasOwned = db.data.userBadges.some(
      ub => ub.userId === userId && ub.badgeId === badgeId
    );

    if (hasOwned) {
      return { success: true, message: '用户已拥有该徽章', alreadyOwned: true };
    }

    const userBadge = {
      id: db.data.userBadges.length > 0
        ? Math.max(...db.data.userBadges.map(ub => ub.id)) + 1
        : 1,
      userId,
      badgeId,
      grantedBy,
      grantedAt: new Date().toISOString(),
      isNew: true
    };

    db.data.userBadges.push(userBadge);
    await db.write();

    return { success: true, badge, userBadge };
  }

  /**
   * 撤销徽章
   * @param {number} badgeId - 徽章ID
   * @param {number} userId - 用户ID
   * @returns {Object} 撤销结果
   */
  async revokeBadge(badgeId, userId) {
    const db = getDB();

    const index = db.data.userBadges.findIndex(
      ub => ub.userId === userId && ub.badgeId === badgeId
    );

    if (index === -1) {
      throw new Error('用户未拥有该徽章');
    }

    db.data.userBadges.splice(index, 1);
    await db.write();

    return { success: true };
  }

  /**
   * 获取用户的所有徽章
   * @param {number} userId - 用户ID
   * @returns {Array} 用户徽章列表
   */
  getUserBadges(userId) {
    const db = getDB();

    const userBadges = db.data.userBadges.filter(ub => ub.userId === userId);

    return userBadges.map(ub => {
      const badge = db.data.badges.find(b => b.id === ub.badgeId);
      return {
        ...badge,
        grantedAt: ub.grantedAt,
        isNew: ub.isNew,
        grantedBy: ub.grantedBy
      };
    }).sort((a, b) => b.priority - a.priority);
  }

  /**
   * 获取用户的置顶徽章
   * @param {number} userId - 用户ID
   * @returns {Array} 置顶徽章列表（最多3个）
   */
  getUserPinnedBadges(userId) {
    const db = getDB();
    const user = db.data.users.find(u => u.id === userId);

    if (!user || !user.pinnedBadges || user.pinnedBadges.length === 0) {
      // 如果没有设置置顶，返回优先级最高的3个
      return this.getUserBadges(userId).slice(0, 3);
    }

    const pinnedBadges = [];
    for (const badgeId of user.pinnedBadges) {
      const userBadge = db.data.userBadges.find(
        ub => ub.userId === userId && ub.badgeId === badgeId
      );
      if (userBadge) {
        const badge = db.data.badges.find(b => b.id === badgeId);
        if (badge) {
          pinnedBadges.push({
            ...badge,
            grantedAt: userBadge.grantedAt,
            isNew: userBadge.isNew
          });
        }
      }
    }

    return pinnedBadges;
  }

  /**
   * 标记徽章为已读
   * @param {number} userId - 用户ID
   */
  async markBadgesAsRead(userId) {
    const db = getDB();

    const userBadges = db.data.userBadges.filter(ub => ub.userId === userId);
    let updated = false;

    for (const ub of userBadges) {
      if (ub.isNew) {
        ub.isNew = false;
        updated = true;
      }
    }

    if (updated) {
      await db.write();
    }
  }

  /**
   * 检查用户是否有未读徽章
   * @param {number} userId - 用户ID
   * @returns {boolean}
   */
  hasNewBadges(userId) {
    const db = getDB();
    return db.data.userBadges.some(
      ub => ub.userId === userId && ub.isNew
    );
  }
}

module.exports = new BadgeService();
```

**Step 2: 提交**

```bash
git add backend/services/badgeService.js
git commit -m "feat(badges): 添加徽章业务服务层"
```

---

## Task 3: 后端徽章控制器

**Files:**
- Create: `backend/controllers/badgeControllerLowdb.js`

**Step 1: 创建徽章控制器**

创建 `backend/controllers/badgeControllerLowdb.js`:

```javascript
const { getDB } = require('../config/databaseLowdb');
const badgeService = require('../services/badgeService');

// 获取所有启用的徽章定义
const getAllBadges = async (req, res) => {
  try {
    const db = getDB();
    const badges = db.data.badges
      .filter(b => b.isActive)
      .sort((a, b) => b.priority - a.priority);

    res.json({ success: true, data: badges });
  } catch (error) {
    console.error('Error getting badges:', error);
    res.status(500).json({ success: false, message: '获取徽章列表失败' });
  }
};

// 获取指定用户的徽章
const getUserBadges = async (req, res) => {
  try {
    const { userId } = req.params;
    const badges = badgeService.getUserBadges(parseInt(userId));
    const pinnedBadges = badgeService.getUserPinnedBadges(parseInt(userId));

    res.json({
      success: true,
      data: {
        badges,
        pinnedBadges
      }
    });
  } catch (error) {
    console.error('Error getting user badges:', error);
    res.status(500).json({ success: false, message: '获取用户徽章失败' });
  }
};

// 获取当前用户的徽章（含未读状态）
const getMyBadges = async (req, res) => {
  try {
    const badges = badgeService.getUserBadges(req.user.id);
    const hasNew = badgeService.hasNewBadges(req.user.id);

    res.json({
      success: true,
      data: {
        badges,
        hasNew
      }
    });
  } catch (error) {
    console.error('Error getting my badges:', error);
    res.status(500).json({ success: false, message: '获取徽章失败' });
  }
};

// 设置置顶徽章
const setPinnedBadges = async (req, res) => {
  try {
    const { badgeIds } = req.body;
    const db = getDB();

    // 验证数量
    if (!Array.isArray(badgeIds) || badgeIds.length > 3) {
      return res.status(400).json({
        success: false,
        message: '最多只能置顶 3 个徽章'
      });
    }

    // 验证用户是否拥有这些徽章
    const userBadges = badgeService.getUserBadges(req.user.id);
    const ownedBadgeIds = userBadges.map(b => b.id);

    for (const id of badgeIds) {
      if (!ownedBadgeIds.includes(id)) {
        return res.status(400).json({
          success: false,
          message: '只能置顶已拥有的徽章'
        });
      }
    }

    // 更新用户的置顶徽章
    const user = db.data.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    user.pinnedBadges = badgeIds;
    await db.write();

    res.json({ success: true, data: { pinnedBadges: badgeIds } });
  } catch (error) {
    console.error('Error setting pinned badges:', error);
    res.status(500).json({ success: false, message: '设置置顶徽章失败' });
  }
};

// 标记徽章为已读
const markBadgesAsRead = async (req, res) => {
  try {
    await badgeService.markBadgesAsRead(req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking badges as read:', error);
    res.status(500).json({ success: false, message: '标记已读失败' });
  }
};

// ========== 管理员接口 ==========

// 获取所有徽章（含禁用的）
const adminGetAllBadges = async (req, res) => {
  try {
    const db = getDB();
    const badges = db.data.badges.sort((a, b) => b.priority - a.priority);

    // 添加获得人数统计
    const badgesWithStats = badges.map(badge => ({
      ...badge,
      grantedCount: db.data.userBadges.filter(ub => ub.badgeId === badge.id).length
    }));

    res.json({ success: true, data: badgesWithStats });
  } catch (error) {
    console.error('Error getting all badges:', error);
    res.status(500).json({ success: false, message: '获取徽章列表失败' });
  }
};

// 创建新徽章
const createBadge = async (req, res) => {
  try {
    const { code, name, description, icon, color, category, type, triggerCondition, priority } = req.body;
    const db = getDB();

    // 验证必填字段
    if (!code || !name || !icon || !category || !type) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段'
      });
    }

    // 检查 code 是否重复
    if (db.data.badges.some(b => b.code === code)) {
      return res.status(400).json({
        success: false,
        message: '徽章代码已存在'
      });
    }

    const newBadge = {
      id: db.data.badges.length > 0
        ? Math.max(...db.data.badges.map(b => b.id)) + 1
        : 1,
      code,
      name,
      description: description || '',
      icon,
      color: color || '#6366F1',
      category,
      type,
      triggerCondition: type === 'auto' ? triggerCondition : undefined,
      priority: priority || 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    db.data.badges.push(newBadge);
    await db.write();

    res.status(201).json({ success: true, data: newBadge });
  } catch (error) {
    console.error('Error creating badge:', error);
    res.status(500).json({ success: false, message: '创建徽章失败' });
  }
};

// 编辑徽章
const updateBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const db = getDB();

    const badge = db.data.badges.find(b => b.id === parseInt(id));
    if (!badge) {
      return res.status(404).json({ success: false, message: '徽章不存在' });
    }

    // 如果修改 code，检查是否重复
    if (updates.code && updates.code !== badge.code) {
      if (db.data.badges.some(b => b.code === updates.code)) {
        return res.status(400).json({
          success: false,
          message: '徽章代码已存在'
        });
      }
    }

    // 更新字段
    const allowedFields = ['name', 'description', 'icon', 'color', 'category', 'type', 'triggerCondition', 'priority', 'isActive'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        badge[field] = updates[field];
      }
    }

    await db.write();

    res.json({ success: true, data: badge });
  } catch (error) {
    console.error('Error updating badge:', error);
    res.status(500).json({ success: false, message: '更新徽章失败' });
  }
};

// 删除徽章（软删除）
const deleteBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const badge = db.data.badges.find(b => b.id === parseInt(id));
    if (!badge) {
      return res.status(404).json({ success: false, message: '徽章不存在' });
    }

    // 软删除
    badge.isActive = false;
    await db.write();

    res.json({ success: true, message: '徽章已删除' });
  } catch (error) {
    console.error('Error deleting badge:', error);
    res.status(500).json({ success: false, message: '删除徽章失败' });
  }
};

// 授予徽章给用户
const grantBadgeToUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const result = await badgeService.grantBadge(
      parseInt(id),
      parseInt(userId),
      req.user.id
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error granting badge:', error);
    res.status(error.message.includes('不存在') ? 404 : 500).json({
      success: false,
      message: error.message || '授予徽章失败'
    });
  }
};

// 撤销用户徽章
const revokeBadgeFromUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    await badgeService.revokeBadge(parseInt(id), parseInt(userId));

    res.json({ success: true, message: '已撤销徽章' });
  } catch (error) {
    console.error('Error revoking badge:', error);
    res.status(error.message.includes('未拥有') ? 404 : 500).json({
      success: false,
      message: error.message || '撤销徽章失败'
    });
  }
};

// 徽章统计
const getBadgeStats = async (req, res) => {
  try {
    const db = getDB();

    const stats = db.data.badges.map(badge => ({
      id: badge.id,
      code: badge.code,
      name: badge.name,
      category: badge.category,
      grantedCount: db.data.userBadges.filter(ub => ub.badgeId === badge.id).length,
      isActive: badge.isActive
    }));

    const summary = {
      totalBadges: db.data.badges.length,
      activeBadges: db.data.badges.filter(b => b.isActive).length,
      totalGrants: db.data.userBadges.length,
      byCategory: {
        activity: stats.filter(s => s.category === 'activity').reduce((sum, s) => sum + s.grantedCount, 0),
        identity: stats.filter(s => s.category === 'identity').reduce((sum, s) => sum + s.grantedCount, 0),
        honor: stats.filter(s => s.category === 'honor').reduce((sum, s) => sum + s.grantedCount, 0)
      }
    };

    res.json({ success: true, data: { stats, summary } });
  } catch (error) {
    console.error('Error getting badge stats:', error);
    res.status(500).json({ success: false, message: '获取统计失败' });
  }
};

// 批量授予徽章
const batchGrantBadge = async (req, res) => {
  try {
    const { badgeId, userIds } = req.body;
    const results = [];

    for (const userId of userIds) {
      try {
        const result = await badgeService.grantBadge(
          parseInt(badgeId),
          parseInt(userId),
          req.user.id
        );
        results.push({ userId, success: true, ...result });
      } catch (error) {
        results.push({ userId, success: false, message: error.message });
      }
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error batch granting badges:', error);
    res.status(500).json({ success: false, message: '批量授予失败' });
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
```

**Step 2: 提交**

```bash
git add backend/controllers/badgeControllerLowdb.js
git commit -m "feat(badges): 添加徽章控制器"
```

---

## Task 4: 后端徽章路由

**Files:**
- Create: `backend/routes/badgeRoutes.js`
- Modify: `backend/server.js:14,99`

**Step 1: 创建徽章路由**

创建 `backend/routes/badgeRoutes.js`:

```javascript
const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/badgeControllerLowdb');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// 公开接口
router.get('/', getAllBadges);
router.get('/user/:userId', getUserBadges);

// 用户接口（需登录）
router.get('/my', protect, getMyBadges);
router.put('/my/pinned', protect, setPinnedBadges);
router.post('/my/read', protect, markBadgesAsRead);

// 管理员接口
router.get('/admin/all', protect, adminOnly, adminGetAllBadges);
router.post('/admin', protect, adminOnly, createBadge);
router.put('/admin/:id', protect, adminOnly, updateBadge);
router.delete('/admin/:id', protect, adminOnly, deleteBadge);
router.post('/admin/:id/grant', protect, adminOnly, grantBadgeToUser);
router.post('/admin/:id/revoke', protect, adminOnly, revokeBadgeFromUser);
router.get('/admin/stats', protect, adminOnly, getBadgeStats);
router.post('/admin/batch-grant', protect, adminOnly, batchGrantBadge);

module.exports = router;
```

**Step 2: 注册路由到 server.js**

在 `backend/server.js` 中添加导入:

```javascript
const badgeRoutes = require('./routes/badgeRoutes');
```

添加路由注册:

```javascript
app.use('/api/badges', badgeRoutes);
```

**Step 3: 运行后端验证路由**

Run: `cd backend && npm start`

然后测试:
```bash
curl http://localhost:3001/api/badges
```

Expected: 返回徽章列表 JSON

**Step 4: 提交**

```bash
git add backend/routes/badgeRoutes.js backend/server.js
git commit -m "feat(badges): 添加徽章路由"
```

---

## Task 5: 集成自动徽章触发

**Files:**
- Modify: `backend/controllers/commentControllerLowdb.js:103-119`
- Modify: `backend/controllers/favoriteControllerLowdb.js:34-37`
- Modify: `backend/controllers/followControllerLowdb.js:49-54`
- Modify: `backend/controllers/authControllerLowdb.js:113-126`

**Step 1: 修改评论控制器**

在 `backend/controllers/commentControllerLowdb.js` 中导入 badgeService:

```javascript
const badgeService = require('../services/badgeService');
```

在 `createComment` 函数中，`res.status(201).json(newComment)` 之前添加:

```javascript
// 检查评论徽章
let newBadges = [];
try {
  newBadges = await badgeService.checkAndGrantBadges(req.user.id, 'commentCount');
} catch (err) {
  console.error('Badge check failed:', err);
}

res.status(201).json({
  ...newComment,
  newBadges: newBadges.length > 0 ? newBadges : undefined
});
```

**Step 2: 修改收藏控制器**

在 `backend/controllers/favoriteControllerLowdb.js` 中导入 badgeService:

```javascript
const badgeService = require('../services/badgeService');
```

在 `addFavorite` 函数中，`res.status(201).json(newFavorite)` 之前添加:

```javascript
// 检查收藏徽章
let newBadges = [];
try {
  newBadges = await badgeService.checkAndGrantBadges(req.user.id, 'favoriteCount');
} catch (err) {
  console.error('Badge check failed:', err);
}

res.status(201).json({
  ...newFavorite,
  newBadges: newBadges.length > 0 ? newBadges : undefined
});
```

**Step 3: 修改关注控制器**

在 `backend/controllers/followControllerLowdb.js` 中导入 badgeService:

```javascript
const badgeService = require('../services/badgeService');
```

在 `followUser` 函数中，响应之前添加:

```javascript
// 检查被关注者的粉丝徽章
let newBadges = [];
try {
  newBadges = await badgeService.checkAndGrantBadges(parseInt(followingId), 'followerCount');
} catch (err) {
  console.error('Badge check failed:', err);
}

res.status(201).json({
  success: true,
  data: {
    follow: newFollow,
    targetUserNewBadges: newBadges.length > 0 ? newBadges : undefined
  }
});
```

**Step 4: 修改认证控制器**

在 `backend/controllers/authControllerLowdb.js` 中导入 badgeService:

```javascript
const badgeService = require('../services/badgeService');
```

在 `loginUser` 函数的登录成功响应之前添加:

```javascript
// 检查身份徽章
let newBadges = [];
try {
  newBadges = await badgeService.checkIdentityBadges(user.id);
} catch (err) {
  console.error('Badge check failed:', err);
}

const hasNewBadges = badgeService.hasNewBadges(user.id);

res.status(200).json({
  success: true,
  data: {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user'
    },
    token,
    newBadges: newBadges.length > 0 ? newBadges : undefined,
    hasNewBadges
  }
});
```

**Step 5: 提交**

```bash
git add backend/controllers/commentControllerLowdb.js backend/controllers/favoriteControllerLowdb.js backend/controllers/followControllerLowdb.js backend/controllers/authControllerLowdb.js
git commit -m "feat(badges): 集成自动徽章触发逻辑"
```

---

## Task 6: 后端集成测试

**Files:**
- Create: `backend/__tests__/integration/badges.test.js`

**Step 1: 创建徽章集成测试**

创建 `backend/__tests__/integration/badges.test.js`:

```javascript
const request = require('supertest');
const express = require('express');
const { TestDatabase } = require('../helpers/testDb');
const badgeRoutes = require('../../routes/badgeRoutes');
const authRoutes = require('../../routes/authRoutes');
const commentRoutes = require('../../routes/commentRoutes');
const { errorHandler } = require('../../middleware/error');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/badges', badgeRoutes);
  app.use('/api/comments', commentRoutes);
  app.use(errorHandler);
  return app;
};

describe('Badges API Integration Tests', () => {
  let testDb;
  let app;
  let userToken;
  let adminToken;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.setup();
    app = createTestApp();

    // 登录普通用户
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'test123' });
    userToken = userLogin.body.data.token;

    // 登录管理员
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' });
    adminToken = adminLogin.body.data.token;
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  beforeEach(async () => {
    await testDb.reset();
  });

  describe('GET /api/badges', () => {
    it('should return all active badges', async () => {
      const response = await request(app)
        .get('/api/badges')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('icon');
    });
  });

  describe('GET /api/badges/user/:userId', () => {
    it('should return user badges', async () => {
      const response = await request(app)
        .get('/api/badges/user/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('badges');
      expect(response.body.data).toHaveProperty('pinnedBadges');
    });
  });

  describe('GET /api/badges/my', () => {
    it('should return current user badges with auth', async () => {
      const response = await request(app)
        .get('/api/badges/my')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('badges');
      expect(response.body.data).toHaveProperty('hasNew');
    });

    it('should reject without auth', async () => {
      await request(app)
        .get('/api/badges/my')
        .expect(401);
    });
  });

  describe('PUT /api/badges/my/pinned', () => {
    it('should set pinned badges', async () => {
      // 先授予用户一些徽章
      const db = testDb.getDB();
      db.data.userBadges.push(
        { id: 1, userId: 1, badgeId: 1, grantedAt: new Date().toISOString(), isNew: false },
        { id: 2, userId: 1, badgeId: 2, grantedAt: new Date().toISOString(), isNew: false }
      );
      await db.write();

      const response = await request(app)
        .put('/api/badges/my/pinned')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ badgeIds: [1, 2] })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject more than 3 badges', async () => {
      const response = await request(app)
        .put('/api/badges/my/pinned')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ badgeIds: [1, 2, 3, 4] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Admin Badge Management', () => {
    it('should create a new badge', async () => {
      const newBadge = {
        code: 'test_badge',
        name: '测试徽章',
        description: '测试用徽章',
        icon: 'Star',
        color: '#FFD700',
        category: 'honor',
        type: 'manual',
        priority: 50
      };

      const response = await request(app)
        .post('/api/badges/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newBadge)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('测试徽章');
    });

    it('should reject duplicate code', async () => {
      const response = await request(app)
        .post('/api/badges/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'comment_5', // 已存在
          name: '重复徽章',
          icon: 'Star',
          category: 'honor',
          type: 'manual'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should grant badge to user', async () => {
      const response = await request(app)
        .post('/api/badges/admin/15/grant')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should revoke badge from user', async () => {
      // 先授予
      await request(app)
        .post('/api/badges/admin/15/grant')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: 1 });

      // 再撤销
      const response = await request(app)
        .post('/api/badges/admin/15/revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject non-admin access', async () => {
      await request(app)
        .post('/api/badges/admin')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'test',
          name: 'Test',
          icon: 'Star',
          category: 'honor',
          type: 'manual'
        })
        .expect(403);
    });
  });

  describe('Badge Stats', () => {
    it('should return badge statistics', async () => {
      const response = await request(app)
        .get('/api/badges/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data).toHaveProperty('summary');
    });
  });
});
```

**Step 2: 运行测试**

Run: `cd backend && npm test -- --testPathPattern=badges`
Expected: All tests pass

**Step 3: 提交**

```bash
git add backend/__tests__/integration/badges.test.js
git commit -m "test(badges): 添加徽章 API 集成测试"
```

---

## Task 7: 前端类型定义

**Files:**
- Modify: `src/types/index.ts`

**Step 1: 添加徽章相关类型**

在 `src/types/index.ts` 末尾添加:

```typescript
export interface Badge {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'activity' | 'identity' | 'honor';
  type: 'auto' | 'manual';
  triggerCondition?: {
    metric: string;
    threshold: number;
  };
  priority: number;
  isActive: boolean;
  createdAt: string;
  // 用户徽章附加字段
  grantedAt?: string;
  isNew?: boolean;
  grantedBy?: number;
  grantedCount?: number;
}

export interface UserBadgesResponse {
  badges: Badge[];
  pinnedBadges: Badge[];
}

export interface MyBadgesResponse {
  badges: Badge[];
  hasNew: boolean;
}

export interface BadgeStats {
  stats: Array<{
    id: number;
    code: string;
    name: string;
    category: string;
    grantedCount: number;
    isActive: boolean;
  }>;
  summary: {
    totalBadges: number;
    activeBadges: number;
    totalGrants: number;
    byCategory: {
      activity: number;
      identity: number;
      honor: number;
    };
  };
}
```

在 `UserProfile` 接口中添加:

```typescript
pinnedBadges?: number[];
```

**Step 2: 提交**

```bash
git add src/types/index.ts
git commit -m "feat(badges): 添加前端徽章类型定义"
```

---

## Task 8: 前端徽章 API 服务

**Files:**
- Create: `src/services/badgeService.ts`

**Step 1: 创建徽章 API 服务**

创建 `src/services/badgeService.ts`:

```typescript
import api from './api';
import type { Badge, UserBadgesResponse, MyBadgesResponse, BadgeStats } from '../types';

// 获取所有徽章定义
export const getAllBadges = async (): Promise<Badge[]> => {
  const response = await api.get('/badges');
  return response.data.data;
};

// 获取指定用户的徽章
export const getUserBadges = async (userId: number): Promise<UserBadgesResponse> => {
  const response = await api.get(`/badges/user/${userId}`);
  return response.data.data;
};

// 获取当前用户的徽章
export const getMyBadges = async (): Promise<MyBadgesResponse> => {
  const response = await api.get('/badges/my');
  return response.data.data;
};

// 设置置顶徽章
export const setPinnedBadges = async (badgeIds: number[]): Promise<void> => {
  await api.put('/badges/my/pinned', { badgeIds });
};

// 标记徽章为已读
export const markBadgesAsRead = async (): Promise<void> => {
  await api.post('/badges/my/read');
};

// ========== 管理员接口 ==========

// 获取所有徽章（含禁用的）
export const adminGetAllBadges = async (): Promise<Badge[]> => {
  const response = await api.get('/badges/admin/all');
  return response.data.data;
};

// 创建徽章
export const createBadge = async (badge: Partial<Badge>): Promise<Badge> => {
  const response = await api.post('/badges/admin', badge);
  return response.data.data;
};

// 更新徽章
export const updateBadge = async (id: number, updates: Partial<Badge>): Promise<Badge> => {
  const response = await api.put(`/badges/admin/${id}`, updates);
  return response.data.data;
};

// 删除徽章
export const deleteBadge = async (id: number): Promise<void> => {
  await api.delete(`/badges/admin/${id}`);
};

// 授予徽章
export const grantBadge = async (badgeId: number, userId: number): Promise<void> => {
  await api.post(`/badges/admin/${badgeId}/grant`, { userId });
};

// 撤销徽章
export const revokeBadge = async (badgeId: number, userId: number): Promise<void> => {
  await api.post(`/badges/admin/${badgeId}/revoke`, { userId });
};

// 获取徽章统计
export const getBadgeStats = async (): Promise<BadgeStats> => {
  const response = await api.get('/badges/admin/stats');
  return response.data.data;
};

// 批量授予徽章
export const batchGrantBadge = async (badgeId: number, userIds: number[]): Promise<void> => {
  await api.post('/badges/admin/batch-grant', { badgeId, userIds });
};
```

**Step 2: 提交**

```bash
git add src/services/badgeService.ts
git commit -m "feat(badges): 添加前端徽章 API 服务"
```

---

## Task 9: 前端徽章 Context

**Files:**
- Create: `src/contexts/BadgeContext.tsx`

**Step 1: 创建徽章 Context**

创建 `src/contexts/BadgeContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getMyBadges, markBadgesAsRead } from '../services/badgeService';
import { useAuth } from '../hooks/useAuth';
import type { Badge } from '../types';

interface BadgeContextType {
  hasNewBadges: boolean;
  newBadgesList: Badge[];
  setNewBadges: (badges: Badge[]) => void;
  clearNewBadges: () => Promise<void>;
  refreshBadges: () => Promise<void>;
}

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

export const BadgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [hasNewBadges, setHasNewBadges] = useState(false);
  const [newBadgesList, setNewBadgesList] = useState<Badge[]>([]);

  const refreshBadges = useCallback(async () => {
    if (!user) return;

    try {
      const data = await getMyBadges();
      setHasNewBadges(data.hasNew);
    } catch (error) {
      console.error('Failed to refresh badges:', error);
    }
  }, [user]);

  const setNewBadges = useCallback((badges: Badge[]) => {
    if (badges.length > 0) {
      setNewBadgesList(badges);
      setHasNewBadges(true);
    }
  }, []);

  const clearNewBadges = useCallback(async () => {
    try {
      await markBadgesAsRead();
      setHasNewBadges(false);
      setNewBadgesList([]);
    } catch (error) {
      console.error('Failed to mark badges as read:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshBadges();
    } else {
      setHasNewBadges(false);
      setNewBadgesList([]);
    }
  }, [user, refreshBadges]);

  return (
    <BadgeContext.Provider value={{
      hasNewBadges,
      newBadgesList,
      setNewBadges,
      clearNewBadges,
      refreshBadges
    }}>
      {children}
    </BadgeContext.Provider>
  );
};

export const useBadgeContext = () => {
  const context = useContext(BadgeContext);
  if (!context) {
    throw new Error('useBadgeContext must be used within a BadgeProvider');
  }
  return context;
};
```

**Step 2: 在 App.tsx 中添加 Provider**

在 `src/App.tsx` 中导入并包裹:

```typescript
import { BadgeProvider } from './contexts/BadgeContext';

// 在 render 中添加
<BadgeProvider>
  {/* existing content */}
</BadgeProvider>
```

**Step 3: 提交**

```bash
git add src/contexts/BadgeContext.tsx src/App.tsx
git commit -m "feat(badges): 添加徽章 Context"
```

---

## Task 10: 前端徽章基础组件

**Files:**
- Create: `src/features/badges/components/Badge.tsx`
- Create: `src/features/badges/components/Badge.css`
- Create: `src/features/badges/components/BadgeList.tsx`
- Create: `src/features/badges/components/BadgeList.css`
- Create: `src/features/badges/index.ts`

**Step 1: 使用 ui-ux-pro-max skill 设计徽章组件样式**

调用 @ui-ux-pro-max skill 设计 Badge 和 BadgeList 组件的精美样式。

**Step 2: 创建 Badge 组件**

创建 `src/features/badges/components/Badge.tsx`:

```typescript
import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { Badge as BadgeType } from '../../../types';
import './Badge.css';

interface BadgeProps {
  badge: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showTooltip?: boolean;
  isNew?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  badge,
  size = 'md',
  showName = true,
  showTooltip = true,
  isNew = false
}) => {
  // 动态获取图标
  const IconComponent = (LucideIcons as any)[badge.icon] || LucideIcons.Award;

  return (
    <div
      className={`badge badge--${size} ${isNew ? 'badge--new' : ''}`}
      style={{ '--badge-color': badge.color } as React.CSSProperties}
      title={showTooltip ? badge.description : undefined}
    >
      <span className="badge__icon">
        <IconComponent size={size === 'sm' ? 14 : size === 'md' ? 18 : 24} />
      </span>
      {showName && <span className="badge__name">{badge.name}</span>}
      {isNew && <span className="badge__new-dot" />}
    </div>
  );
};

export default Badge;
```

**Step 3: 创建 Badge.css**

创建 `src/features/badges/components/Badge.css`:

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 9999px;
  background: linear-gradient(135deg, var(--badge-color) 0%, color-mix(in srgb, var(--badge-color) 80%, black) 100%);
  color: white;
  font-weight: 500;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}

.badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--badge-color) 40%, transparent);
}

.badge--sm {
  padding: 2px 6px;
  font-size: 11px;
}

.badge--md {
  padding: 4px 10px;
  font-size: 13px;
}

.badge--lg {
  padding: 6px 14px;
  font-size: 15px;
}

.badge__icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge__name {
  white-space: nowrap;
}

.badge__new-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

.badge--new {
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    box-shadow: 0 0 5px var(--badge-color);
  }
  to {
    box-shadow: 0 0 15px var(--badge-color);
  }
}
```

**Step 4: 创建 BadgeList 组件**

创建 `src/features/badges/components/BadgeList.tsx`:

```typescript
import React from 'react';
import Badge from './Badge';
import type { Badge as BadgeType } from '../../../types';
import './BadgeList.css';

interface BadgeListProps {
  badges: BadgeType[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const BadgeList: React.FC<BadgeListProps> = ({
  badges,
  maxDisplay = 3,
  size = 'sm',
  showTooltip = true
}) => {
  if (!badges || badges.length === 0) {
    return null;
  }

  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <div className="badge-list">
      {displayBadges.map(badge => (
        <Badge
          key={badge.id}
          badge={badge}
          size={size}
          showName={false}
          showTooltip={showTooltip}
          isNew={badge.isNew}
        />
      ))}
      {remainingCount > 0 && (
        <span className="badge-list__more">+{remainingCount}</span>
      )}
    </div>
  );
};

export default BadgeList;
```

**Step 5: 创建 BadgeList.css**

创建 `src/features/badges/components/BadgeList.css`:

```css
.badge-list {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.badge-list__more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border-radius: 9999px;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 500;
}
```

**Step 6: 创建模块导出**

创建 `src/features/badges/index.ts`:

```typescript
export { default as Badge } from './components/Badge';
export { default as BadgeList } from './components/BadgeList';
```

**Step 7: 提交**

```bash
git add src/features/badges/
git commit -m "feat(badges): 添加 Badge 和 BadgeList 基础组件"
```

---

## Task 11: 徽章墙组件

**Files:**
- Create: `src/features/badges/components/BadgeWall.tsx`
- Create: `src/features/badges/components/BadgeWall.css`

**Step 1: 创建 BadgeWall 组件**

创建 `src/features/badges/components/BadgeWall.tsx`:

```typescript
import React from 'react';
import Badge from './Badge';
import type { Badge as BadgeType } from '../../../types';
import './BadgeWall.css';

interface BadgeWallProps {
  badges: BadgeType[];
  title?: string;
}

const categoryLabels: Record<string, string> = {
  activity: '活跃度徽章',
  identity: '身份徽章',
  honor: '荣誉徽章'
};

const BadgeWall: React.FC<BadgeWallProps> = ({ badges, title = '我的徽章' }) => {
  if (!badges || badges.length === 0) {
    return (
      <div className="badge-wall badge-wall--empty">
        <p>暂无徽章，继续加油！</p>
      </div>
    );
  }

  // 按分类分组
  const groupedBadges = badges.reduce((acc, badge) => {
    const category = badge.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(badge);
    return acc;
  }, {} as Record<string, BadgeType[]>);

  return (
    <div className="badge-wall">
      <h3 className="badge-wall__title">{title}</h3>
      {Object.entries(groupedBadges).map(([category, categoryBadges]) => (
        <div key={category} className="badge-wall__category">
          <h4 className="badge-wall__category-title">
            {categoryLabels[category] || category}
          </h4>
          <div className="badge-wall__badges">
            {categoryBadges.map(badge => (
              <Badge
                key={badge.id}
                badge={badge}
                size="md"
                showName={true}
                showTooltip={true}
                isNew={badge.isNew}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BadgeWall;
```

**Step 2: 创建 BadgeWall.css**

创建 `src/features/badges/components/BadgeWall.css`:

```css
.badge-wall {
  background: var(--color-bg-primary);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--color-border);
}

.badge-wall--empty {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 40px 20px;
}

.badge-wall__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 20px 0;
}

.badge-wall__category {
  margin-bottom: 20px;
}

.badge-wall__category:last-child {
  margin-bottom: 0;
}

.badge-wall__category-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.badge-wall__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
```

**Step 3: 更新模块导出**

在 `src/features/badges/index.ts` 添加:

```typescript
export { default as BadgeWall } from './components/BadgeWall';
```

**Step 4: 提交**

```bash
git add src/features/badges/components/BadgeWall.tsx src/features/badges/components/BadgeWall.css src/features/badges/index.ts
git commit -m "feat(badges): 添加 BadgeWall 徽章墙组件"
```

---

## Task 12: 新徽章 Toast 组件

**Files:**
- Create: `src/features/badges/components/NewBadgeToast.tsx`
- Create: `src/features/badges/components/NewBadgeToast.css`

**Step 1: 创建 NewBadgeToast 组件**

创建 `src/features/badges/components/NewBadgeToast.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { X } from 'lucide-react';
import { useBadgeContext } from '../../../contexts/BadgeContext';
import type { Badge } from '../../../types';
import './NewBadgeToast.css';

const NewBadgeToast: React.FC = () => {
  const navigate = useNavigate();
  const { newBadgesList, setNewBadges } = useBadgeContext();
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (newBadgesList.length > 0 && !currentBadge) {
      setCurrentBadge(newBadgesList[0]);
      setIsVisible(true);
    }
  }, [newBadgesList, currentBadge]);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      const remaining = newBadgesList.slice(1);
      setNewBadges(remaining);
      setCurrentBadge(null);
    }, 300);
  };

  const handleClick = () => {
    handleClose();
    navigate('/profile/edit');
  };

  if (!currentBadge || !isVisible) return null;

  const IconComponent = (LucideIcons as any)[currentBadge.icon] || LucideIcons.Award;

  return (
    <div
      className={`new-badge-toast ${isVisible ? 'new-badge-toast--visible' : ''}`}
      style={{ '--badge-color': currentBadge.color } as React.CSSProperties}
    >
      <button className="new-badge-toast__close" onClick={handleClose}>
        <X size={16} />
      </button>
      <div className="new-badge-toast__content" onClick={handleClick}>
        <div className="new-badge-toast__icon">
          <IconComponent size={32} />
        </div>
        <div className="new-badge-toast__info">
          <div className="new-badge-toast__title">恭喜获得新徽章！</div>
          <div className="new-badge-toast__name">{currentBadge.name}</div>
          <div className="new-badge-toast__desc">{currentBadge.description}</div>
        </div>
      </div>
    </div>
  );
};

export default NewBadgeToast;
```

**Step 2: 创建 NewBadgeToast.css**

创建 `src/features/badges/components/NewBadgeToast.css`:

```css
.new-badge-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  min-width: 300px;
  max-width: 400px;
  background: var(--color-bg-primary);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 2px solid var(--badge-color);
  z-index: 9999;
  transform: translateX(120%);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.new-badge-toast--visible {
  transform: translateX(0);
  opacity: 1;
}

.new-badge-toast__close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.new-badge-toast__close:hover {
  background: var(--color-bg-secondary);
}

.new-badge-toast__content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  cursor: pointer;
}

.new-badge-toast__icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--badge-color), color-mix(in srgb, var(--badge-color) 70%, black));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: badge-bounce 0.6s ease;
}

@keyframes badge-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.new-badge-toast__info {
  flex: 1;
  min-width: 0;
}

.new-badge-toast__title {
  font-size: 12px;
  color: var(--badge-color);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.new-badge-toast__name {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.new-badge-toast__desc {
  font-size: 13px;
  color: var(--color-text-secondary);
}
```

**Step 3: 更新模块导出**

在 `src/features/badges/index.ts` 添加:

```typescript
export { default as NewBadgeToast } from './components/NewBadgeToast';
```

**Step 4: 在 App.tsx 中添加 Toast 组件**

在 App.tsx 的 BadgeProvider 内添加:

```typescript
import { NewBadgeToast } from './features/badges';

// 在适当位置添加
<NewBadgeToast />
```

**Step 5: 提交**

```bash
git add src/features/badges/components/NewBadgeToast.tsx src/features/badges/components/NewBadgeToast.css src/features/badges/index.ts src/App.tsx
git commit -m "feat(badges): 添加新徽章 Toast 提示组件"
```

---

## Task 13: 集成到个人主页

**Files:**
- Modify: `src/features/profile/pages/ProfilePage.tsx`
- Modify: `src/features/profile/pages/ProfilePage.css`

**Step 1: 在 ProfilePage 中添加徽章墙**

在 `src/features/profile/pages/ProfilePage.tsx` 中导入:

```typescript
import { BadgeWall, BadgeList } from '../../badges';
import { getUserBadges } from '../../../services/badgeService';
import type { Badge } from '../../../types';
```

添加状态和加载逻辑:

```typescript
const [badges, setBadges] = useState<Badge[]>([]);
const [pinnedBadges, setPinnedBadges] = useState<Badge[]>([]);

useEffect(() => {
  const loadBadges = async () => {
    if (userId) {
      try {
        const data = await getUserBadges(parseInt(userId));
        setBadges(data.badges);
        setPinnedBadges(data.pinnedBadges);
      } catch (error) {
        console.error('Error loading badges:', error);
      }
    }
  };
  loadBadges();
}, [userId]);
```

在用户名旁添加置顶徽章:

```typescript
<h1>
  {profile.name || profile.email}
  {pinnedBadges.length > 0 && (
    <BadgeList badges={pinnedBadges} maxDisplay={3} size="sm" />
  )}
</h1>
```

在 profile-stats 后添加徽章墙:

```typescript
{badges.length > 0 && (
  <BadgeWall badges={badges} title="获得的徽章" />
)}
```

**Step 2: 更新 ProfilePage.css**

添加相关样式调整。

**Step 3: 提交**

```bash
git add src/features/profile/pages/ProfilePage.tsx src/features/profile/pages/ProfilePage.css
git commit -m "feat(badges): 在个人主页显示徽章墙"
```

---

## Task 14: 置顶徽章选择器

**Files:**
- Create: `src/features/badges/components/BadgePicker.tsx`
- Create: `src/features/badges/components/BadgePicker.css`
- Modify: `src/features/profile/pages/ProfileEditPage.tsx`

**Step 1: 创建 BadgePicker 组件**

创建 `src/features/badges/components/BadgePicker.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import Badge from './Badge';
import { getMyBadges, setPinnedBadges } from '../../../services/badgeService';
import type { Badge as BadgeType } from '../../../types';
import './BadgePicker.css';

interface BadgePickerProps {
  onSave?: () => void;
}

const BadgePicker: React.FC<BadgePickerProps> = ({ onSave }) => {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const data = await getMyBadges();
      setBadges(data.badges);
      // 获取当前用户的置顶徽章 ID（需要从 userService 获取）
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBadge = (badgeId: number) => {
    if (selected.includes(badgeId)) {
      setSelected(selected.filter(id => id !== badgeId));
    } else if (selected.length < 3) {
      setSelected([...selected, badgeId]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setPinnedBadges(selected);
      onSave?.();
    } catch (error) {
      console.error('Error saving pinned badges:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="badge-picker__loading">加载中...</div>;
  }

  if (badges.length === 0) {
    return (
      <div className="badge-picker badge-picker--empty">
        <p>暂无可展示的徽章</p>
      </div>
    );
  }

  return (
    <div className="badge-picker">
      <div className="badge-picker__header">
        <h4>选择置顶徽章</h4>
        <span className="badge-picker__count">{selected.length}/3</span>
      </div>
      <p className="badge-picker__hint">选择最多 3 个徽章在评论区和用户列表中展示</p>
      <div className="badge-picker__grid">
        {badges.map(badge => (
          <div
            key={badge.id}
            className={`badge-picker__item ${selected.includes(badge.id) ? 'badge-picker__item--selected' : ''}`}
            onClick={() => toggleBadge(badge.id)}
          >
            <Badge badge={badge} size="md" showName={true} />
            {selected.includes(badge.id) && (
              <span className="badge-picker__check">
                <Check size={14} />
              </span>
            )}
          </div>
        ))}
      </div>
      <button
        className="badge-picker__save"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? '保存中...' : '保存设置'}
      </button>
    </div>
  );
};

export default BadgePicker;
```

**Step 2: 创建 BadgePicker.css**

创建 `src/features/badges/components/BadgePicker.css`:

```css
.badge-picker {
  background: var(--color-bg-primary);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--color-border);
}

.badge-picker--empty {
  text-align: center;
  color: var(--color-text-secondary);
}

.badge-picker__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.badge-picker__header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.badge-picker__count {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.badge-picker__hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0 0 16px 0;
}

.badge-picker__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.badge-picker__item {
  position: relative;
  padding: 12px;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.badge-picker__item:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-secondary);
}

.badge-picker__item--selected {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.badge-picker__check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-picker__save {
  width: 100%;
  padding: 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.badge-picker__save:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.badge-picker__save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

**Step 3: 集成到 ProfileEditPage**

在 `src/features/profile/pages/ProfileEditPage.tsx` 中添加 BadgePicker 组件。

**Step 4: 更新模块导出并提交**

```bash
git add src/features/badges/components/BadgePicker.tsx src/features/badges/components/BadgePicker.css src/features/badges/index.ts src/features/profile/pages/ProfileEditPage.tsx
git commit -m "feat(badges): 添加置顶徽章选择器"
```

---

## Task 15: 管理员徽章管理页面

**Files:**
- Create: `src/features/admin/pages/BadgeManagement.tsx`
- Create: `src/features/admin/pages/BadgeManagement.css`
- Modify: `src/App.tsx` (添加路由)
- Modify: `src/components/layout/SideNav.tsx` (添加菜单项)

此任务涉及完整的管理后台 CRUD 页面，包括：
- 徽章列表展示
- 新增/编辑徽章表单
- 删除确认
- 授予/撤销徽章给用户
- 徽章统计图表

详细实现参考现有的 AdminUserList 组件模式。

**Step 1: 创建管理页面组件**

（详细代码省略，遵循现有 admin 组件模式）

**Step 2: 添加路由和菜单**

**Step 3: 提交**

```bash
git add src/features/admin/pages/BadgeManagement.tsx src/features/admin/pages/BadgeManagement.css src/App.tsx src/components/layout/SideNav.tsx
git commit -m "feat(badges): 添加管理员徽章管理页面"
```

---

## Task 16: 评论区显示用户徽章

**Files:**
- Modify: `src/features/comments/components/CommentItem.tsx`
- Modify: `src/features/comments/components/CommentItem.css`

**Step 1: 在 CommentItem 中显示用户徽章**

在用户名旁添加 BadgeList 组件，显示该用户的置顶徽章。

需要修改后端 API，在评论数据中包含用户的置顶徽章信息，或者前端单独请求。

**Step 2: 提交**

```bash
git add src/features/comments/components/CommentItem.tsx src/features/comments/components/CommentItem.css
git commit -m "feat(badges): 在评论区显示用户徽章"
```

---

## Task 17: 红点提示集成

**Files:**
- Modify: `src/components/common/UserDropdown.tsx`
- Modify: `src/components/common/UserDropdown.css`

**Step 1: 在 UserDropdown 中显示红点**

使用 useBadgeContext 获取 hasNewBadges 状态，在头像旁显示红点。

**Step 2: 提交**

```bash
git add src/components/common/UserDropdown.tsx src/components/common/UserDropdown.css
git commit -m "feat(badges): 在用户菜单添加新徽章红点提示"
```

---

## Task 18: 前端组件测试

**Files:**
- Create: `src/__tests__/components/badges/Badge.test.tsx`
- Create: `src/__tests__/components/badges/BadgeList.test.tsx`
- Create: `src/__tests__/components/badges/BadgeWall.test.tsx`

**Step 1: 创建组件测试**

为 Badge、BadgeList、BadgeWall 等组件创建单元测试。

**Step 2: 运行测试**

Run: `npm test -- --testPathPattern=badges`
Expected: All tests pass

**Step 3: 提交**

```bash
git add src/__tests__/components/badges/
git commit -m "test(badges): 添加前端徽章组件测试"
```

---

## Task 19: E2E 测试

**Files:**
- Create: `e2e/tests/badges.spec.ts`

**Step 1: 创建 E2E 测试**

测试场景：
- 游客查看用户徽章墙
- 用户发表评论后获得徽章并看到提示
- 用户设置置顶徽章
- 管理员创建新徽章
- 管理员授予/撤销用户徽章

**Step 2: 运行测试**

Run: `npm run test:e2e -- --grep badges`
Expected: All tests pass

**Step 3: 提交**

```bash
git add e2e/tests/badges.spec.ts
git commit -m "test(badges): 添加 E2E 测试"
```

---

## Task 20: 文档更新

**Files:**
- Modify: `CLAUDE.md`
- Modify: `API_ROUTES.md`

**Step 1: 更新 CLAUDE.md**

在功能模块导航中添加徽章系统：

```markdown
### 🏆 徽章系统
**状态**: ✅ 已完成
**功能**: 自动/手动徽章、用户置顶展示、管理员完整管理
**关键文件**:
- 前端: `src/features/badges/`, `src/contexts/BadgeContext.tsx`
- 后端: `backend/routes/badgeRoutes.js`, `backend/controllers/badgeControllerLowdb.js`, `backend/services/badgeService.js`
```

**Step 2: 更新 API_ROUTES.md**

添加徽章相关 API 文档。

**Step 3: 提交**

```bash
git add CLAUDE.md API_ROUTES.md
git commit -m "docs: 更新文档添加徽章系统说明"
```

---

## 完成检查清单

- [ ] 后端数据模型初始化
- [ ] 后端徽章服务层
- [ ] 后端徽章控制器
- [ ] 后端徽章路由
- [ ] 自动徽章触发集成
- [ ] 后端集成测试
- [ ] 前端类型定义
- [ ] 前端 API 服务
- [ ] 前端 Context
- [ ] Badge/BadgeList 组件
- [ ] BadgeWall 组件
- [ ] NewBadgeToast 组件
- [ ] 个人主页集成
- [ ] BadgePicker 组件
- [ ] 管理员页面
- [ ] 评论区徽章展示
- [ ] 红点提示
- [ ] 前端组件测试
- [ ] E2E 测试
- [ ] 文档更新
