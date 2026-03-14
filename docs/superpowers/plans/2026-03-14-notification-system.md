# Notification System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a personal notification system (comment replies, likes, follows, badges, etc.) with an independent backend model and frontend UI integrated into the existing announcement bell via Tab navigation.

**Architecture:** Independent `Notification` model with a generic `notificationService.create()` called from existing business controllers. Frontend creates a parallel `NotificationContext` and refactors `AnnouncementBell` into a tabbed `NotificationBell` component that consumes both announcement and notification contexts.

**Tech Stack:** Sequelize (MySQL), Express, React 18, TypeScript, CSS Variables (design system), Lucide React icons

**Spec:** `docs/superpowers/specs/2026-03-14-notification-system-design.md`

---

## File Structure

### Backend — New Files
| File | Responsibility |
|------|---------------|
| `backend/models/Notification.js` | Sequelize model: notifications table with UUID PK, type/entityType enums, JSON content |
| `backend/services/notificationService.js` | Internal service: `create()` with self-notification guard and error isolation |
| `backend/controllers/notificationController.js` | 5 endpoints: list, unread-count, detail, mark-read, mark-all-read |
| `backend/routes/notificationRoutes.js` | Route registration with auth middleware |

### Backend — Modified Files
| File | Change |
|------|--------|
| `backend/models/index.js` | Register Notification model + associations |
| `backend/server.js` | Mount `/api/notifications` route |
| `backend/controllers/commentController.js` | Trigger `comment_reply` + `journal_new_comment` notifications |
| `backend/controllers/postController.js` | Trigger `follow_new_content` (createPost) + `like` (toggleLike) |
| `backend/controllers/postCommentController.js` | Trigger `post_comment` + `post_comment_reply` |
| `backend/controllers/followController.js` | Trigger `new_follower` |
| `backend/services/badgeService.js` | Trigger `badge_earned` |
| `backend/controllers/submissionController.js` | Trigger `submission_status` |

### Frontend — New Files
| File | Responsibility |
|------|---------------|
| `src/features/notifications/types/notification.ts` | TypeScript types for Notification |
| `src/features/notifications/services/notificationService.ts` | API client for notification endpoints |
| `src/contexts/NotificationContext.tsx` | Notification state + 60s polling + optimistic updates |
| `src/features/notifications/components/NotificationItem.tsx` | Notification list item in dropdown |
| `src/features/notifications/components/NotificationItem.css` | Styles for notification items |
| `src/features/notifications/components/NotificationModal.tsx` | Notification detail modal with "查看原文" link |
| `src/features/notifications/components/NotificationModal.css` | Styles for notification modal |

### Frontend — Modified Files
| File | Change |
|------|--------|
| `src/features/announcements/components/AnnouncementBell.tsx` | Refactor to `NotificationBell` with Tab UI (通知/公告) |
| `src/features/announcements/components/AnnouncementBell.css` | Add Tab styles |
| `src/App.tsx` or layout file | Wrap with `NotificationProvider` |

---

## Chunk 1: Backend Model + Service + API

### Task 1: Create Notification Model

**Files:**
- Create: `backend/models/Notification.js`
- Modify: `backend/models/index.js`

- [ ] **Step 1: Create `backend/models/Notification.js`**

```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.CHAR(36),
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  recipientId: {
    type: DataTypes.CHAR(36),
    allowNull: false
  },
  senderId: {
    type: DataTypes.CHAR(36),
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM(
      'comment_reply',
      'post_comment',
      'post_comment_reply',
      'like',
      'new_follower',
      'follow_new_content',
      'journal_new_comment',
      'badge_earned',
      'comment_deleted',
      'submission_status',
      'system'
    ),
    allowNull: false
  },
  entityType: {
    type: DataTypes.ENUM('journal', 'comment', 'post', 'post_comment', 'badge', 'submission'),
    allowNull: true
  },
  entityId: {
    type: DataTypes.CHAR(36),
    allowNull: true
  },
  content: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    {
      fields: ['recipientId', 'isRead', 'createdAt']
    },
    {
      fields: ['recipientId', 'isRead']
    }
  ]
});

module.exports = Notification;
```

- [ ] **Step 2: Register model and associations in `backend/models/index.js`**

Add after existing model imports:
```javascript
const Notification = require('./Notification');
```

Add in the associations section:
```javascript
// Notification associations
User.hasMany(Notification, { foreignKey: 'recipientId', as: 'receivedNotifications' });
User.hasMany(Notification, { foreignKey: 'senderId', as: 'sentNotifications' });
Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });
Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
```

Add to module.exports:
```javascript
Notification,
```

- [ ] **Step 3: Verify DB sync**

