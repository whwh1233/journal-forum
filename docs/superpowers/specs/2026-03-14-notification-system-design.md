# 个人通知系统设计文档

> 日期: 2026-03-14
> 状态: 已确认

## 概述

为投哪儿平台新增个人通知系统，用于通知用户与其相关的互动事件（评论回复、点赞、新关注等）。后端采用独立 Notification 模型，前端复用现有公告系统的 Bell 组件和 Modal 组件，通过 Tab 分栏实现公告与通知共存。

## 设计决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 与公告系统的关系 | 独立模型 + 复用前端组件 | 数据模型干净，各自演进互不影响 |
| 前端入口 | 一个铃铛 + Tab 分栏 | 入口统一，不增加导航栏复杂度 |
| 实时性方案 | 轮询（30s ~ 1min） | 简单可靠，无需引入 WebSocket |
| 生命周期 | 永久保留 + 分页 | 用户可随时查阅历史通知 |
| 点击行为 | 打开详情 Modal + 提供跳转链接 | 与公告 Modal 模式一致 |

## 数据模型

### Notification 表

```
Notification
├── id: CHAR(36), UUID, PK
├── recipientId: CHAR(36), FK → User       // 接收者
├── senderId: CHAR(36), FK → User, nullable // 触发者（系统通知无 sender）
├── type: ENUM                               // 通知类型（见下方枚举）
├── entityType: ENUM, nullable               // 关联实体类型
├── entityId: CHAR(36), nullable             // 关联实体 ID
├── content: JSON                            // 灵活内容字段
├── isRead: BOOLEAN, default false
├── readAt: DATE, nullable
├── createdAt: DATE
├── updatedAt: DATE
```

**索引：**
- `recipientId` + `isRead` + `createdAt DESC`（主查询：获取用户通知列表）
- `recipientId` + `isRead`（未读计数）

### type 枚举

| 值 | 说明 |
|----|------|
| `comment_reply` | 评论被回复 |
| `post_comment` | 帖子收到评论 |
| `post_comment_reply` | 帖子评论被回复 |
| `like` | 点赞 |
| `new_follower` | 新关注 |
| `follow_new_content` | 关注的人发布新内容 |
| `journal_new_comment` | 收藏期刊有新评论 |
| `badge_earned` | 获得徽章 |
| `comment_deleted` | 评论被管理员删除 |
| `submission_status` | 投稿状态变更 |
| `system` | 系统个人消息 |

### entityType 枚举

`'journal' | 'comment' | 'post' | 'post_comment' | 'badge' | 'submission'`

### Model 关联

```
User.hasMany(Notification, { as: 'receivedNotifications', foreignKey: 'recipientId' })
User.hasMany(Notification, { as: 'sentNotifications', foreignKey: 'senderId' })
Notification.belongsTo(User, { as: 'recipient', foreignKey: 'recipientId' })
Notification.belongsTo(User, { as: 'sender', foreignKey: 'senderId' })
```

## content JSON 结构规范

### 通用字段（所有类型都有）

```json
{
  "title": "张三回复了你的评论",
  "body": "这篇文章写得很好..."
}
```

### 各类型 extra 字段

| type | extra 字段 |
|------|-----------|
| `comment_reply` | `commentContent`, `journalTitle` |
| `post_comment` | `commentContent`, `postTitle` |
| `post_comment_reply` | `commentContent`, `postTitle` |
| `like` | `postTitle` |
| `new_follower` | （无，sender 信息在主字段） |
| `follow_new_content` | `contentTitle`, `contentType` |
| `journal_new_comment` | `commentContent`, `journalTitle` |
| `badge_earned` | `badgeName`, `badgeDescription` |
| `comment_deleted` | `reason`, `journalTitle` |
| `submission_status` | `status`, `submissionTitle` |
| `system` | （无，title + body 足够） |

## 后端 API

### 路由 `/api/notifications/*`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/notifications` | 分页获取通知列表，支持 `?page=1&limit=20&type=xxx` 过滤 | auth |
| GET | `/api/notifications/unread-count` | 获取未读数 | auth |
| GET | `/api/notifications/:id` | 单条详情（自动标记已读） | auth |
| POST | `/api/notifications/:id/read` | 标记单条已读 | auth |
| POST | `/api/notifications/read-all` | 全部标记已读 | auth |

### 通知生成服务

`backend/services/notificationService.js` — 内部服务，不暴露 API。

```javascript
notificationService.create({
  recipientId,
  senderId,      // nullable
  type,
  entityType,    // nullable
  entityId,      // nullable
  content: { title, body, ...extra }
})
```

