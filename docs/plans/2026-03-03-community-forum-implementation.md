# 社区论坛系统实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在学术期刊评价平台上构建完整的社区论坛功能，支持用户发帖、评论、互动（点赞/收藏/关注）、举报，使用 Markdown 编辑器和玻璃拟态 UI。

**Architecture:** 独立表设计（不修改现有期刊评论系统），后端使用 Sequelize + MySQL，前端使用 React + TypeScript + Context API，评论组件复用现有样式逻辑。

**Tech Stack:** Node.js, Express, Sequelize, MySQL, React, TypeScript, Vite, Lucide React, react-markdown, DOMPurify, Vitest, Jest, Playwright

---

## Phase 1: 后端数据模型与基础 API

### Task 1: 创建 Post 数据模型

**Files:**
- Create: `backend/models/Post.js`
- Modify: `backend/models/index.js:10-15` (添加 Post 关联)

**Step 1: 创建 Post 模型文件**

```javascript
// backend/models/Post.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'user_id'
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: '标题不能为空' },
            len: { args: [1, 200], msg: '标题长度为1-200字符' }
        }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: '内容不能为空' }
        }
    },
    category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            isIn: {
                args: [['experience', 'discussion', 'question', 'news', 'review', 'other']],
                msg: '无效的分类'
            }
        }
    },
    tags: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    journalId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'journal_id'
    },
    viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'view_count'
    },
    likeCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'like_count'
    },
    commentCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'comment_count'
    },
    favoriteCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'favorite_count'
    },
    followCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'follow_count'
    },
    hotScore: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'hot_score'
    },
    isPinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_pinned'
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_deleted'
    },
    status: {
        type: DataTypes.ENUM('published', 'draft', 'reported'),
        defaultValue: 'published'
    }
}, {
    tableName: 'posts',
    indexes: [
        { fields: ['user_id'] },
        { fields: ['journal_id'] },
        { fields: ['category'] },
        { fields: ['hot_score'] },
        { fields: ['created_at'] }
    ]
});

module.exports = Post;
```

**Step 2: 在 models/index.js 中注册 Post 模型**

在 `backend/models/index.js` 文件的模型导入部分添加：

```javascript
const Post = require('./Post');
```

在关联定义部分添加：

```javascript
// Post 关联
Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });
Post.belongsTo(Journal, { foreignKey: 'journalId', as: 'journal' });
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Journal.hasMany(Post, { foreignKey: 'journalId', as: 'relatedPosts' });
```

在导出部分添加：

```javascript
module.exports = {
    // ...existing exports
    Post,
};
```

**Step 3: 测试数据库同步**

Run: `cd backend && npm start`
Expected: 看到 "Executing (default): CREATE TABLE IF NOT EXISTS `posts`" 的 SQL 日志

**Step 4: 验证表结构**

Run (在 MySQL 客户端):
```sql
DESCRIBE posts;
```
Expected: 看到包含 id, user_id, title, content, category等字段的表结构

**Step 5: Commit**

```bash
git add backend/models/Post.js backend/models/index.js
git commit -m "feat(backend): add Post model with Sequelize"
```

---

### Task 2: 创建帖子互动模型（PostLike, PostFavorite, PostFollow）

**Files:**
- Create: `backend/models/PostLike.js`
- Create: `backend/models/PostFavorite.js`
- Create: `backend/models/PostFollow.js`
- Modify: `backend/models/index.js:20-35`

**Step 1: 创建 PostLike 模型**

```javascript
// backend/models/PostLike.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostLike = sequelize.define('PostLike', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'post_id'
    },
    userId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'user_id'
    }
}, {
    tableName: 'post_likes',
    indexes: [
        { unique: true, fields: ['post_id', 'user_id'], name: 'unique_post_like' }
    ]
});

module.exports = PostLike;
```

**Step 2: 创建 PostFavorite 模型**

```javascript
// backend/models/PostFavorite.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostFavorite = sequelize.define('PostFavorite', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'post_id'
    },
    userId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'user_id'
    }
}, {
    tableName: 'post_favorites',
    indexes: [
        { unique: true, fields: ['post_id', 'user_id'], name: 'unique_post_favorite' }
    ]
});

module.exports = PostFavorite;
```

**Step 3: 创建 PostFollow 模型**

```javascript
// backend/models/PostFollow.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostFollow = sequelize.define('PostFollow', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'post_id'
    },
    userId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'user_id'
    }
}, {
    tableName: 'post_follows',
    indexes: [
        { unique: true, fields: ['post_id', 'user_id'], name: 'unique_post_follow' }
    ]
});

module.exports = PostFollow;
```

**Step 4: 在 models/index.js 注册并定义关联**

导入模型：

```javascript
const PostLike = require('./PostLike');
const PostFavorite = require('./PostFavorite');
const PostFollow = require('./PostFollow');
```

定义关联：

```javascript
// PostLike 关联
PostLike.belongsTo(Post, { foreignKey: 'postId', onDelete: 'CASCADE' });
PostLike.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
Post.hasMany(PostLike, { foreignKey: 'postId', as: 'likes' });

// PostFavorite 关联
PostFavorite.belongsTo(Post, { foreignKey: 'postId', onDelete: 'CASCADE' });
PostFavorite.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
Post.hasMany(PostFavorite, { foreignKey: 'postId', as: 'favorites' });

// PostFollow 关联
PostFollow.belongsTo(Post, { foreignKey: 'postId', onDelete: 'CASCADE' });
PostFollow.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
Post.hasMany(PostFollow, { foreignKey: 'postId', as: 'follows' });
```

导出：

```javascript
module.exports = {
    // ...existing
    PostLike,
    PostFavorite,
    PostFollow,
};
```

**Step 5: 测试数据库同步**

Run: `cd backend && npm start`
Expected: 看到 post_likes, post_favorites, post_follows 表创建日志

**Step 6: Commit**

```bash
git add backend/models/PostLike.js backend/models/PostFavorite.js backend/models/PostFollow.js backend/models/index.js
git commit -m "feat(backend): add PostLike, PostFavorite, PostFollow models"
```

---

### Task 3: 创建 PostComment 和 PostCommentLike 模型

**Files:**
- Create: `backend/models/PostComment.js`
- Create: `backend/models/PostCommentLike.js`
- Modify: `backend/models/index.js:40-55`

**Step 1: 创建 PostComment 模型**

```javascript
// backend/models/PostComment.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostComment = sequelize.define('PostComment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'post_id'
    },
    userId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'user_id'
    },
    userName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'user_name'
    },
    parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'parent_id'
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    likeCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'like_count'
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_deleted'
    }
}, {
    tableName: 'post_comments',
    indexes: [
        { fields: ['post_id'] },
        { fields: ['user_id'] },
        { fields: ['parent_id'] }
    ]
});

module.exports = PostComment;
```

**Step 2: 创建 PostCommentLike 模型**

```javascript
// backend/models/PostCommentLike.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostCommentLike = sequelize.define('PostCommentLike', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    commentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'comment_id'
    },
    userId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'user_id'
    }
}, {
    tableName: 'post_comment_likes',
    indexes: [
        { unique: true, fields: ['comment_id', 'user_id'], name: 'unique_post_comment_like' }
    ]
});

module.exports = PostCommentLike;
```

**Step 3: 在 models/index.js 注册并定义关联**

导入：

```javascript
const PostComment = require('./PostComment');
const PostCommentLike = require('./PostCommentLike');
```

关联：