Run: `cd backend && node -e "const { sequelize } = require('./models'); sequelize.sync({ alter: true }).then(() => { console.log('OK'); process.exit(); }).catch(e => { console.error(e); process.exit(1); })"`

Expected: `OK` — notifications table created with correct columns and indexes.

- [ ] **Step 4: Commit**

```bash
git add backend/models/Notification.js backend/models/index.js
git commit -m "feat(notification): add Notification model with associations"
```

---

### Task 2: Create Notification Service

**Files:**
- Create: `backend/services/notificationService.js`

- [ ] **Step 1: Create `backend/services/notificationService.js`**

```javascript
const Notification = require('../models/Notification');

class NotificationService {
  /**
   * Create a notification. Silently skips if sender === recipient.
   * Never throws — logs errors to prevent blocking business logic.
   */
  async create({ recipientId, senderId = null, type, entityType = null, entityId = null, content = {} }) {
    try {
      // Don't notify yourself
      if (senderId && senderId === recipientId) {
        return null;
      }

      const notification = await Notification.create({
        recipientId,
        senderId,
        type,
        entityType,
        entityId,
        content
      });

      return notification;
    } catch (error) {
      console.error(`[NotificationService] Failed to create notification (type=${type}):`, error.message);
      return null;
    }
  }

  /**
   * Create notifications for multiple recipients.
   * Used for fan-out scenarios (e.g., journal_new_comment to all who favorited).
   */
  async createBulk(recipientIds, { senderId = null, type, entityType = null, entityId = null, content = {} }) {
    const results = [];
    for (const recipientId of recipientIds) {
      const result = await this.create({ recipientId, senderId, type, entityType, entityId, content });
      if (result) results.push(result);
    }
    return results;
  }
}

module.exports = new NotificationService();
```

- [ ] **Step 2: Verify service loads**

Run: `cd backend && node -e "const ns = require('./services/notificationService'); console.log(typeof ns.create, typeof ns.createBulk);"`

Expected: `function function`

- [ ] **Step 3: Commit**

```bash
git add backend/services/notificationService.js
git commit -m "feat(notification): add notificationService with create and createBulk"
```

---

### Task 3: Create Notification Controller

**Files:**
- Create: `backend/controllers/notificationController.js`

- [ ] **Step 1: Create `backend/controllers/notificationController.js`**

```javascript
const { Op } = require('sequelize');
const Notification = require('../models/Notification');
const User = require('../models/User');

// GET /api/notifications?page=1&limit=20&type=comment_reply
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { recipientId: req.user.id };
    if (type) {
      where.type = type;
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'name', 'avatar']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        notifications: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ success: false, message: '获取通知列表失败' });
  }
};

// GET /api/notifications/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { recipientId: req.user.id, isRead: false }
    });
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    res.status(500).json({ success: false, message: '获取未读数失败' });
  }
};

// GET /api/notifications/:id
const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, recipientId: req.user.id },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'name', 'avatar']
      }]
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: '通知不存在' });
    }

    // Auto-mark as read
    if (!notification.isRead) {
      await notification.update({ isRead: true, readAt: new Date() });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('getNotificationById error:', error);
    res.status(500).json({ success: false, message: '获取通知详情失败' });
  }
};

// POST /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, recipientId: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: '通知不存在' });
    }

    if (!notification.isRead) {
      await notification.update({ isRead: true, readAt: new Date() });
    }

    res.json({ success: true, message: '已标记为已读' });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({ success: false, message: '标记已读失败' });
  }
};

// POST /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { recipientId: req.user.id, isRead: false } }
    );

    res.json({ success: true, message: '已全部标记为已读' });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    res.status(500).json({ success: false, message: '全部标记已读失败' });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAllAsRead
};
```

- [ ] **Step 2: Commit**

```bash
git add backend/controllers/notificationController.js
git commit -m "feat(notification): add notificationController with 5 endpoints"
```

---

### Task 4: Create Routes + Register in Server

**Files:**
- Create: `backend/routes/notificationRoutes.js`
- Modify: `backend/server.js`

- [ ] **Step 1: Create `backend/routes/notificationRoutes.js`**

```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');

// All routes require authentication
router.use(protect);

// Static routes before parameterized routes
router.get('/unread-count', getUnreadCount);
router.post('/read-all', markAllAsRead);

router.get('/', getNotifications);
router.get('/:id', getNotificationById);
router.post('/:id/read', markAsRead);

module.exports = router;
```

- [ ] **Step 2: Register in `backend/server.js`**

Add after the existing route registrations (near line 129):
```javascript
const notificationRoutes = require('./routes/notificationRoutes');
```

