# API 文档

所有需要认证的路由需要 `Authorization: Bearer <token>` 头。

## 认证 `/api/auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/register` | 用户注册 |
| POST | `/login` | 用户登录 |
| GET | `/me` | 获取当前用户 |

## 用户 `/api/users`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/:id` | 获取用户信息 |
| PUT | `/profile` | 更新个人资料 |
| PUT | `/avatar` | 更新头像 |

## 期刊 `/api/journals`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 获取期刊列表 |
| GET | `/:id` | 获取期刊详情 |
| GET | `/search` | 搜索期刊 |
| GET | `/categories` | 获取分类列表 |

## 评论 `/api/comments`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/journal/:journalId` | 获取期刊评论 |
| POST | `/` | 发表评论 |
| DELETE | `/:id` | 删除评论 |
| POST | `/:id/like` | 点赞/取消 |

## 帖子 `/api/posts`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 获取帖子列表 |
| GET | `/:id` | 获取帖子详情 |
| POST | `/` | 创建帖子 |
| PUT | `/:id` | 更新帖子 |
| DELETE | `/:id` | 删除帖子 |
| POST | `/:id/like` | 点赞/取消 |
| POST | `/:id/favorite` | 收藏/取消 |
| POST | `/:id/follow` | 关注/取消 |
| POST | `/:id/report` | 举报 |
| GET | `/:postId/comments` | 获取评论 |
| POST | `/:postId/comments` | 发表评论 |

## 公告 `/api/announcements`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/banners` | 获取横幅公告 |
| GET | `/` | 获取公告列表 |
| GET | `/unread-count` | 未读数量 |
| GET | `/:id` | 公告详情 |
| POST | `/:id/read` | 标记已读 |
| POST | `/read-all` | 全部已读 |

## 收藏 `/api/favorites`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 获取收藏列表 |
| POST | `/:journalId` | 添加收藏 |
| DELETE | `/:journalId` | 取消收藏 |

## 关注 `/api/follows`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/following` | 关注列表 |
| GET | `/followers` | 粉丝列表 |
| POST | `/:userId` | 关注用户 |
| DELETE | `/:userId` | 取消关注 |

## 徽章 `/api/badges`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 获取徽章列表 |
| GET | `/user/:userId` | 用户徽章 |

## 管理 `/api/admin`

需要 admin 或 superadmin 权限。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/stats` | 统计数据 |
| GET | `/users` | 用户列表 |
| PUT | `/users/:id` | 更新用户 |
| DELETE | `/users/:id` | 删除用户 |
| POST | `/journals` | 创建期刊 |
| PUT | `/journals/:id` | 更新期刊 |
| DELETE | `/journals/:id` | 删除期刊 |
| GET | `/comments` | 评论列表 |
| DELETE | `/comments/:id` | 删除评论 |
| GET | `/announcements` | 公告列表 |
| POST | `/announcements` | 创建公告 |
| PUT | `/announcements/:id` | 更新公告 |
| PUT | `/announcements/:id/publish` | 发布公告 |
| PUT | `/announcements/:id/archive` | 归档公告 |
| DELETE | `/announcements/:id` | 删除公告 |

## 数据库 `/api/database`

需要 superadmin 权限。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/tables` | 获取表列表 |
| GET | `/tables/:name/structure` | 表结构 |
| GET | `/tables/:name/data` | 表数据 |
| PUT | `/tables/:name/:id` | 更新行 |
| DELETE | `/tables/:name/:id` | 删除行 |