```javascript
// PostComment 关联
PostComment.belongsTo(Post, { foreignKey: 'postId', onDelete: 'CASCADE' });
PostComment.belongsTo(User, { foreignKey: 'userId' });
PostComment.belongsTo(PostComment, { foreignKey: 'parentId', as: 'parent' });
Post.hasMany(PostComment, { foreignKey: 'postId', as: 'comments' });
PostComment.hasMany(PostComment, { foreignKey: 'parentId', as: 'replies' });

// PostCommentLike 关联
PostCommentLike.belongsTo(PostComment, { foreignKey: 'commentId', onDelete: 'CASCADE' });
PostCommentLike.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
PostComment.hasMany(PostCommentLike, { foreignKey: 'commentId', as: 'likes' });
```

导出：

```javascript
module.exports = {
    // ...existing
    PostComment,
    PostCommentLike,
};
```

**Step 4: 测试同步**

Run: `cd backend && npm start`
Expected: 看到 post_comments, post_comment_likes 表创建

**Step 5: Commit**

```bash
git add backend/models/PostComment.js backend/models/PostCommentLike.js backend/models/index.js
git commit -m "feat(backend): add PostComment and PostCommentLike models"
```

---

### Task 4: 创建 PostReport 模型

**Files:**
- Create: `backend/models/PostReport.js`
- Modify: `backend/models/index.js:60-65`

**Step 1: 创建 PostReport 模型**

```javascript
// backend/models/PostReport.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostReport = sequelize.define('PostReport', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'post_id'
    },
    reporterId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'reporter_id'
    },
    reason: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'resolved', 'dismissed'),
        defaultValue: 'pending'
    }
}, {
    tableName: 'post_reports',
    indexes: [
        { fields: ['post_id'] },
        { fields: ['reporter_id'] },
        { fields: ['status'] }
    ]
});

module.exports = PostReport;
```

**Step 2: 在 models/index.js 注册**

```javascript
const PostReport = require('./PostReport');

// 关联
PostReport.belongsTo(Post, { foreignKey: 'postId', onDelete: 'CASCADE' });
PostReport.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
Post.hasMany(PostReport, { foreignKey: 'postId', as: 'reports' });

// 导出
module.exports = {
    // ...existing
    PostReport,
};
```

**Step 3: 测试同步**

Run: `cd backend && npm start`
Expected: 看到 post_reports 表创建

**Step 4: Commit**

```bash
git add backend/models/PostReport.js backend/models/index.js
git commit -m "feat(backend): add PostReport model for content moderation"
```

---

### Task 5: 创建 Post Controller（CRUD 基础）

**Files:**
- Create: `backend/controllers/postController.js`

**Step 1: 创建 Controller 文件框架**

```javascript
// backend/controllers/postController.js
const { Post, User, Journal, PostLike, PostFavorite, PostFollow } = require('../models');
const { Op } = require('sequelize');

// 获取帖子列表（带筛选、排序、分页）
exports.getPosts = async (req, res) => {
    try {
        const {
            category,
            tag,
            journalId,
            userId,
            sortBy = 'hot',
            page = 1,
            limit = 20,
            search
        } = req.query;

        const offset = (page - 1) * limit;
        const where = { isDeleted: false, status: 'published' };

        // 筛选条件
        if (category) where.category = category;
        if (journalId) where.journalId = journalId;
        if (userId) where.userId = userId;
        if (tag) where.tags = { [Op.contains]: [tag] };
        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { content: { [Op.like]: `%${search}%` } }
            ];
        }

        // 排序逻辑
        let order;
        switch (sortBy) {
            case 'latest':
                order = [['createdAt', 'DESC']];
                break;
            case 'likes':
                order = [['likeCount', 'DESC']];
                break;
            case 'comments':
                order = [['commentCount', 'DESC']];
                break;
            case 'views':
                order = [['viewCount', 'DESC']];
                break;
            case 'hot':
            default:
                order = [['hotScore', 'DESC'], ['createdAt', 'DESC']];
        }

        const { count, rows: posts } = await Post.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'avatar']
                },
                {
                    model: Journal,
                    as: 'journal',
                    attributes: ['id', 'title'],
                    required: false
                }
            ],
            order,
            limit: parseInt(limit),
            offset,
            distinct: true
        });

        // 如果用户已登录，附加用户互动状态
        let postsWithUserStatus = posts;
        if (req.user) {
            const postIds = posts.map(p => p.id);
            const [likes, favorites, follows] = await Promise.all([
                PostLike.findAll({ where: { postId: postIds, userId: req.user.id } }),
                PostFavorite.findAll({ where: { postId: postIds, userId: req.user.id } }),
                PostFollow.findAll({ where: { postId: postIds, userId: req.user.id } })
            ]);

            const likedIds = new Set(likes.map(l => l.postId));
            const favoritedIds = new Set(favorites.map(f => f.postId));
            const followedIds = new Set(follows.map(f => f.postId));

            postsWithUserStatus = posts.map(post => ({
                ...post.toJSON(),
                userLiked: likedIds.has(post.id),
                userFavorited: favoritedIds.has(post.id),
                userFollowed: followedIds.has(post.id)
            }));
        }

        res.json({
            posts: postsWithUserStatus,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('获取帖子列表失败:', error);
        res.status(500).json({ error: '获取帖子列表失败' });
    }
};

// 获取单个帖子详情
exports.getPostById = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'avatar', 'bio']
                },
                {
                    model: Journal,
                    as: 'journal',
                    attributes: ['id', 'title', 'issn'],
                    required: false
                }
            ]
        });

        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        if (post.isDeleted) {
            return res.status(404).json({ error: '该帖子已被删除' });
        }

        // 附加用户互动状态
        let postData = post.toJSON();
        if (req.user) {
            const [like, favorite, follow] = await Promise.all([
                PostLike.findOne({ where: { postId: id, userId: req.user.id } }),
                PostFavorite.findOne({ where: { postId: id, userId: req.user.id } }),
                PostFollow.findOne({ where: { postId: id, userId: req.user.id } })
            ]);

            postData.userLiked = !!like;
            postData.userFavorited = !!favorite;
            postData.userFollowed = !!follow;
        }

        res.json(postData);
    } catch (error) {
        console.error('获取帖子详情失败:', error);
        res.status(500).json({ error: '获取帖子详情失败' });
    }
};

// 创建帖子
exports.createPost = async (req, res) => {
    try {
        const { title, content, category, tags, journalId } = req.body;

        // 验证必填字段
        if (!title || !content || !category) {
            return res.status(400).json({ error: '标题、内容和分类为必填项' });
        }

        // 获取用户信息
        const user = await User.findByPk(req.user.id);

        const post = await Post.create({
            userId: req.user.id,
            title,
            content,
            category,
            tags: tags || [],
            journalId: journalId || null
        });

        // 返回完整帖子信息
        const fullPost = await Post.findByPk(post.id, {
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'avatar']
                },
                {
                    model: Journal,
                    as: 'journal',
                    attributes: ['id', 'title'],
                    required: false
                }
            ]
        });

        res.status(201).json(fullPost);
    } catch (error) {
        console.error('创建帖子失败:', error);
        res.status(500).json({ error: '创建帖子失败' });
    }
};

// 更新帖子
exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category, tags, journalId } = req.body;

        const post = await Post.findByPk(id);

        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        // 权限检查：只有作者本人可以编辑
        if (post.userId !== req.user.id) {
            return res.status(403).json({ error: '无权编辑此帖子' });
        }

        await post.update({
            title: title || post.title,
            content: content || post.content,
            category: category || post.category,
            tags: tags !== undefined ? tags : post.tags,
            journalId: journalId !== undefined ? journalId : post.journalId
        });

        const updatedPost = await Post.findByPk(id, {
            include: [
                { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
                { model: Journal, as: 'journal', attributes: ['id', 'title'], required: false }
            ]
        });

        res.json(updatedPost);
    } catch (error) {
        console.error('更新帖子失败:', error);
        res.status(500).json({ error: '更新帖子失败' });
    }
};

// 删除帖子（软删除）
exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findByPk(id);

        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        // 权限检查：作者或管理员可删除
        if (post.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: '无权删除此帖子' });
        }

        await post.update({ isDeleted: true });

        res.json({ message: '帖子已删除' });
    } catch (error) {
        console.error('删除帖子失败:', error);
        res.status(500).json({ error: '删除帖子失败' });
    }
};

// 增加浏览计数
exports.incrementViewCount = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findByPk(id);

        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        await post.increment('viewCount');

        res.json({ viewCount: post.viewCount + 1 });
    } catch (error) {
        console.error('更新浏览计数失败:', error);
        res.status(500).json({ error: '更新浏览计数失败' });
    }
};
```