And in the route mounting section:
```javascript
app.use('/api/notifications', notificationRoutes);
```

- [ ] **Step 3: Test API manually**

Run: `cd backend && npm start`

Then test with curl or similar:
- `GET /api/notifications` (with auth header) → should return empty list
- `GET /api/notifications/unread-count` → should return `{ count: 0 }`

- [ ] **Step 4: Commit**

```bash
git add backend/routes/notificationRoutes.js backend/server.js
git commit -m "feat(notification): add notification routes and mount in server"
```

---

## Chunk 2: Backend Notification Triggers

### Task 5: Trigger — Comment Reply + Journal New Comment

**Files:**
- Modify: `backend/controllers/commentController.js`

- [ ] **Step 1: Add notificationService import at top of `commentController.js`**

```javascript
const notificationService = require('../services/notificationService');
```

- [ ] **Step 2: Add `comment_reply` trigger in `createComment` method**

After the comment is successfully created (around line 271-281, after `Comment.create` and the badge check), add:

```javascript
// Notify: comment_reply (if replying to another user's comment)
if (parentId) {
  try {
    const parentComment = await Comment.findByPk(parentId);
    if (parentComment) {
      await notificationService.create({
        recipientId: parentComment.userId,
        senderId: req.user.id,
        type: 'comment_reply',
        entityType: 'comment',
        entityId: newComment.id,
        content: {
          title: `${req.user.name} 回复了你的评论`,
          body: content.substring(0, 100),
          commentContent: content.substring(0, 200),
          journalTitle: journal ? journal.title : ''
        }
      });
    }
  } catch (err) {
    console.error('Notification (comment_reply) failed:', err.message);
  }
}
```

- [ ] **Step 3: Add `journal_new_comment` trigger in `createComment` method**

After the comment_reply block, add:

```javascript
// Notify: journal_new_comment (to all users who favorited this journal)
try {
  const Favorite = require('../models/Favorite');
  const favorites = await Favorite.findAll({
    where: { journalId },
    attributes: ['userId']
  });
  const recipientIds = favorites.map(f => f.userId);
  if (recipientIds.length > 0) {
    const journal = await Journal.findByPk(journalId);
    await notificationService.createBulk(recipientIds, {
      senderId: req.user.id,
      type: 'journal_new_comment',
      entityType: 'journal',
      entityId: journalId,
      content: {
        title: `你收藏的期刊「${journal ? journal.title : ''}」有新评论`,
        body: content.substring(0, 100),
        commentContent: content.substring(0, 200),
        journalTitle: journal ? journal.title : ''
      }
    });
  }
} catch (err) {
  console.error('Notification (journal_new_comment) failed:', err.message);
}
```

- [ ] **Step 4: Add `comment_deleted` trigger in `deleteComment` method**

After the soft delete (around line 360-363), add:

```javascript
// Notify: comment_deleted (if admin deletes another user's comment)
if (req.user.role === 'admin' || req.user.role === 'superadmin') {
  try {
    const journal = await Journal.findByPk(comment.journalId);
    await notificationService.create({
      recipientId: comment.userId,
      senderId: req.user.id,
      type: 'comment_deleted',
      entityType: 'comment',
      entityId: comment.id,
      content: {
        title: '你的评论已被管理员删除',
        body: comment.content ? comment.content.substring(0, 100) : '',
        reason: req.body.reason || '',
        journalTitle: journal ? journal.title : ''
      }
    });
  } catch (err) {
    console.error('Notification (comment_deleted) failed:', err.message);
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/commentController.js
git commit -m "feat(notification): add comment_reply, journal_new_comment, comment_deleted triggers"
```

---

### Task 6: Trigger — Post Comment + Post Comment Reply

**Files:**
- Modify: `backend/controllers/postCommentController.js`

- [ ] **Step 1: Add import at top**

```javascript
const notificationService = require('../services/notificationService');
```

- [ ] **Step 2: Add triggers in `createComment` method (around line 121-127)**

After `PostComment.create` succeeds, add:

```javascript
// Notify: post_comment (to post author)
try {
  const Post = require('../models/Post');
  const post = await Post.findByPk(postId);
  if (post) {
    await notificationService.create({
      recipientId: post.userId,
      senderId: req.user.id,
      type: 'post_comment',
      entityType: 'post',
      entityId: postId,
      content: {
        title: `${req.user.name} 评论了你的帖子`,
        body: content.substring(0, 100),
        commentContent: content.substring(0, 200),
        postTitle: post.title || ''
      }
    });
  }
} catch (err) {
  console.error('Notification (post_comment) failed:', err.message);
}

// Notify: post_comment_reply (to parent comment author)
if (parentId) {
  try {
    const PostComment = require('../models/PostComment');
    const parentComment = await PostComment.findByPk(parentId);
    const Post = require('../models/Post');
    const post = await Post.findByPk(postId);
    if (parentComment) {
      await notificationService.create({
        recipientId: parentComment.userId,
        senderId: req.user.id,
        type: 'post_comment_reply',
        entityType: 'post_comment',
        entityId: comment.id,
        content: {
          title: `${req.user.name} 回复了你的评论`,
          body: content.substring(0, 100),
          commentContent: content.substring(0, 200),
          postTitle: post ? post.title : ''
        }
      });
    }
  } catch (err) {
    console.error('Notification (post_comment_reply) failed:', err.message);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/controllers/postCommentController.js
git commit -m "feat(notification): add post_comment and post_comment_reply triggers"
```

---

### Task 7: Trigger — Like + Follow New Content

**Files:**
- Modify: `backend/controllers/postController.js`

- [ ] **Step 1: Add import at top**

```javascript
const notificationService = require('../services/notificationService');
```

- [ ] **Step 2: Add `like` trigger in `toggleLike` method (around line 313-315, inside the "liked" branch)**

```javascript
// Notify: like (to post author)
try {
  await notificationService.create({
    recipientId: post.userId,
    senderId: req.user.id,
    type: 'like',
    entityType: 'post',
    entityId: id,
    content: {
      title: `${req.user.name} 赞了你的帖子`,
      body: post.title || '',
      postTitle: post.title || ''
    }
  });
} catch (err) {
  console.error('Notification (like) failed:', err.message);
}
```

- [ ] **Step 3: Add `follow_new_content` trigger in `createPost` method (around line 185-199, after post is fully created)**

```javascript
// Notify: follow_new_content (to all followers of post author)
try {
  const Follow = require('../models/Follow');
  const followers = await Follow.findAll({
    where: { followingId: req.user.id },
    attributes: ['followerId']
  });
  const followerIds = followers.map(f => f.followerId);
  if (followerIds.length > 0) {
    await notificationService.createBulk(followerIds, {
      senderId: req.user.id,
      type: 'follow_new_content',
      entityType: 'post',
      entityId: fullPost.id,
      content: {
        title: `你关注的 ${req.user.name} 发布了新内容`,
        body: title ? title.substring(0, 100) : '',
        contentTitle: title || '',
        contentType: 'post'
      }
    });
  }
} catch (err) {
  console.error('Notification (follow_new_content) failed:', err.message);
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/controllers/postController.js
git commit -m "feat(notification): add like and follow_new_content triggers"
```

---

### Task 8: Trigger — New Follower

**Files:**
- Modify: `backend/controllers/followController.js`

- [ ] **Step 1: Add import at top**

```javascript
const notificationService = require('../services/notificationService');
```

- [ ] **Step 2: Add `new_follower` trigger after `Follow.create` (around line 26-29)**

```javascript
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
```

- [ ] **Step 3: Commit**

```bash
git add backend/controllers/followController.js
git commit -m "feat(notification): add new_follower trigger"
```

---

### Task 9: Trigger — Badge Earned

**Files:**
- Modify: `backend/services/badgeService.js`

- [ ] **Step 1: Add import at top**

```javascript
const notificationService = require('./notificationService');
```

- [ ] **Step 2: Add `badge_earned` trigger inside `checkAndGrantBadges` (around line 70-82, after UserBadge.create)**

Inside the loop where badges are granted, after adding to `grantedBadges`:

```javascript
// Notify: badge_earned
try {
  await notificationService.create({
    recipientId: userId,
    senderId: null,
    type: 'badge_earned',
    entityType: 'badge',
    entityId: badge.id,
    content: {
      title: `恭喜你获得了「${badge.name}」徽章`,
      body: badge.description || '',
      badgeName: badge.name,
      badgeDescription: badge.description || ''
    }
  });
} catch (err) {
  console.error('Notification (badge_earned) failed:', err.message);
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/services/badgeService.js
git commit -m "feat(notification): add badge_earned trigger"
```

---

### Task 10: Trigger — Submission Status

**Files:**
- Modify: `backend/controllers/submissionController.js`

- [ ] **Step 1: Add import at top**

```javascript
const notificationService = require('../services/notificationService');
```

- [ ] **Step 2: Add `submission_status` trigger in `addStatusHistory` method (around line 309-314)**

After `SubmissionStatusHistory.create`:

```javascript
// Notify: submission_status
try {
  const Submission = require('../models/Submission');
  const Manuscript = require('../models/Manuscript');
  const submission = await Submission.findByPk(submissionId);
  if (submission) {
    const manuscript = await Manuscript.findByPk(submission.manuscriptId);
    await notificationService.create({
      recipientId: submission.userId || req.user.id,
      senderId: null,
      type: 'submission_status',
      entityType: 'submission',
      entityId: submissionId,
      content: {
        title: `投稿状态已更新为「${status}」`,
        body: note || '',
        status: status,
        submissionTitle: manuscript ? manuscript.title : ''
      }
    });
  }
} catch (err) {
  console.error('Notification (submission_status) failed:', err.message);
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/controllers/submissionController.js
git commit -m "feat(notification): add submission_status trigger"
```

---

## Chunk 3: Frontend Types + Service + Context

### Task 11: Create Notification Types

**Files:**
- Create: `src/features/notifications/types/notification.ts`

- [ ] **Step 1: Create directory and types file**

```bash
mkdir -p src/features/notifications/types
mkdir -p src/features/notifications/services
mkdir -p src/features/notifications/components
```

- [ ] **Step 2: Create `src/features/notifications/types/notification.ts`**

```typescript
export type NotificationType =
  | 'comment_reply'
  | 'post_comment'
  | 'post_comment_reply'
  | 'like'
  | 'new_follower'
  | 'follow_new_content'
  | 'journal_new_comment'
  | 'badge_earned'
  | 'comment_deleted'
  | 'submission_status'
  | 'system';

export type EntityType = 'journal' | 'comment' | 'post' | 'post_comment' | 'badge' | 'submission';

export interface NotificationContent {
  title: string;
  body: string;
  commentContent?: string;
  journalTitle?: string;
  postTitle?: string;
  contentTitle?: string;
  contentType?: string;
  badgeName?: string;
  badgeDescription?: string;
  reason?: string;
  status?: string;
  submissionTitle?: string;
}

export interface NotificationSender {
  id: string;
  name: string;
  avatar?: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string | null;
  sender: NotificationSender | null;
  type: NotificationType;
  entityType: EntityType | null;
  entityId: string | null;
  content: NotificationContent;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/notifications/
git commit -m "feat(notification): add frontend TypeScript types"
```

---

### Task 12: Create Notification Service (Frontend)

**Files:**
- Create: `src/features/notifications/services/notificationService.ts`

- [ ] **Step 1: Create `src/features/notifications/services/notificationService.ts`**

Follow the pattern from `src/features/announcements/services/announcementService.ts`:

```typescript
import axios from 'axios';
import type { Notification, NotificationListResponse, UnreadCountResponse } from '../types/notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getNotifications = async (page = 1, limit = 20, type?: string): Promise<NotificationListResponse> => {
  const params: Record<string, string | number> = { page, limit };
  if (type) params.type = type;
  const response = await axios.get(`${API_URL}/notifications`, {
    headers: getAuthHeaders(),
    params
  });
  return response.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await axios.get<UnreadCountResponse>(`${API_URL}/notifications/unread-count`, {
    headers: getAuthHeaders()
  });
  return response.data.data.count;
};

export const getNotificationById = async (id: string): Promise<Notification> => {
  const response = await axios.get(`${API_URL}/notifications/${id}`, {
    headers: getAuthHeaders()
  });
  return response.data.data;
};

export const markAsRead = async (id: string): Promise<void> => {
  await axios.post(`${API_URL}/notifications/${id}/read`, {}, {
    headers: getAuthHeaders()
  });
};

export const markAllAsRead = async (): Promise<void> => {
  await axios.post(`${API_URL}/notifications/read-all`, {}, {
    headers: getAuthHeaders()
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add src/features/notifications/services/notificationService.ts
git commit -m "feat(notification): add frontend notification API service"
```

---

### Task 13: Create NotificationContext

**Files:**
- Create: `src/contexts/NotificationContext.tsx`
- Modify: `src/App.tsx` (or layout file) — wrap with provider

- [ ] **Step 1: Create `src/contexts/NotificationContext.tsx`**

Follow the pattern from `src/contexts/AnnouncementContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import type { Notification } from '../features/notifications/types/notification';
import * as notificationService from '../features/notifications/services/notificationService';

const POLLING_INTERVAL = 60 * 1000; // 60 seconds

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [listResponse, count] = await Promise.all([
        notificationService.getNotifications(1, 20),
        notificationService.getUnreadCount()
      ]);
      setNotifications(listResponse.data.notifications);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const pollRefresh = useCallback(async () => {
    if (!user || document.visibilityState !== 'visible') return;
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Notification poll failed:', error);
    }
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      refreshNotifications();
    }
  }, [refreshNotifications]);

  const markAllAsRead = useCallback(async () => {
    const prevNotifications = notifications;
    const prevCount = unreadCount;

    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      setNotifications(prevNotifications);
      setUnreadCount(prevCount);
    }
  }, [notifications, unreadCount]);

  // Initial fetch and auth change
  useEffect(() => {
    if (user) {
      refreshNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, refreshNotifications]);

  // Polling
  useEffect(() => {
    if (!user) return;

    pollingRef.current = setInterval(pollRefresh, POLLING_INTERVAL);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [user, pollRefresh]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      refreshNotifications,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
```

