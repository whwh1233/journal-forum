# 社区论坛系统设计文档

**日期**: 2026-03-03
**状态**: 设计已批准
**设计者**: Claude (Brainstorming Session)

## 概述

在现有学术期刊评价平台基础上，新增社区论坛功能，允许用户发布学术讨论帖、分享投稿经验、提问求助等。论坛与期刊评论系统并列，形成"期刊评价 + 学术社区"双核心架构。

## 核心需求

### 功能定位
- **学术交流论坛**：用户发布主题帖，其他用户回复讨论
- **可选期刊关联**：帖子可绑定特定期刊，也可独立存在
- **预设分类 + 标签**：结构化内容组织
- **完整互动功能**：点赞、收藏、关注、评论、举报

### 用户场景
1. 用户分享 Nature 投稿经验，关联期刊 ID
2. 用户发起学术讨论（不关联期刊）
3. 用户在期刊详情页查看"相关讨论"
4. 用户按分类/标签浏览帖子
5. 用户关注感兴趣的帖子，获得新评论通知

---

## 架构设计

### 技术方案选择：方案 B - 独立表设计 + 代码复用

**理由**：
- 不影响现有期刊评论系统，风险低
- 实现速度快，易于迭代
- 代码复用评论组件样式和逻辑

**权衡**：
- 存在一定代码重复（两套评论系统）
- 长期维护成本略高

### 模块结构

```
backend/
├── models/
│   ├── Post.js              # 帖子模型
│   ├── PostComment.js       # 帖子评论模型
│   ├── PostLike.js          # 帖子点赞
│   ├── PostFavorite.js      # 帖子收藏
│   ├── PostFollow.js        # 关注帖子
│   ├── PostReport.js        # 举报
│   └── PostCommentLike.js   # 评论点赞
├── controllers/
│   ├── postController.js
│   └── postCommentController.js
├── routes/
│   ├── postRoutes.js
│   └── postCommentRoutes.js

frontend/
├── src/features/posts/
│   ├── components/
│   │   ├── PostList.tsx
│   │   ├── PostDetail.tsx
│   │   ├── PostForm.tsx
│   │   ├── PostCard.tsx
│   │   ├── PostCommentList.tsx
│   │   └── PostCommentForm.tsx
│   ├── services/postService.ts
│   └── types/post.ts
```

---

## 数据库设计

### Posts 表

```sql
CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,                -- Markdown 内容
  category VARCHAR(50) NOT NULL,        -- 预设分类
  tags JSON,                            -- 标签数组
  journal_id INT NULL,                  -- 可选关联期刊

  -- 统计字段
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  favorite_count INT DEFAULT 0,
  follow_count INT DEFAULT 0,
  hot_score DECIMAL(10,2) DEFAULT 0,    -- 综合热度分

  is_pinned BOOLEAN DEFAULT FALSE,      -- 置顶
  is_deleted BOOLEAN DEFAULT FALSE,
  status ENUM('published', 'draft', 'reported') DEFAULT 'published',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user (user_id),
  INDEX idx_journal (journal_id),
  INDEX idx_category (category),
  INDEX idx_hot_score (hot_score),
  INDEX idx_created (created_at)
);
```

### 预设分类

- `experience` - 投稿经验
- `discussion` - 学术讨论
- `question` - 求助问答
- `news` - 资讯分享
- `review` - 文献评述
- `other` - 其他

### PostComments 表

```sql
CREATE TABLE post_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id CHAR(36) NOT NULL,
  user_name VARCHAR(100),
  parent_id INT NULL,                   -- 支持 3 层嵌套
  content TEXT NOT NULL,
  like_count INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_post (post_id),
  INDEX idx_user (user_id),
  INDEX idx_parent (parent_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
```

### 关联表

- **post_likes**: 帖子点赞（post_id, user_id）
- **post_favorites**: 帖子收藏
- **post_follows**: 关注帖子（有新评论时通知）
- **post_reports**: 举报（post_id, reporter_id, reason, status）
- **post_comment_likes**: 评论点赞

---

## API 设计

### 路由规划（`/api/posts` 前缀）