**Step 2: Commit**

```bash
git add backend/controllers/postController.js
git commit -m "feat(backend): add Post controller with CRUD operations"
```

---

### Task 6: 创建 Post 互动功能 Controller

**Files:**
- Modify: `backend/controllers/postController.js:200-350`

**Step 1: 添加点赞、收藏、关注 Toggle 功能**

在 `postController.js` 末尾添加：

```javascript
// 点赞/取消点赞 (Toggle)
exports.toggleLike = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findByPk(id);
        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        const existingLike = await PostLike.findOne({
            where: { postId: id, userId: req.user.id }
        });

        if (existingLike) {
            // 取消点赞
            await existingLike.destroy();
            await post.decrement('likeCount');
            res.json({ liked: false, likeCount: post.likeCount - 1 });
        } else {
            // 点赞
            await PostLike.create({ postId: id, userId: req.user.id });
            await post.increment('likeCount');
            res.json({ liked: true, likeCount: post.likeCount + 1 });
        }
    } catch (error) {
        console.error('点赞操作失败:', error);
        res.status(500).json({ error: '点赞操作失败' });
    }
};

// 收藏/取消收藏 (Toggle)
exports.toggleFavorite = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findByPk(id);
        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        const existingFavorite = await PostFavorite.findOne({
            where: { postId: id, userId: req.user.id }
        });

        if (existingFavorite) {
            await existingFavorite.destroy();
            await post.decrement('favoriteCount');
            res.json({ favorited: false, favoriteCount: post.favoriteCount - 1 });
        } else {
            await PostFavorite.create({ postId: id, userId: req.user.id });
            await post.increment('favoriteCount');
            res.json({ favorited: true, favoriteCount: post.favoriteCount + 1 });
        }
    } catch (error) {
        console.error('收藏操作失败:', error);
        res.status(500).json({ error: '收藏操作失败' });
    }
};

// 关注/取消关注 (Toggle)
exports.toggleFollow = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findByPk(id);
        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        const existingFollow = await PostFollow.findOne({
            where: { postId: id, userId: req.user.id }
        });

        if (existingFollow) {
            await existingFollow.destroy();
            await post.decrement('followCount');
            res.json({ followed: false, followCount: post.followCount - 1 });
        } else {
            await PostFollow.create({ postId: id, userId: req.user.id });
            await post.increment('followCount');
            res.json({ followed: true, followCount: post.followCount + 1 });
        }
    } catch (error) {
        console.error('关注操作失败:', error);
        res.status(500).json({ error: '关注操作失败' });
    }
};

// 举报帖子
exports.reportPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: '请提供举报原因' });
        }

        const post = await Post.findByPk(id);
        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        await PostReport.create({
            postId: id,
            reporterId: req.user.id,
            reason
        });

        res.json({ message: '举报已提交，我们会尽快处理' });
    } catch (error) {
        console.error('举报失败:', error);
        res.status(500).json({ error: '举报失败' });
    }
};

// 获取我的帖子
exports.getMyPosts = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: posts } = await Post.findAndCountAll({
            where: { userId: req.user.id, isDeleted: false },
            include: [
                { model: Journal, as: 'journal', attributes: ['id', 'title'], required: false }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.json({
            posts,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('获取我的帖子失败:', error);
        res.status(500).json({ error: '获取我的帖子失败' });
    }
};

// 获取我收藏的帖子
exports.getMyFavorites = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: favorites } = await PostFavorite.findAndCountAll({
            where: { userId: req.user.id },
            include: [
                {
                    model: Post,
                    where: { isDeleted: false },
                    include: [
                        { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
                        { model: Journal, as: 'journal', attributes: ['id', 'title'], required: false }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        const posts = favorites.map(f => ({ ...f.Post.toJSON(), userFavorited: true }));

        res.json({
            posts,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('获取收藏列表失败:', error);
        res.status(500).json({ error: '获取收藏列表失败' });
    }
};

// 获取我关注的帖子
exports.getMyFollows = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: follows } = await PostFollow.findAndCountAll({
            where: { userId: req.user.id },
            include: [
                {
                    model: Post,
                    where: { isDeleted: false },
                    include: [
                        { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
                        { model: Journal, as: 'journal', attributes: ['id', 'title'], required: false }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        const posts = follows.map(f => ({ ...f.Post.toJSON(), userFollowed: true }));

        res.json({
            posts,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('获取关注列表失败:', error);
        res.status(500).json({ error: '获取关注列表失败' });
    }
};
```

**Step 2: Commit**

```bash
git add backend/controllers/postController.js
git commit -m "feat(backend): add post interaction features (like/favorite/follow/report)"
```

---

### Task 7: 创建 Post 路由

**Files:**
- Create: `backend/routes/postRoutes.js`
- Modify: `backend/server.js:15-20` (注册路由)

**Step 1: 创建路由文件**

```javascript
// backend/routes/postRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const postController = require('../controllers/postController');

// 公开路由
router.get('/', postController.getPosts);
router.get('/:id', postController.getPostById);

// 需要认证的路由
router.post('/', protect, postController.createPost);
router.put('/:id', protect, postController.updatePost);
router.delete('/:id', protect, postController.deletePost);

// 互动功能
router.post('/:id/like', protect, postController.toggleLike);
router.post('/:id/favorite', protect, postController.toggleFavorite);
router.post('/:id/follow', protect, postController.toggleFollow);
router.post('/:id/report', protect, postController.reportPost);
router.post('/:id/view', postController.incrementViewCount);

// 用户相关
router.get('/my/posts', protect, postController.getMyPosts);
router.get('/my/favorites', protect, postController.getMyFavorites);
router.get('/my/follows', protect, postController.getMyFollows);

module.exports = router;
```

**Step 2: 在 server.js 注册路由**

在 `backend/server.js` 导入路由：

```javascript
const postRoutes = require('./routes/postRoutes');
```

注册路由：

```javascript
app.use('/api/posts', postRoutes);
```

**Step 3: 测试路由注册**

Run: `cd backend && npm start`
Expected: 服务启动无错误

**Step 4: 手动测试 API**

Run:
```bash
curl http://localhost:3001/api/posts
```
Expected: 返回 `{"posts":[],"pagination":{...}}`

**Step 5: Commit**

```bash
git add backend/routes/postRoutes.js backend/server.js
git commit -m "feat(backend): add post routes and register in server"
```

---

## Phase 2: 帖子评论系统

### Task 8: 创建 PostComment Controller

**Files:**
- Create: `backend/controllers/postCommentController.js`

**Step 1: 创建评论 Controller**