- [ ] **Step 2: Wrap app with `NotificationProvider`**

In the layout file (likely `src/App.tsx` or wherever `AnnouncementProvider` is used), add `NotificationProvider` as a sibling wrapper:

```typescript
import { NotificationProvider } from './contexts/NotificationContext';
```

Wrap alongside AnnouncementProvider:
```tsx
<AnnouncementProvider>
  <NotificationProvider>
    {/* existing children */}
  </NotificationProvider>
</AnnouncementProvider>
```

- [ ] **Step 3: Verify app loads without errors**

Run: `npm run dev` — check browser console for errors. The notification context should initialize silently with 0 unread.

- [ ] **Step 4: Commit**

```bash
git add src/contexts/NotificationContext.tsx src/App.tsx
git commit -m "feat(notification): add NotificationContext with 60s polling"
```

---

## Chunk 4: Frontend Components

### Task 14: Create NotificationItem Component

**Files:**
- Create: `src/features/notifications/components/NotificationItem.tsx`
- Create: `src/features/notifications/components/NotificationItem.css`

- [ ] **Step 1: Create `NotificationItem.css`**

Reference `AnnouncementItem.css` for consistent styling:

```css
.notification-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
  border-bottom: 1px solid var(--color-border);
}

.notification-item:hover {
  background-color: var(--color-background-hover);
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item--unread {
  background-color: var(--color-info-light);
}

.notification-item__indicator {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: var(--space-2);
}

.notification-item__indicator--unread {
  background-color: var(--color-info);
}

.notification-item__indicator--read {
  background-color: transparent;
}

.notification-item__body {
  flex: 1;
  min-width: 0;
}

.notification-item__title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--space-1);
  line-height: 1.4;
}

.notification-item__preview {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-item__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.notification-item__time {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.notification-item__type-tag {
  font-size: 10px;
  padding: 1px var(--space-1);
  border-radius: var(--radius-sm);
  background-color: var(--color-info-light);
  color: var(--color-info);
}
```

- [ ] **Step 2: Create `NotificationItem.tsx`**

```tsx
import React from 'react';
import type { Notification } from '../types/notification';
import './NotificationItem.css';

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

const TYPE_LABELS: Record<string, string> = {
  comment_reply: '回复',
  post_comment: '评论',
  post_comment_reply: '回复',
  like: '点赞',
  new_follower: '关注',
  follow_new_content: '动态',
  journal_new_comment: '期刊',
  badge_earned: '徽章',
  comment_deleted: '删除',
  submission_status: '投稿',
  system: '系统'
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
  const { content, isRead, type, createdAt } = notification;

  return (
    <div
      className={`notification-item ${!isRead ? 'notification-item--unread' : ''}`}
      onClick={() => onClick(notification)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(notification); }}
    >
      <div className={`notification-item__indicator ${!isRead ? 'notification-item__indicator--unread' : 'notification-item__indicator--read'}`} />
      <div className="notification-item__body">
        <div className="notification-item__title">{content.title}</div>
        {content.body && (
          <div className="notification-item__preview">
            {content.body.length > 80 ? content.body.substring(0, 80) + '...' : content.body}
          </div>
        )}
        <div className="notification-item__meta">
          <span className="notification-item__type-tag">{TYPE_LABELS[type] || type}</span>
          <span className="notification-item__time">{formatRelativeTime(createdAt)}</span>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add src/features/notifications/components/NotificationItem.tsx src/features/notifications/components/NotificationItem.css
git commit -m "feat(notification): add NotificationItem component"
```

---

### Task 15: Create NotificationModal Component

**Files:**
- Create: `src/features/notifications/components/NotificationModal.tsx`
- Create: `src/features/notifications/components/NotificationModal.css`

- [ ] **Step 1: Create `NotificationModal.css`**

Reference `AnnouncementModal.css`:

```css
.notification-modal__overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal, 1100);
  animation: notification-modal-fade-in var(--duration-normal) var(--ease-out);
}

@keyframes notification-modal-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.notification-modal {
  background-color: var(--color-background);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 480px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: notification-modal-slide-up var(--duration-normal) var(--ease-out);
}

@keyframes notification-modal-slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.notification-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.notification-modal__title {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-text);
}

.notification-modal__close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-modal__close:hover {
  background-color: var(--color-background-hover);
  color: var(--color-text);
}

.notification-modal__body {
  padding: var(--space-5);
  overflow-y: auto;
  flex: 1;
}

.notification-modal__content {
  font-size: var(--text-sm);
  color: var(--color-text);
  line-height: 1.6;
  margin-bottom: var(--space-4);
}

.notification-modal__extras {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.notification-modal__extra-item {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.notification-modal__extra-label {
  font-weight: 500;
  margin-right: var(--space-1);
}

.notification-modal__meta {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-modal__link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-info);
  text-decoration: none;
  font-weight: 500;
}

.notification-modal__link:hover {
  text-decoration: underline;
}
```

- [ ] **Step 2: Create `NotificationModal.tsx`**

```tsx
import React, { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import type { Notification } from '../types/notification';
import './NotificationModal.css';

interface NotificationModalProps {
  notification: Notification;
  onClose: () => void;
}

function getEntityLink(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null;

  const routes: Record<string, string> = {
    journal: `/journals/${entityId}`,
    comment: `/journals/${entityId}`,
    post: `/posts/${entityId}`,
    post_comment: `/posts/${entityId}`,
    badge: `/profile`,
    submission: `/submissions`
  };

  return routes[entityType] || null;
}

function getExtraFields(notification: Notification): Array<{ label: string; value: string }> {
  const { type, content } = notification;
  const extras: Array<{ label: string; value: string }> = [];

  if (content.journalTitle) extras.push({ label: '期刊', value: content.journalTitle });
  if (content.postTitle) extras.push({ label: '帖子', value: content.postTitle });
  if (content.badgeName) extras.push({ label: '徽章', value: content.badgeName });
  if (content.badgeDescription) extras.push({ label: '描述', value: content.badgeDescription });
  if (content.status) extras.push({ label: '状态', value: content.status });
  if (content.submissionTitle) extras.push({ label: '稿件', value: content.submissionTitle });
  if (content.reason) extras.push({ label: '原因', value: content.reason });
  if (content.commentContent) extras.push({ label: '评论内容', value: content.commentContent });

  return extras;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ notification, onClose }) => {
  const link = getEntityLink(notification.entityType, notification.entityId);
  const extras = getExtraFields(notification);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="notification-modal__overlay" onClick={onClose}>
      <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notification-modal__header">
          <h3 className="notification-modal__title">{notification.content.title}</h3>
          <button className="notification-modal__close" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="notification-modal__body">
          {notification.content.body && (
            <div className="notification-modal__content">{notification.content.body}</div>
          )}
          {extras.length > 0 && (
            <div className="notification-modal__extras">
              {extras.map((extra, i) => (
                <div key={i} className="notification-modal__extra-item">
                  <span className="notification-modal__extra-label">{extra.label}:</span>
                  {extra.value}
                </div>
              ))}
            </div>
          )}
          <div className="notification-modal__meta">
            <span>{new Date(notification.createdAt).toLocaleString('zh-CN')}</span>
            {link && (
              <a href={link} className="notification-modal__link" onClick={onClose}>
                查看原文 <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add src/features/notifications/components/NotificationModal.tsx src/features/notifications/components/NotificationModal.css
git commit -m "feat(notification): add NotificationModal component with detail view and entity link"
```

---

### Task 16: Refactor AnnouncementBell into Tabbed NotificationBell

**Files:**
- Modify: `src/features/announcements/components/AnnouncementBell.tsx`
- Modify: `src/features/announcements/components/AnnouncementBell.css`

This is the most complex frontend task. The existing `AnnouncementBell` needs to become a tabbed component that shows both announcements and notifications.

- [ ] **Step 1: Add Tab styles to `AnnouncementBell.css`**

Add the following to the existing CSS file:

```css
/* Tab navigation */
.announcement-bell__tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
}

.announcement-bell__tab {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-muted);
  transition: all var(--duration-fast) var(--ease-out);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
}

.announcement-bell__tab:hover {
  color: var(--color-text);
  background-color: var(--color-background-hover);
}

.announcement-bell__tab--active {
  color: var(--color-info);
  border-bottom-color: var(--color-info);
}

.announcement-bell__tab-badge {
  font-size: 10px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background-color: var(--color-error);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}
```

- [ ] **Step 2: Refactor `AnnouncementBell.tsx` to add Tab support**