```javascript
// 帖子 CRUD
GET    /api/posts                    // 获取列表（筛选、排序、分页）
GET    /api/posts/:id                // 获取详情
POST   /api/posts                    // 发布帖子（需认证）
PUT    /api/posts/:id                // 编辑帖子（作者本人）
DELETE /api/posts/:id                // 删除帖子（作者/管理员）

// 互动功能
POST   /api/posts/:id/like           // 点赞/取消（Toggle）
POST   /api/posts/:id/favorite       // 收藏/取消（Toggle）
POST   /api/posts/:id/follow         // 关注/取消（Toggle）
POST   /api/posts/:id/report         // 举报
POST   /api/posts/:id/view           // 增加浏览计数

// 评论
GET    /api/posts/:id/comments       // 获取评论列表
POST   /api/posts/:id/comments       // 发表评论
PUT    /api/posts/comments/:commentId          // 编辑评论
DELETE /api/posts/comments/:commentId          // 删除评论
POST   /api/posts/comments/:commentId/like     // 评论点赞

// 用户相关
GET    /api/posts/my/posts           // 我的帖子
GET    /api/posts/my/favorites       // 我收藏的
GET    /api/posts/my/follows         // 我关注的

// 管理员
GET    /api/admin/posts/reports      // 举报列表
PUT    /api/admin/posts/reports/:id  // 处理举报
POST   /api/admin/posts/:id/pin      // 置顶
```

### 查询参数（GET /api/posts）

```javascript
{
  category: 'experience',       // 按分类
  tag: '机器学习',              // 按标签
  journalId: 123,               // 关联期刊
  userId: 'uuid',               // 某用户的帖子
  sortBy: 'hot' | 'latest' | 'likes' | 'comments' | 'views',
  page: 1,
  limit: 20,
  search: '关键词'              // 标题+内容搜索
}
```

### 响应格式示例

```json
{
  "id": 1,
  "userId": "uuid",
  "userName": "张三",
  "userAvatar": "url",
  "title": "Nature投稿经验分享",
  "content": "## 背景\n\n我最近...",
  "category": "experience",
  "tags": ["Nature", "投稿经验"],
  "journalId": 5,
  "journalTitle": "Nature",
  "viewCount": 1520,
  "likeCount": 45,
  "commentCount": 23,
  "favoriteCount": 12,
  "followCount": 8,
  "userLiked": true,
  "userFavorited": false,
  "userFollowed": true,
  "createdAt": "2026-03-03T10:00:00Z",
  "updatedAt": "2026-03-03T10:00:00Z"
}
```

---

## 前端设计

### 页面结构

1. **社区首页** (`/community`)
   - 顶部：分类标签栏 + 排序下拉 + 发帖按钮
   - 左侧：筛选面板（分类、标签云）
   - 主区域：帖子卡片列表（无限滚动）
   - 右侧：热门标签、活跃用户

2. **帖子详情页** (`/community/posts/:id`)
   - 帖子头部：标题、作者、分类标签
   - Markdown 渲染内容
   - 互动区：点赞、收藏、关注、举报
   - 关联期刊卡片（如果有）
   - 评论区（3 层嵌套）

3. **发帖页面** (`/community/new`)
   - Markdown 编辑器（左右分屏预览）
   - 标题、分类、标签、关联期刊
   - 草稿保存 + 发布

4. **我的帖子** (`/community/my`)
   - Tab：我发布的、我收藏的、我关注的

### 核心组件

- **PostCard**: 帖子卡片（标题、摘要、统计数据）
- **PostDetail**: 帖子详情（Markdown 渲染）
- **PostForm**: 发帖表单（Markdown 编辑器）
- **PostCommentList**: 评论列表（复用现有样式）
- **PostCommentForm**: 评论表单

### UI 风格（使用 ui-ux-pro-max skill）

- **主题集成**：继承现有 6 个主题
- **设计风格**：玻璃拟态，与期刊列表一致
- **组件库**：Lucide React 图标
- **关键特性**：
  - 卡片式布局 + 悬停效果
  - Markdown 编辑器分屏预览
  - 彩色分类 Badge
  - 互动按钮动画反馈

### 响应式设计

- **桌面端 (>1024px)**: 左中右三栏
- **平板端 (768-1024px)**: 隐藏右侧栏
- **移动端 (<768px)**: 单列布局，筛选改为抽屉

---

## 数据流与状态管理

### Context 设计

```typescript
// PostContext - 全局状态
interface PostContextValue {
  posts: Post[];
  loading: boolean;
  pagination: { page: number; total: number; hasMore: boolean };
  filters: {
    category: string | null;
    tag: string | null;
    sortBy: 'hot' | 'latest' | 'likes' | 'comments' | 'views';
  };

  fetchPosts: (filters?: Filters) => Promise<void>;
  createPost: (data: CreatePostData) => Promise<void>;
  toggleLike: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
  toggleFollow: (id: number) => Promise<void>;
}
```