**规则：**
- `senderId === recipientId` 时不生成通知
- 通知生成失败不阻塞主业务流程，catch 后仅记录日志

### 各业务触发点

| 触发场景 | 调用位置 | type | entityType |
|---------|---------|------|-----------|
| 回复评论 | commentController.create | `comment_reply` | `comment` |
| 帖子收到评论 | postCommentController.create | `post_comment` | `post` |
| 帖子评论被回复 | postCommentController.create | `post_comment_reply` | `post_comment` |
| 点赞 | postLikeController.create | `like` | `post` |
| 新关注 | followController.create | `new_follower` | null |
| 关注的人发新内容 | postController.create | `follow_new_content` | `post` |
| 收藏期刊新评论 | commentController.create | `journal_new_comment` | `journal` |
| 获得徽章 | badgeController.award | `badge_earned` | `badge` |
| 评论被删除 | commentController.delete (admin) | `comment_deleted` | `comment` |
| 投稿状态变更 | submissionController.update | `submission_status` | `submission` |
| 系统个人消息 | adminController | `system` | null |

## 前端设计

### Bell 组件改造

现有 `AnnouncementBell` 改造为统一的 `NotificationBell`，增加 Tab 分栏：

```
┌─────────────────────────────┐
│  铃铛  [3]                   │  ← 合并未读数 badge
├─────────────────────────────┤
│  [ 通知 (2) ] [ 公告 (1) ]  │  ← Tab 栏，各自显示未读数
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │ * 张三 回复了你的评论   │  │  ← NotificationItem
│  │    "这篇文章写得很好…" │  │
│  │    5 分钟前             │  │
│  ├───────────────────────┤  │
│  │ * 李四 关注了你         │  │
│  │    2 小时前             │  │
│  └───────────────────────┘  │
│         全部标记已读         │
└─────────────────────────────┘
```

### Context 改造

新建 `NotificationContext`，与 `AnnouncementContext` 平行：

- 轮询间隔：30 秒 ~ 1 分钟
- 共享 visibility 检查逻辑（页面不可见时暂停轮询）
- 乐观更新 + 错误回滚

Bell 组件同时消费两个 Context，合并展示。

### 复用清单

| 组件/逻辑 | 复用方式 |
|-----------|---------|
| Bell 外壳 + badge | 改造现有 AnnouncementBell，加 Tab |
| 下拉列表项 | 新建 NotificationItem，参考 AnnouncementItem 样式 |
| 详情 Modal | 复用 AnnouncementModal，传入不同内容 + 跳转链接 |
| 已读/全部已读 | 逻辑模式相同，调不同 API |
| CSS 变量 | 完全复用现有设计系统变量 |

### 不复用的部分

- AnnouncementBanner（横幅轮播）— 通知不需要
- AnnouncementHandler（紧急弹窗队列）— 通知不需要
- 公告 admin 管理界面 — 通知由系统自动生成

### 前端渲染规则

- 下拉列表：`title` + `body` 截取前 80 字 + 相对时间
- Modal 详情：完整 `title` + `body` + extra 信息 + 「查看原文」按钮
- 「查看原文」链接由 `entityType` + `entityId` 拼接路由

## 错误处理与边界情况

- **关联实体被删除**：通知仍保留，「查看原文」点击后提示"原内容已被删除"
- **sender 被封禁/删除**：显示"用户已注销"替代用户名
- **批量通知**：v1 逐条生成，后续可做聚合（"某期刊收到 5 条新评论"）
- **通知生成失败**：不阻塞主业务流程，catch 后仅记录日志

## 文件结构

### 后端新增

```
backend/
├── models/Notification.js
├── controllers/notificationController.js
├── routes/notificationRoutes.js
└── services/notificationService.js
```

### 前端新增/改造

```
src/
├── features/notifications/
│   ├── types/notification.ts
│   ├── services/notificationService.ts
│   └── components/
│       ├── NotificationItem.tsx
│       ├── NotificationItem.css
│       ├── NotificationModal.tsx
│       └── NotificationModal.css
├── contexts/NotificationContext.tsx
└── features/announcements/components/
    ├── AnnouncementBell.tsx  → 改造为 NotificationBell（或重命名）
    └── AnnouncementBell.css → 增加 Tab 样式
```

## 开发规范

- 控制器命名: `notificationController.js`
- 路由命名: `notificationRoutes.js`
- 模型命名: `Notification.js` (PascalCase)
- React 组件: PascalCase
- CSS 使用设计系统变量，禁止硬编码颜色/间距/字号
- 图标使用 Lucide React