This step requires careful integration. The component should:
1. Import `useNotifications` from `NotificationContext`
2. Add a `tab` state (`'notifications' | 'announcements'`)
3. Render Tab bar in the dropdown header
4. Conditionally render NotificationItem list or AnnouncementItem list
5. Combine unread counts for the bell badge
6. Handle "mark all as read" per active tab

Key changes to the component:

```tsx
// Add imports
import { useNotifications } from '../../../contexts/NotificationContext';
import { NotificationItem } from '../../notifications/components/NotificationItem';
import { NotificationModal } from '../../notifications/components/NotificationModal';
import type { Notification as NotificationType } from '../../notifications/types/notification';

// Inside component, add:
const { notifications, unreadCount: notifUnreadCount, markAsRead: markNotifAsRead, markAllAsRead: markAllNotifAsRead } = useNotifications();
const [activeTab, setActiveTab] = useState<'notifications' | 'announcements'>('notifications');
const [selectedNotification, setSelectedNotification] = useState<NotificationType | null>(null);

// Combined badge count
const totalUnread = unreadCount + notifUnreadCount;

// Tab-specific mark all as read
const handleMarkAllRead = () => {
  if (activeTab === 'notifications') {
    markAllNotifAsRead();
  } else {
    markAllAsRead(); // existing announcement markAllAsRead
  }
};

// Notification item click handler
const handleNotificationClick = (notification: NotificationType) => {
  markNotifAsRead(notification.id);
  setSelectedNotification(notification);
};
```

In the JSX dropdown, add Tab bar after the header and before the list:

```tsx
{/* Tab bar */}
<div className="announcement-bell__tabs">
  <button
    className={`announcement-bell__tab ${activeTab === 'notifications' ? 'announcement-bell__tab--active' : ''}`}
    onClick={() => setActiveTab('notifications')}
  >
    通知
    {notifUnreadCount > 0 && (
      <span className="announcement-bell__tab-badge">{notifUnreadCount > 99 ? '99+' : notifUnreadCount}</span>
    )}
  </button>
  <button
    className={`announcement-bell__tab ${activeTab === 'announcements' ? 'announcement-bell__tab--active' : ''}`}
    onClick={() => setActiveTab('announcements')}
  >
    公告
    {unreadCount > 0 && (
      <span className="announcement-bell__tab-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
    )}
  </button>
</div>

{/* Conditional list rendering */}
{activeTab === 'notifications' ? (
  <div className="announcement-bell__list">
    {notifications.length === 0 ? (
      <div className="announcement-bell__empty">暂无通知</div>
    ) : (
      notifications.map(n => (
        <NotificationItem key={n.id} notification={n} onClick={handleNotificationClick} />
      ))
    )}
  </div>
) : (
  <div className="announcement-bell__list">
    {/* existing announcement list rendering */}
  </div>
)}

{/* Notification modal */}
{selectedNotification && (
  <NotificationModal
    notification={selectedNotification}
    onClose={() => setSelectedNotification(null)}
  />
)}
```

Update the badge to use `totalUnread` instead of just announcement `unreadCount`.

- [ ] **Step 3: Test in browser**

Run: `npm run dev`
- Verify bell shows with combined badge count
- Verify Tab switching works between 通知 and 公告
- Verify clicking a notification opens the modal
- Verify "Mark all as read" works per tab
- Verify "查看原文" link appears in modal

- [ ] **Step 4: Commit**

```bash
git add src/features/announcements/components/AnnouncementBell.tsx src/features/announcements/components/AnnouncementBell.css
git commit -m "feat(notification): refactor AnnouncementBell to tabbed NotificationBell"
```

---

## Chunk 5: Integration Testing + Polish

### Task 17: End-to-End Smoke Test

- [ ] **Step 1: Start backend and frontend**

```bash
cd backend && npm start &
npm run dev &
```

- [ ] **Step 2: Test notification generation**

Using the app UI:
1. Log in as User A
2. Create a post
3. Log in as User B (another browser/incognito)
4. Comment on User A's post → should generate `post_comment` notification for User A
5. Follow User A → should generate `new_follower` notification for User A
6. Like User A's post → should generate `like` notification for User A
7. Switch back to User A → bell should show unread count, clicking shows notifications

- [ ] **Step 3: Test notification modal**

1. Click a notification item → modal opens with details
2. "查看原文" link is present and correct
3. Close modal → notification marked as read
4. "全部标记已读" clears all unread

- [ ] **Step 4: Test edge cases**

1. Self-action: User A comments on own post → no notification generated
2. Tab switching: notifications tab vs announcements tab
3. Polling: wait 60 seconds, verify unread count updates

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(notification): complete notification system integration"
```