### 缓存策略

- **帖子列表**：Context 缓存，筛选条件变更时重新请求
- **帖子详情**：进入时请求，退出时保留内存
- **评论列表**：跟随详情请求，新评论本地更新
- **互动状态**：乐观更新（UI 立即响应 + 后台发送请求）

---

## 错误处理与边界情况

### 后端错误

- **404**: 帖子不存在
- **403**: 权限不足（编辑/删除他人帖子）
- **400**: 参数验证失败
- **429**: 频率限制（防刷帖）

### 前端边界处理

1. **空状态**：无帖子时显示插图 + 引导发帖
2. **加载状态**：骨架屏（3-5 个卡片占位）
3. **删除处理**：软删除，显示"[该帖子已被删除]"
4. **内容安全**：Markdown 使用 DOMPurify 防 XSS
5. **举报流程**：选择原因 + 描述 → 提交成功提示
6. **草稿功能**：每 30 秒自动保存到 localStorage
7. **并发冲突**：使用 `updated_at` 乐观锁

### 性能优化

- 图片懒加载
- 虚拟滚动（超过 100 条）
- 防抖搜索（500ms）
- 评论分页（超过 50 条）

---

## 测试策略

### 后端测试（Jest）

- CRUD 操作测试
- 权限验证测试
- Toggle 逻辑测试（点赞/收藏/关注）
- 筛选和排序测试
- 评论嵌套层级限制测试

**覆盖目标**: >80%

### 前端测试（Vitest）

- PostCard 渲染测试
- PostForm 表单验证测试
- Markdown 预览测试
- 乐观更新测试

**覆盖目标**: >70%

### E2E 测试（Playwright）

- 完整发帖流程（登录 → 发帖 → 评论 → 互动）
- 筛选和排序功能
- 帖子详情页交互

**覆盖**: 主要用户流程

---

## 实施计划

### 阶段 1：后端基础（数据模型 + API）
- 创建数据库表和 Sequelize 模型
- 实现帖子 CRUD API
- 实现互动功能 API（点赞/收藏/关注）

### 阶段 2：评论系统
- 实现 PostComment 模型和 API
- 复制期刊评论逻辑，去除评分功能
- 实现评论点赞

### 阶段 3：前端核心功能
- 社区首页（帖子列表 + 筛选排序）
- 帖子详情页
- Markdown 编辑器 + 发帖表单

### 阶段 4：高级功能
- 举报系统
- 管理后台（举报处理、置顶）
- 草稿功能
- 热度算法优化

### 阶段 5：UI/UX 优化（使用 ui-ux-pro-max）
- 玻璃拟态样式
- 响应式布局
- 动画和交互细节
- 主题适配

### 阶段 6：测试与上线
- 后端集成测试
- 前端组件测试
- E2E 测试
- 性能优化

---

## 风险与缓解

### 风险 1：代码重复（评论系统）
**缓解**：严格复用现有组件样式，仅在必要处调整逻辑

### 风险 2：Markdown 编辑器性能
**缓解**：使用成熟的库（如 react-markdown-editor-lite），按需加载

### 风险 3：内容安全（XSS、垃圾信息）
**缓解**：
- DOMPurify 过滤 HTML
- 频率限制防刷
- 举报系统 + 人工审核

### 风险 4：与期刊系统的集成复杂度
**缓解**：
- 期刊详情页增加"相关讨论" Tab
- 发帖时提供期刊搜索选择器
- 数据关联通过 journal_id 实现

---

## 成功指标

- **功能完整性**：所有设计功能 100% 实现
- **测试覆盖率**：后端 >80%，前端 >70%
- **性能指标**：
  - 帖子列表加载 <500ms
  - 帖子详情加载 <800ms
  - Markdown 编辑器流畅度 >30fps
- **用户体验**：响应式设计覆盖 3 种屏幕尺寸

---

## 附录

### Markdown 功能需求

- 标题（H1-H6）
- 列表（有序/无序）
- 代码块（语法高亮）
- 行内代码
- 链接
- 图片（支持上传）
- 引用块
- 加粗/斜体
- 数学公式（LaTeX，可选）

### 热度算法（初版）

```
hot_score = (like_count * 2 + comment_count * 3 + view_count * 0.1)
            / (hours_since_created + 2)^1.5
```

定时任务每小时更新一次。

---

**文档版本**: 1.0
**最后更新**: 2026-03-03
**下一步**: 编写实施计划（调用 writing-plans skill）