```javascript
// backend/controllers/postCommentController.js
const { PostComment, Post, User, PostCommentLike } = require('../models');

// 获取帖子的所有评论
exports.getComments = async (req, res) => {
    try {
        const { postId } = req.params;

        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        const comments = await PostComment.findAll({
            where: { postId },
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'avatar']
                },
                {
                    model: PostComment,
                    as: 'replies',
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'name', 'avatar']
                        },
                        {
                            model: PostComment,
                            as: 'replies',
                            include: [
                                {
                                    model: User,
                                    attributes: ['id', 'name', 'avatar']
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // 只返回顶层评论（parentId 为 null）
        const topLevelComments = comments.filter(c => c.parentId === null);

        // 如果用户已登录，附加点赞状态
        let commentsWithLikeStatus = topLevelComments;
        if (req.user) {
            const allCommentIds = [];
            const collectIds = (comments) => {
                comments.forEach(c => {
                    allCommentIds.push(c.id);
                    if (c.replies) collectIds(c.replies);
                });
            };
            collectIds(topLevelComments);

            const likes = await PostCommentLike.findAll({
                where: { commentId: allCommentIds, userId: req.user.id }
            });
            const likedIds = new Set(likes.map(l => l.commentId));

            const attachLikeStatus = (comments) => {
                return comments.map(c => {
                    const commentData = c.toJSON();
                    commentData.userLiked = likedIds.has(c.id);
                    if (commentData.replies) {
                        commentData.replies = attachLikeStatus(commentData.replies);
                    }
                    return commentData;
                });
            };

            commentsWithLikeStatus = attachLikeStatus(topLevelComments);
        }

        res.json(commentsWithLikeStatus);
    } catch (error) {
        console.error('获取评论失败:', error);
        res.status(500).json({ error: '获取评论失败' });
    }
};

// 发表评论
exports.createComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, parentId } = req.body;

        if (!content) {
            return res.status(400).json({ error: '评论内容不能为空' });
        }

        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        // 检查嵌套层级限制（最多 3 层）
        if (parentId) {
            const parentComment = await PostComment.findByPk(parentId);
            if (!parentComment) {
                return res.status(404).json({ error: '父评论不存在' });
            }

            // 检查父评论的层级
            let depth = 1;
            let current = parentComment;
            while (current.parentId) {
                depth++;
                current = await PostComment.findByPk(current.parentId);
                if (depth >= 3) {
                    return res.status(400).json({ error: '评论嵌套层级不能超过3层' });
                }
            }
        }

        const user = await User.findByPk(req.user.id);

        const comment = await PostComment.create({
            postId,
            userId: req.user.id,
            userName: user.name,
            parentId: parentId || null,
            content
        });

        // 增加帖子评论计数
        await post.increment('commentCount');

        // 返回完整评论信息
        const fullComment = await PostComment.findByPk(comment.id, {
            include: [
                { model: User, attributes: ['id', 'name', 'avatar'] }
            ]
        });

        res.status(201).json(fullComment);
    } catch (error) {
        console.error('发表评论失败:', error);
        res.status(500).json({ error: '发表评论失败' });
    }
};

// 删除评论（软删除）
exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await PostComment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ error: '评论不存在' });
        }

        // 权限检查：作者或管理员可删除
        if (comment.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: '无权删除此评论' });
        }

        await comment.update({ isDeleted: true, content: '[该评论已被删除]' });

        res.json({ message: '评论已删除' });
    } catch (error) {
        console.error('删除评论失败:', error);
        res.status(500).json({ error: '删除评论失败' });
    }
};

// 点赞/取消点赞评论
exports.toggleCommentLike = async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await PostComment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ error: '评论不存在' });
        }

        const existingLike = await PostCommentLike.findOne({
            where: { commentId, userId: req.user.id }
        });

        if (existingLike) {
            await existingLike.destroy();
            await comment.decrement('likeCount');
            res.json({ liked: false, likeCount: comment.likeCount - 1 });
        } else {
            await PostCommentLike.create({ commentId, userId: req.user.id });
            await comment.increment('likeCount');
            res.json({ liked: true, likeCount: comment.likeCount + 1 });
        }
    } catch (error) {
        console.error('评论点赞失败:', error);
        res.status(500).json({ error: '评论点赞失败' });
    }
};
```

**Step 2: Commit**

```bash
git add backend/controllers/postCommentController.js
git commit -m "feat(backend): add PostComment controller with CRUD and like"
```

---

### Task 9: 创建 PostComment 路由

**Files:**
- Modify: `backend/routes/postRoutes.js:25-30`

**Step 1: 在 postRoutes.js 添加评论路由**

在 `backend/routes/postRoutes.js` 文件顶部导入 controller：

```javascript
const postCommentController = require('../controllers/postCommentController');
```

在路由末尾添加：

```javascript
// 评论相关路由
router.get('/:postId/comments', postCommentController.getComments);
router.post('/:postId/comments', protect, postCommentController.createComment);
router.delete('/comments/:commentId', protect, postCommentController.deleteComment);
router.post('/comments/:commentId/like', protect, postCommentController.toggleCommentLike);
```

**Step 2: 测试评论路由**

Run: `cd backend && npm start`
Expected: 无错误

Run:
```bash
curl http://localhost:3001/api/posts/1/comments
```
Expected: 返回 `[]` 或评论数据

**Step 3: Commit**

```bash
git add backend/routes/postRoutes.js
git commit -m "feat(backend): add post comment routes"
```

---

## Phase 3: 前端类型定义与服务层

### Task 10: 创建 TypeScript 类型定义

**Files:**
- Create: `src/features/posts/types/post.ts`

**Step 1: 创建类型定义文件**

```typescript
// src/features/posts/types/post.ts

export type PostCategory = 'experience' | 'discussion' | 'question' | 'news' | 'review' | 'other';

export type PostStatus = 'published' | 'draft' | 'reported';

export interface Post {
  id: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  content: string;
  category: PostCategory;
  tags: string[];
  journalId?: number;
  journalTitle?: string;

  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  followCount: number;
  hotScore: number;

  isPinned: boolean;
  isDeleted: boolean;
  status: PostStatus;

  userLiked?: boolean;
  userFavorited?: boolean;
  userFollowed?: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  id: number;
  postId: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  parentId?: number;
  content: string;
  likeCount: number;
  isDeleted: boolean;
  userLiked?: boolean;
  replies?: PostComment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  category: PostCategory;
  tags: string[];
  journalId?: number;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  category?: PostCategory;
  tags?: string[];
  journalId?: number;
}

export interface CreateCommentData {
  content: string;
  parentId?: number;
}

export interface PostFilters {
  category?: string;
  tag?: string;
  journalId?: number;
  userId?: string;
  sortBy?: 'hot' | 'latest' | 'likes' | 'comments' | 'views';
  page?: number;
  limit?: number;
  search?: string;
}

export interface PostPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  experience: '投稿经验',
  discussion: '学术讨论',
  question: '求助问答',
  news: '资讯分享',
  review: '文献评述',
  other: '其他'
};

export const SORT_OPTIONS = [
  { value: 'hot', label: '综合热度' },
  { value: 'latest', label: '最新发布' },
  { value: 'likes', label: '最多点赞' },
  { value: 'comments', label: '最多回复' },
  { value: 'views', label: '最多浏览' }
];
```

**Step 2: Commit**

```bash
git add src/features/posts/types/post.ts
git commit -m "feat(frontend): add TypeScript type definitions for posts"
```

---

### Task 11: 创建 Post Service (API 客户端)

**Files:**
- Create: `src/features/posts/services/postService.ts`

**Step 1: 创建服务层文件**

