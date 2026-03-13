# 功能模块详细文档

## 🔐 认证系统

**功能**: 用户注册、登录、JWT 认证、全局认证弹窗

**关键文件**:
- 前端: `src/features/auth/`, `src/contexts/AuthContext.tsx`, `src/contexts/AuthModalContext.tsx`
- 后端: `backend/routes/authRoutes.js`, `backend/controllers/authController.js`
- 中间件: `backend/middleware/auth.js`

---

## 📚 期刊管理

**功能**: 期刊浏览、搜索筛选、详情查看、评分

**关键文件**:
- 前端: `src/features/journals/`, `src/hooks/useJournals.ts`
- 后端: `backend/routes/journalRoutes.js`, `backend/controllers/journalController.js`

---

## 💬 评论系统

**功能**: 嵌套评论（3 层）、多维结构化评分（5 维度）、有用性点赞（Toggle）、多维排序、删除标记

**评分维度**: 审稿速度 / 编辑态度 / 录用难度 / 审稿质量 / 综合体验

**关键文件**:
- 前端: `src/features/comments/`（含 `DimensionRatingInput.*`, `DimensionRatingDisplay.*`）
- 后端: `backend/routes/commentRoutes.js`, `backend/controllers/commentController.js`
- 模型: `backend/models/Comment.js`, `backend/models/CommentLike.js`

---

## 📝 社区帖子系统

**功能**: 学术交流社区，支持发帖、评论、互动（点赞/收藏/关注）、内容举报

**特性**:
- Markdown 编辑器: 粗体、斜体、标题、链接、引用、代码块、列表、图片
- 视图模式: 编辑/预览/分屏
- 草稿自动保存: 每 30 秒保存到 localStorage
- 分类标签: 6 大预设分类 + 自由标签
- 嵌套评论: 3 层嵌套回复
- 多维排序: 热门/最新/浏览量/点赞数/评论数
- XSS 防护: DOMPurify 清理

**关键文件**:
- 前端: `src/features/posts/`
- 后端: `backend/routes/postRoutes.js`, `backend/controllers/postController.js`
- 模型: `backend/models/Post.js`, `backend/models/PostComment.js`

**API 路由**:
```
GET    /api/posts                    # 获取帖子列表
GET    /api/posts/:id                # 获取单个帖子
POST   /api/posts                    # 创建帖子
PUT    /api/posts/:id                # 更新帖子
DELETE /api/posts/:id                # 删除帖子
POST   /api/posts/:id/like           # 点赞/取消
POST   /api/posts/:id/favorite       # 收藏/取消
POST   /api/posts/:id/follow         # 关注/取消
POST   /api/posts/:id/report         # 举报
GET    /api/posts/:postId/comments   # 获取评论
POST   /api/posts/:postId/comments   # 发表评论
```

---

## 📢 公告系统

**功能**: 系统公告、横幅通知、紧急弹窗、已读追踪

**类型**: 普通公告 / 紧急通知 / 横幅公告

**颜色方案**: info / success / warning / danger

**目标受众**: 全站 / 按角色 / 指定用户

**关键文件**:
- 前端: `src/features/announcements/`, `src/contexts/AnnouncementContext.tsx`
- 后端: `backend/routes/announcementRoutes.js`, `backend/controllers/announcementController.js`
- 模型: `backend/models/Announcement.js`, `backend/models/UserAnnouncementRead.js`

**API 路由**:
```
# 用户端
GET    /api/announcements/banners      # 获取横幅公告
GET    /api/announcements              # 获取公告列表
GET    /api/announcements/unread-count # 未读数量
POST   /api/announcements/:id/read     # 标记已读
POST   /api/announcements/read-all     # 全部已读

# 管理端
GET    /api/admin/announcements        # 管理列表
POST   /api/admin/announcements        # 创建公告
PUT    /api/admin/announcements/:id    # 更新公告
PUT    /api/admin/announcements/:id/publish  # 发布
PUT    /api/admin/announcements/:id/archive  # 归档
DELETE /api/admin/announcements/:id    # 删除
```

---

## ⭐ 收藏系统

**功能**: 收藏期刊、取消收藏、收藏列表

**关键文件**:
- 前端: `src/features/favorite/`
- 后端: `backend/routes/favoriteRoutes.js`, `backend/controllers/favoriteController.js`

---

## 👥 关注系统

**功能**: 关注用户、取消关注、关注列表、粉丝列表

**关键文件**:
- 前端: `src/features/follow/`
- 后端: `backend/routes/followRoutes.js`, `backend/controllers/followController.js`

---

## 🏅 积分与荣誉系统

**功能**: 动态积分与等级计算、自动/手动触发徽章、全局荣誉图鉴、管理端直签

**关键文件**:
- 前端: `src/features/badges/`, `src/features/admin/components/BadgeManagement.tsx`
- 后端: `backend/routes/badgeRoutes.js`, `backend/controllers/badgeController.js`
- 模型: `backend/models/Badge.js`, `backend/models/UserBadge.js`

---

## 🎨 主题系统

**功能**: 6 个预设主题、深浅模式切换、localStorage 持久化

**可用主题**:
1. 默认蓝 - 经典学术蓝色系
2. 温暖自然 - 柔和米黄色系
3. 日落辉光 - 橙黄渐变色系
4. 复古橄榄 - 优雅自然色系
5. 柔和大地 - 粉褐柔和色系
6. 暖秋大地 - 金黄暖秋色系

**关键文件**:
- 前端: `src/contexts/ThemeContext.tsx`, `src/components/common/ThemePicker.*`
- 样式: `src/styles/global.css`
- 文档: `THEMES.md`

---

## 🛡️ 管理后台

**功能**: 用户管理、期刊管理、评论审核、荣誉徽章颁发、公告管理

**关键文件**:
- 前端: `src/features/admin/`
- 后端: `backend/routes/adminRoutes.js`, `backend/controllers/adminController.js`
- 中间件: `backend/middleware/adminAuth.js`

---

## 🗄️ 数据库管理

**功能**: 表列表/结构/数据浏览、行内编辑、删除、搜索排序分页、操作审计日志

**权限**: 仅 superadmin 可访问

**关键文件**:
- 前端: `src/features/admin/components/DatabaseManager.tsx`
- 后端: `backend/routes/databaseRoutes.js`, `backend/controllers/databaseController.js`
- 中间件: `backend/middleware/superAdminAuth.js`
- 模型: `backend/models/DatabaseAuditLog.js`

---

## 📋 投稿追踪系统

**功能**: 稿件管理、多次投稿、状态时间轴、期刊智能搜索

**特性**:
- 期刊智能搜索: 名称/ISSN 模糊搜索，300ms 防抖
- JournalPicker 组件: 分类过滤、自定义维度显示
- JournalInfoCard 组件: 5 维度评分、收藏快捷操作
- 乐观 UI 更新

**关键文件**:
- 前端: `src/components/common/JournalPicker.*`, `src/features/submissions/`
- 后端: `backend/routes/journalRoutes.js`
- 模型: `backend/models/Manuscript.js`, `backend/models/Submission.js`