```typescript
// src/features/posts/services/postService.ts
import {
  Post,
  PostComment,
  CreatePostData,
  UpdatePostData,
  CreateCommentData,
  PostFilters,
  PostPagination
} from '../types/post';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 获取授权 token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 处理响应
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }
  return response.json();
};

export const postService = {
  // 获取帖子列表
  getPosts: async (filters?: PostFilters): Promise<{ posts: Post[]; pagination: PostPagination }> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_URL}/api/posts?${params}`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  // 获取帖子详情
  getPostById: async (id: number): Promise<Post> => {
    const response = await fetch(`${API_URL}/api/posts/${id}`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  // 创建帖子
  createPost: async (data: CreatePostData): Promise<Post> => {
    const response = await fetch(`${API_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // 更新帖子
  updatePost: async (id: number, data: UpdatePostData): Promise<Post> => {
    const response = await fetch(`${API_URL}/api/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // 删除帖子
  deletePost: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/posts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    await handleResponse(response);
  },

  // 点赞/取消点赞
  toggleLike: async (id: number): Promise<{ liked: boolean; likeCount: number }> => {
    const response = await fetch(`${API_URL}/api/posts/${id}/like`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  // 收藏/取消收藏
  toggleFavorite: async (id: number): Promise<{ favorited: boolean; favoriteCount: number }> => {
    const response = await fetch(`${API_URL}/api/posts/${id}/favorite`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  // 关注/取消关注
  toggleFollow: async (id: number): Promise<{ followed: boolean; followCount: number }> => {
    const response = await fetch(`${API_URL}/api/posts/${id}/follow`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  // 举报帖子
  reportPost: async (id: number, reason: string): Promise<void> => {
    const response = await fetch(`${API_URL}/api/posts/${id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ reason })
    });
    await handleResponse(response);
  },

  // 增加浏览计数
  incrementView: async (id: number): Promise<void> => {
    await fetch(`${API_URL}/api/posts/${id}/view`, {
      method: 'POST'
    });
  },

  // 获取评论列表
  getComments: async (postId: number): Promise<PostComment[]> => {
    const response = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  // 发表评论
  createComment: async (postId: number, data: CreateCommentData): Promise<PostComment> => {
    const response = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // 删除评论
  deleteComment: async (commentId: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/posts/comments/${commentId}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    await handleResponse(response);
  },

  // 点赞/取消点赞评论
  toggleCommentLike: async (commentId: number): Promise<{ liked: boolean; likeCount: number }> => {
    const response = await fetch(`${API_URL}/api/posts/comments/${commentId}/like`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  // 获取我的帖子
  getMyPosts: async (page = 1, limit = 20): Promise<{ posts: Post[]; pagination: PostPagination }> => {
    const response = await fetch(`${API_URL}/api/posts/my/posts?page=${page}&limit=${limit}`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  // 获取我收藏的帖子
  getMyFavorites: async (page = 1, limit = 20): Promise<{ posts: Post[]; pagination: PostPagination }> => {
    const response = await fetch(`${API_URL}/api/posts/my/favorites?page=${page}&limit=${limit}`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  // 获取我关注的帖子
  getMyFollows: async (page = 1, limit = 20): Promise<{ posts: Post[]; pagination: PostPagination }> => {
    const response = await fetch(`${API_URL}/api/posts/my/follows?page=${page}&limit=${limit}`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  }
};
```

**Step 2: Commit**

```bash
git add src/features/posts/services/postService.ts
git commit -m "feat(frontend): add post service API client"
```

---

## Phase 4: 前端 UI 组件（使用 @ui-ux-pro-max skill）

> **Note:** 以下 UI 组件任务需要调用 `@ui-ux-pro-max` skill 来生成符合玻璃拟态风格、响应式设计、主题集成的高质量组件代码。

### Task 12: 创建 PostCard 组件

**Files:**
- Create: `src/features/posts/components/PostCard.tsx`
- Create: `src/features/posts/components/PostCard.css`

**Step 1: 调用 ui-ux-pro-max skill 生成 PostCard 组件**

Prompt for ui-ux-pro-max:
```
创建一个帖子卡片组件 PostCard.tsx，用于在列表中展示帖子摘要。

要求：
- 玻璃拟态风格（glassmorphism），与现有期刊列表卡片风格一致
- 显示：标题（最多2行截断）、摘要（content前150字）、作者头像+名称、分类Badge、标签、统计数据（浏览/点赞/评论数）、发布时间
- 悬停效果：阴影加深、轻微上移
- 响应式布局：桌面端卡片式，移动端紧凑布局
- 使用 Lucide React 图标：Eye（浏览）、Heart（点赞）、MessageCircle（评论）
- 继承现有 6 个主题色彩变量（CSS Variables）
- 分类 Badge 使用不同颜色区分
- 点击卡片跳转到帖子详情页

Props:
- post: Post
- onClick?: (id: number) => void
- compact?: boolean（紧凑模式，用于侧边栏）

技术栈: React + TypeScript + CSS Modules
```

**Step 2: 测试组件渲染**

Create a test file to verify component rendering (manual visual test).

**Step 3: Commit**

```bash
git add src/features/posts/components/PostCard.tsx src/features/posts/components/PostCard.css
git commit -m "feat(frontend): add PostCard component with glassmorphism style"
```

---

### Task 13: 创建 PostList 组件

**Files:**
- Create: `src/features/posts/components/PostList.tsx`
- Create: `src/features/posts/components/PostList.css`

**Step 1: 调用 ui-ux-pro-max skill 生成 PostList 组件**

Prompt for ui-ux-pro-max:
```
创建帖子列表组件 PostList.tsx，展示帖子卡片网格。

要求：
- 使用 PostCard 组件
- 网格布局：桌面端 2 列，平板端 1 列，移动端 1 列
- 加载状态：骨架屏（3-5 个卡片占位）
- 空状态：显示插图 + "暂无帖子，发布第一篇吧" + 发帖按钮
- 错误状态：显示错误信息 + 重试按钮
- 无限滚动或分页（优先无限滚动）
- 使用 Intersection Observer 实现懒加载

Props:
- posts: Post[]
- loading: boolean
- error: string | null
- hasMore: boolean
- onLoadMore: () => void
- onRetry: () => void

技术栈: React + TypeScript + CSS
```

**Step 2: Commit**

```bash
git add src/features/posts/components/PostList.tsx src/features/posts/components/PostList.css
git commit -m "feat(frontend): add PostList component with infinite scroll"
```

---

### Task 14: 创建 PostDetail 组件

**Files:**
- Create: `src/features/posts/components/PostDetail.tsx`
- Create: `src/features/posts/components/PostDetail.css`

**Step 1: 调用 ui-ux-pro-max skill 生成 PostDetail 组件**

Prompt for ui-ux-pro-max:
```
创建帖子详情组件 PostDetail.tsx，展示完整帖子内容。

要求：
- 玻璃拟态容器
- 头部区域：标题（H1）、作者头像+名称+发布时间、分类Badge、标签列表
- 正文区域：使用 react-markdown 渲染 Markdown 内容，支持代码高亮（使用 prism-react-renderer）
- 互动按钮栏：点赞（Heart）、收藏（Bookmark）、关注（Bell）、举报（Flag）按钮，显示统计数字
- 关联期刊卡片：如果 journalId 存在，显示期刊信息卡片（可点击跳转）
- 加载状态：骨架屏
- 错误状态：显示错误信息
- 使用 DOMPurify 对 Markdown 渲染结果进行 XSS 防护

Props:
- postId: number
- onLike: () => void
- onFavorite: () => void
- onFollow: () => void
- onReport: () => void

技术栈: React + TypeScript + react-markdown + DOMPurify
```

**Step 2: 安装依赖**

Run:
```bash
npm install react-markdown remark-gfm prism-react-renderer dompurify
npm install --save-dev @types/dompurify
```

**Step 3: Commit**

```bash
git add src/features/posts/components/PostDetail.tsx src/features/posts/components/PostDetail.css package.json package-lock.json
git commit -m "feat(frontend): add PostDetail component with Markdown rendering"
```

---

### Task 15: 创建 PostForm 组件（Markdown 编辑器）

**Files:**
- Create: `src/features/posts/components/PostForm.tsx`
- Create: `src/features/posts/components/PostForm.css`

**Step 1: 调用 ui-ux-pro-max skill 生成 PostForm 组件**

Prompt for ui-ux-pro-max:
```
创建发帖表单组件 PostForm.tsx，包含 Markdown 编辑器。

要求：
- 双栏布局：左侧编辑器、右侧实时预览（响应式：移动端改为 Tab 切换）
- 标题输入框：单行，最多 200 字符，实时字数提示
- Markdown 编辑器：多行文本框，工具栏包含常用格式按钮（加粗、代码块、列表、链接、图片等）
- 实时预览：使用 react-markdown 渲染
- 分类选择器：下拉菜单，6 个预设分类
- 标签输入：支持输入多个标签（回车或逗号分隔），显示为 Badge，可删除
- 关联期刊：可选，搜索框（异步搜索期刊）
- 草稿自动保存：每 30 秒保存到 localStorage
- 草稿恢复提示：组件挂载时检测 localStorage，弹窗询问是否恢复
- 表单验证：标题、内容、分类为必填项
- 提交按钮：发布/保存草稿
- 玻璃拟态样式

Props:
- mode: 'create' | 'edit'
- initialData?: Partial<Post>
- onSubmit: (data: CreatePostData) => void
- onCancel: () => void

技术栈: React + TypeScript + react-markdown
```

**Step 2: Commit**

```bash
git add src/features/posts/components/PostForm.tsx src/features/posts/components/PostForm.css
git commit -m "feat(frontend): add PostForm with Markdown editor and draft autosave"
```

---

### Task 16: 创建 PostCommentList 和 PostCommentForm 组件

**Files:**
- Create: `src/features/posts/components/PostCommentList.tsx`
- Create: `src/features/posts/components/PostCommentForm.tsx`
- Create: `src/features/posts/components/PostCommentItem.tsx`
- Create: `src/features/posts/components/PostComment.css`

**Step 1: 复制现有评论组件并调整**

从 `src/features/comments/` 复制以下文件：
- `CommentList.tsx` → `PostCommentList.tsx`
- `CommentForm.tsx` → `PostCommentForm.tsx`
- `CommentItem.tsx` → `PostCommentItem.tsx`
- `Comment.css` → `PostComment.css`

**Step 2: 调整代码**

删除评分相关代码（dimensionRatings），保留：
- 3 层嵌套结构
- 点赞功能
- 回复功能
- 软删除显示

**Step 3: Commit**

```bash
git add src/features/posts/components/PostComment*.tsx src/features/posts/components/PostComment.css
git commit -m "feat(frontend): add PostComment components (copied from journal comments)"
```

---

## Phase 5: 前端路由与页面

### Task 17: 创建社区首页

**Files:**
- Create: `src/features/posts/pages/CommunityPage.tsx`
- Create: `src/features/posts/pages/CommunityPage.css`
- Modify: `src/App.tsx:20-25` (添加路由)

**Step 1: 调用 ui-ux-pro-max skill 生成 CommunityPage**

Prompt:
```
创建社区首页 CommunityPage.tsx，三栏布局。

要求：
- 顶部栏：分类标签快速筛选 + 排序下拉菜单 + 发帖按钮（右侧）
- 左侧栏（桌面端）：筛选面板（分类列表、标签云）
- 中间主区域：PostList 组件
- 右侧栏（桌面端）：热门标签、活跃用户
- 响应式：平板隐藏右侧栏，移动端筛选改为抽屉
- 使用 PostContext 管理状态
- 玻璃拟态容器

技术栈: React + TypeScript
```

**Step 2: 在 App.tsx 添加路由**

```typescript
import CommunityPage from './features/posts/pages/CommunityPage';

// 在路由配置中添加
<Route path="/community" element={<CommunityPage />} />
```

**Step 3: 在 TopBar 添加"社区讨论"导航链接**

**Step 4: Commit**

```bash
git add src/features/posts/pages/CommunityPage.tsx src/features/posts/pages/CommunityPage.css src/App.tsx
git commit -m "feat(frontend): add CommunityPage with three-column layout"
```

---

### Task 18: 创建帖子详情页

**Files:**
- Create: `src/features/posts/pages/PostDetailPage.tsx`
- Modify: `src/App.tsx:26-27`

**Step 1: 创建 PostDetailPage**

```typescript
// src/features/posts/pages/PostDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PostDetail from '../components/PostDetail';
import PostCommentList from '../components/PostCommentList';
import PostCommentForm from '../components/PostCommentForm';
import { postService } from '../services/postService';
import { Post, PostComment } from '../types/post';

const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [postData, commentsData] = await Promise.all([
          postService.getPostById(parseInt(id)),
          postService.getComments(parseInt(id))
        ]);
        setPost(postData);
        setComments(commentsData);

        // 增加浏览计数
        postService.incrementView(parseInt(id));
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleLike = async () => {
    if (!post) return;
    try {
      const result = await postService.toggleLike(post.id);
      setPost({ ...post, userLiked: result.liked, likeCount: result.likeCount });
    } catch (err) {
      console.error('点赞失败:', err);
    }
  };

  const handleFavorite = async () => {
    if (!post) return;
    try {
      const result = await postService.toggleFavorite(post.id);
      setPost({ ...post, userFavorited: result.favorited, favoriteCount: result.favoriteCount });
    } catch (err) {
      console.error('收藏失败:', err);
    }
  };

  const handleFollow = async () => {
    if (!post) return;
    try {
      const result = await postService.toggleFollow(post.id);
      setPost({ ...post, userFollowed: result.followed, followCount: result.followCount });
    } catch (err) {
      console.error('关注失败:', err);
    }
  };

  const handleReport = async () => {
    if (!post) return;
    const reason = prompt('请输入举报原因：');
    if (!reason) return;

    try {
      await postService.reportPost(post.id, reason);
      alert('举报已提交，我们会尽快处理');
    } catch (err) {
      console.error('举报失败:', err);
    }
  };

  const handleAddComment = async (content: string, parentId?: number) => {
    if (!post) return;

    try {
      const newComment = await postService.createComment(post.id, { content, parentId });
      setComments([...comments, newComment]);
      setPost({ ...post, commentCount: post.commentCount + 1 });
    } catch (err) {
      console.error('发表评论失败:', err);
      throw err;
    }
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  if (!post) return <div>帖子不存在</div>;

  return (
    <div className="post-detail-page">
      <PostDetail
        postId={post.id}
        onLike={handleLike}
        onFavorite={handleFavorite}
        onFollow={handleFollow}
        onReport={handleReport}
      />
      <div className="comments-section">
        <h2>评论 ({post.commentCount})</h2>
        <PostCommentForm onSubmit={(content) => handleAddComment(content)} />
        <PostCommentList comments={comments} postId={post.id} />
      </div>
    </div>
  );
};

export default PostDetailPage;
```

**Step 2: 添加路由**

```typescript
// src/App.tsx
<Route path="/community/posts/:id" element={<PostDetailPage />} />
```

**Step 3: Commit**

```bash
git add src/features/posts/pages/PostDetailPage.tsx src/App.tsx
git commit -m "feat(frontend): add PostDetailPage with comments section"
```

---

### Task 19: 创建发帖页面

**Files:**
- Create: `src/features/posts/pages/NewPostPage.tsx`
- Modify: `src/App.tsx:28-29`

**Step 1: 创建 NewPostPage**

```typescript
// src/features/posts/pages/NewPostPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PostForm from '../components/PostForm';
import { postService } from '../services/postService';
import { CreatePostData } from '../types/post';

const NewPostPage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreatePostData) => {
    try {
      setSubmitting(true);
      setError(null);
      const post = await postService.createPost(data);

      // 清除草稿
      localStorage.removeItem('post-draft');

      // 跳转到帖子详情页
      navigate(`/community/posts/${post.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败');
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/community');
  };

  return (
    <div className="new-post-page">
      <h1>发布新帖</h1>
      {error && <div className="error-message">{error}</div>}
      <PostForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default NewPostPage;
```

**Step 2: 添加路由**

```typescript
// src/App.tsx
<Route path="/community/new" element={<NewPostPage />} />
```

**Step 3: Commit**

```bash
git add src/features/posts/pages/NewPostPage.tsx src/App.tsx
git commit -m "feat(frontend): add NewPostPage for creating posts"
```

---

## Phase 6: PostContext 状态管理

### Task 20: 创建 PostContext

**Files:**
- Create: `src/contexts/PostContext.tsx`
- Modify: `src/App.tsx:10-15` (添加 Provider)

**Step 1: 创建 Context 文件**

```typescript
// src/contexts/PostContext.tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Post, PostFilters, PostPagination } from '../features/posts/types/post';
import { postService } from '../features/posts/services/postService';

interface PostContextValue {
  posts: Post[];
  loading: boolean;
  error: string | null;
  pagination: PostPagination | null;
  filters: PostFilters;

  fetchPosts: (filters?: PostFilters) => Promise<void>;
  setFilters: (filters: Partial<PostFilters>) => void;
  resetFilters: () => void;
  loadMore: () => Promise<void>;
}

const PostContext = createContext<PostContextValue | undefined>(undefined);

const initialFilters: PostFilters = {
  sortBy: 'hot',
  page: 1,
  limit: 20
};

export const PostProvider = ({ children }: { children: ReactNode }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PostPagination | null>(null);
  const [filters, setFiltersState] = useState<PostFilters>(initialFilters);

  const fetchPosts = useCallback(async (newFilters?: PostFilters) => {
    try {
      setLoading(true);
      setError(null);

      const filtersToUse = newFilters || filters;
      const { posts: fetchedPosts, pagination: paginationData } = await postService.getPosts(filtersToUse);

      if (filtersToUse.page === 1) {
        setPosts(fetchedPosts);
      } else {
        setPosts(prev => [...prev, ...fetchedPosts]);
      }

      setPagination(paginationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载帖子失败');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const setFilters = useCallback((newFilters: Partial<PostFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFiltersState(updatedFilters);
    fetchPosts(updatedFilters);
  }, [filters, fetchPosts]);

  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters);
    fetchPosts(initialFilters);
  }, [fetchPosts]);

  const loadMore = useCallback(async () => {
    if (!pagination || pagination.page >= pagination.totalPages) return;

    const nextPage = pagination.page + 1;
    const updatedFilters = { ...filters, page: nextPage };
    setFiltersState(updatedFilters);
    await fetchPosts(updatedFilters);
  }, [pagination, filters, fetchPosts]);

  const value: PostContextValue = {
    posts,
    loading,
    error,
    pagination,
    filters,
    fetchPosts,
    setFilters,
    resetFilters,
    loadMore
  };

  return <PostContext.Provider value={value}>{children}</PostContext.Provider>;
};

export const usePost = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePost must be used within PostProvider');
  }
  return context;
};
```

**Step 2: 在 App.tsx 添加 Provider**

```typescript
import { PostProvider } from './contexts/PostContext';

// 在 App 组件中包裹
<PostProvider>
  {/* 现有的路由组件 */}
</PostProvider>
```

**Step 3: Commit**

```bash
git add src/contexts/PostContext.tsx src/App.tsx
git commit -m "feat(frontend): add PostContext for global state management"
```

---

## Phase 7: 测试

### Task 21: 后端集成测试

**Files:**
- Create: `backend/__tests__/integration/post.test.js`

**Step 1: 创建测试文件**

```javascript
// backend/__tests__/integration/post.test.js
const request = require('supertest');
const app = require('../../server');
const { Post, User } = require('../../models');

let userToken;
let userId;
let postId;

beforeAll(async () => {
  // 创建测试用户并登录
  const user = await User.create({
    id: require('uuid').v4(),
    email: 'posttest@example.com',
    password: 'hashedpassword',
    name: 'Post Tester'
  });
  userId = user.id;

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: 'posttest@example.com', password: 'hashedpassword' });

  userToken = loginResponse.body.token;
});

describe('POST /api/posts', () => {
  it('should create a new post with valid data', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: '测试帖子',
        content: '## 测试内容\n\n这是一个测试帖子',
        category: 'discussion',
        tags: ['测试', 'Jest']
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('测试帖子');
    expect(response.body.category).toBe('discussion');
    postId = response.body.id;
  });

  it('should reject post creation without authentication', async () => {
    const response = await request(app)
      .post('/api/posts')
      .send({ title: '测试', content: '内容', category: 'discussion' });

    expect(response.status).toBe(401);
  });

  it('should reject post with missing required fields', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: '测试' });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/posts', () => {
  it('should get posts list with pagination', async () => {
    const response = await request(app).get('/api/posts?page=1&limit=10');

    expect(response.status).toBe(200);
    expect(response.body.posts).toBeInstanceOf(Array);
    expect(response.body.pagination).toHaveProperty('total');
  });

  it('should filter posts by category', async () => {
    const response = await request(app).get('/api/posts?category=discussion');

    expect(response.status).toBe(200);
    expect(response.body.posts.every(p => p.category === 'discussion')).toBe(true);
  });
});

describe('POST /api/posts/:id/like', () => {
  it('should toggle like status', async () => {
    // 第一次点赞
    let response = await request(app)
      .post(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.liked).toBe(true);

    // 取消点赞
    response = await request(app)
      .post(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.liked).toBe(false);
  });
});

afterAll(async () => {
  // 清理测试数据
  await Post.destroy({ where: { userId } });
  await User.destroy({ where: { id: userId } });
});
```

**Step 2: 运行测试**

Run: `cd backend && npm test -- post.test.js`
Expected: 所有测试通过

**Step 3: Commit**

```bash
git add backend/__tests__/integration/post.test.js
git commit -m "test(backend): add integration tests for post API"
```

---

### Task 22: 前端组件测试

**Files:**
- Create: `src/features/posts/components/__tests__/PostCard.test.tsx`

**Step 1: 创建测试文件**

```typescript
// src/features/posts/components/__tests__/PostCard.test.tsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from '../PostCard';
import { Post } from '../../types/post';

const mockPost: Post = {
  id: 1,
  userId: 'user-1',
  userName: '测试用户',
  userAvatar: 'avatar.jpg',
  title: '测试帖子标题',
  content: '这是测试帖子的内容，用于验证组件渲染是否正确。',
  category: 'discussion',
  tags: ['测试', 'React'],
  viewCount: 100,
  likeCount: 10,
  commentCount: 5,
  favoriteCount: 3,
  followCount: 2,
  hotScore: 50,
  isPinned: false,
  isDeleted: false,
  status: 'published',
  createdAt: '2026-03-03T10:00:00Z',
  updatedAt: '2026-03-03T10:00:00Z'
};

describe('PostCard', () => {
  it('should render post title and basic info', () => {
    render(
      <BrowserRouter>
        <PostCard post={mockPost} />
      </BrowserRouter>
    );

    expect(screen.getByText('测试帖子标题')).toBeInTheDocument();
    expect(screen.getByText('测试用户')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // likeCount
  });

  it('should display category badge', () => {
    render(
      <BrowserRouter>
        <PostCard post={mockPost} />
      </BrowserRouter>
    );

    expect(screen.getByText('学术讨论')).toBeInTheDocument();
  });

  it('should display tags', () => {
    render(
      <BrowserRouter>
        <PostCard post={mockPost} />
      </BrowserRouter>
    );

    expect(screen.getByText('测试')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });
});
```

**Step 2: 运行测试**

Run: `npm test -- PostCard.test.tsx`
Expected: 所有测试通过

**Step 3: Commit**

```bash
git add src/features/posts/components/__tests__/PostCard.test.tsx
git commit -m "test(frontend): add PostCard component tests"
```

---

## Phase 8: E2E 测试

### Task 23: E2E 测试 - 完整发帖流程

**Files:**
- Create: `e2e/tests/community-posts.spec.ts`

**Step 1: 创建 E2E 测试文件**

```typescript
// e2e/tests/community-posts.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Community Forum', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('http://localhost:3000/login');
    await page.fill('[name=email]', 'test@example.com');
    await page.fill('[name=password]', 'password');
    await page.click('button[type=submit]');
    await page.waitForURL('http://localhost:3000/');
  });

  test('should create a new post', async ({ page }) => {
    // 进入社区
    await page.click('text=社区讨论');
    await expect(page).toHaveURL(/\/community/);

    // 点击发帖按钮
    await page.click('text=发布帖子');
    await expect(page).toHaveURL(/\/community\/new/);

    // 填写表单
    await page.fill('[name=title]', 'E2E 测试帖子');
    await page.fill('textarea[name=content]', '## 测试内容\n\n这是一个 E2E 测试帖子');
    await page.selectOption('select[name=category]', 'discussion');
    await page.fill('[name=tags]', '测试,E2E');
    await page.press('[name=tags]', 'Enter');

    // 发布
    await page.click('button:has-text("发布")');

    // 验证跳转到详情页
    await expect(page).toHaveURL(/\/community\/posts\/\d+/);
    await expect(page.locator('h1')).toHaveText('E2E 测试帖子');
  });

  test('should like and favorite a post', async ({ page }) => {
    await page.goto('http://localhost:3000/community');

    // 点击第一个帖子
    await page.click('.post-card >> nth=0');

    // 点赞
    const likeButton = page.locator('button[aria-label=点赞]');
    await likeButton.click();
    await expect(page.locator('.like-count')).toContainText('1');

    // 收藏
    const favoriteButton = page.locator('button[aria-label=收藏]');
    await favoriteButton.click();
    await expect(favoriteButton).toHaveClass(/favorited/);
  });

  test('should add a comment', async ({ page }) => {
    await page.goto('http://localhost:3000/community');
    await page.click('.post-card >> nth=0');

    // 发表评论
    await page.fill('textarea[placeholder*=评论]', '这是一条测试评论');
    await page.click('text=发表评论');

    // 验证评论出现
    await expect(page.locator('.comment-list')).toContainText('这是一条测试评论');
  });

  test('should filter posts by category', async ({ page }) => {
    await page.goto('http://localhost:3000/community');

    // 点击分类筛选
    await page.click('text=学术讨论');

    // 验证所有帖子都是该分类
    const categoryBadges = page.locator('.category-badge');
    await expect(categoryBadges.first()).toHaveText('学术讨论');
  });
});
```

**Step 2: 运行 E2E 测试**

Run: `npm run test:e2e -- community-posts.spec.ts`
Expected: 所有测试通过

**Step 3: Commit**

```bash
git add e2e/tests/community-posts.spec.ts
git commit -m "test(e2e): add community forum E2E tests"
```

---

## Phase 9: 管理后台功能（举报处理）

### Task 24: 创建管理员举报处理 API

**Files:**
- Modify: `backend/controllers/adminController.js:200-300`
- Modify: `backend/routes/adminRoutes.js:20-25`

**Step 1: 在 adminController.js 添加举报处理功能**

```javascript
// backend/controllers/adminController.js (末尾添加)
const { PostReport, Post } = require('../models');

// 获取举报列表
exports.getPostReports = async (req, res) => {
    try {
        const { status = 'pending', page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: reports } = await PostReport.findAndCountAll({
            where: status !== 'all' ? { status } : {},
            include: [
                {
                    model: Post,
                    attributes: ['id', 'title', 'userId']
                },
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.json({
            reports,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('获取举报列表失败:', error);
        res.status(500).json({ error: '获取举报列表失败' });
    }
};

// 处理举报
exports.handlePostReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'resolve' or 'dismiss'

        const report = await PostReport.findByPk(id);
        if (!report) {
            return res.status(404).json({ error: '举报不存在' });
        }

        if (action === 'resolve') {
            // 标记帖子为已举报
            const post = await Post.findByPk(report.postId);
            if (post) {
                await post.update({ status: 'reported' });
            }
            await report.update({ status: 'resolved' });
        } else if (action === 'dismiss') {
            await report.update({ status: 'dismissed' });
        } else {
            return res.status(400).json({ error: '无效的操作' });
        }

        res.json({ message: '举报处理成功', report });
    } catch (error) {
        console.error('处理举报失败:', error);
        res.status(500).json({ error: '处理举报失败' });
    }
};

// 置顶帖子
exports.pinPost = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findByPk(id);
        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        await post.update({ isPinned: !post.isPinned });

        res.json({ message: post.isPinned ? '已置顶' : '已取消置顶', post });
    } catch (error) {
        console.error('置顶操作失败:', error);
        res.status(500).json({ error: '置顶操作失败' });
    }
};
```

**Step 2: 在 adminRoutes.js 添加路由**

```javascript
// backend/routes/adminRoutes.js
router.get('/posts/reports', adminAuth, adminController.getPostReports);
router.put('/posts/reports/:id', adminAuth, adminController.handlePostReport);
router.post('/posts/:id/pin', adminAuth, adminController.pinPost);
```

**Step 3: Commit**

```bash
git add backend/controllers/adminController.js backend/routes/adminRoutes.js
git commit -m "feat(admin): add post report management and pin功能"
```

---

## 总结与文档更新

### Task 25: 更新 CLAUDE.md 文档

**Files:**
- Modify: `CLAUDE.md:100-150`

**Step 1: 在 CLAUDE.md 添加社区论坛模块说明**

在"功能模块导航"部分添加：

```markdown
### 📝 社区论坛 (New)
**状态**: ✅ 已完成
**功能**: 学术讨论发帖、Markdown 编辑器、评论系统、点赞/收藏/关注、举报
**关键文件**:
- 前端: `src/features/posts/`（含 PostCard, PostDetail, PostForm, PostCommentList）
- 后端: `backend/routes/postRoutes.js`, `backend/controllers/postController.js`, `backend/controllers/postCommentController.js`
- 模型: `backend/models/Post.js`, `backend/models/PostComment.js`, 等7个模型
- 路由: `/api/posts/*`
```

在项目结构部分更新：

```markdown
backend/models/
├── Post.js
├── PostComment.js
├── PostLike.js
├── PostFavorite.js
├── PostFollow.js
├── PostReport.js
└── PostCommentLike.js

src/features/posts/
├── components/
│   ├── PostList.tsx
│   ├── PostCard.tsx
│   ├── PostDetail.tsx
│   ├── PostForm.tsx
│   ├── PostCommentList.tsx
│   └── PostCommentForm.tsx
├── pages/
│   ├── CommunityPage.tsx
│   ├── PostDetailPage.tsx
│   └── NewPostPage.tsx
├── services/postService.ts
└── types/post.ts
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with community forum documentation"
```

---

## 执行计划完成

所有任务已完成！社区论坛系统现已实现：

✅ 后端数据模型（7 个表）
✅ 后端 API（帖子 CRUD、互动、评论、举报）
✅ 前端 UI 组件（PostCard, PostDetail, PostForm, 评论组件）
✅ 前端页面（社区首页、帖子详情、发帖页）
✅ 状态管理（PostContext）
✅ 测试（后端集成测试、前端组件测试、E2E 测试）
✅ 管理后台（举报处理、置顶）
✅ 文档更新（CLAUDE.md）

---

**文档版本**: 1.0
**创建日期**: 2026-03-03
**预计工作量**: 20-25 小时（含 UI 设计和测试）
