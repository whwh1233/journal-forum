# Seed 数据生成脚本设计

## 目标

为本地开发环境生成仿真数据，模拟真实用户使用场景（发帖、评论、互动等），用于开发调试和演示。

## 约束

- **期刊数据不造假** — 使用数据库中已有的真实期刊
- **数据可清理** — seed 用户邮箱统一用 `seed-xxx@test.com`，支持按标记精准清除
- **中文仿真** — 使用 `@faker-js/faker` 中文 locale 生成多样化内容

## 数据规模（小规模）

| 模块 | 数量 | 说明 |
|------|------|------|
| 用户 | 50 | 含 1 个 admin、1 个 superadmin |
| 期刊评论/评分 | ~200 | 对已有期刊的多维评分 + 评论文本 |
| 社区帖子 | ~100 | 各分类分布 |
| 帖子评论 | ~300 | 含嵌套回复（最多 3 层） |
| 帖子互动 | 随机 | 点赞、收藏、关注帖子 |
| 用户关注 | 随机 | 用户之间互相关注 |
| 期刊收藏 | 随机 | 收藏已有期刊 |
| 投稿记录 | ~80 | 稿件 + 投稿 + 状态变更历史 |
| 公告 | 5 | 不同类型和状态 |

## 文件结构

```
backend/
├── scripts/
│   └── seed.js                    # 主入口
│   └── seedData/
│       ├── users.js               # 用户生成
│       ├── comments.js            # 期刊评论/评分
│       ├── posts.js               # 帖子 + 帖子评论
│       ├── interactions.js        # 点赞/收藏/关注（帖子+期刊+用户）
│       ├── submissions.js         # 投稿记录 + 状态历史
│       └── announcements.js       # 公告
```

## 运行方式

```bash
npm run seed           # 灌入 seed 数据
npm run seed:reset     # 清除所有 seed 数据
```

## 执行顺序

按外键依赖排序：

1. **用户** — 其他所有数据依赖用户
2. **期刊评论/评分** — 依赖用户 + 已有期刊
3. **帖子** — 依赖用户
4. **帖子评论** — 依赖用户 + 帖子
5. **投稿记录** — 依赖用户 + 已有期刊（Manuscript → Submission → StatusHistory）
6. **互动数据** — 依赖用户 + 帖子 + 期刊（点赞/收藏/关注）
7. **公告** — 依赖 admin 用户

## 数据标记与清理

### 标记规则

- seed 用户邮箱：`seed-{index}@test.com`
- seed 帖子标题前无需加标记（通过 userId 关联到 seed 用户即可）

### 清理策略

`seed:reset` 按以下顺序删除（尊重 FK 约束）：

1. 查找所有 `seed-*@test.com` 用户 ID
2. 按 userId 删除：公告读取记录、评论点赞、帖子评论点赞、帖子评论、帖子互动（点赞/收藏/关注）、帖子、期刊评论、期刊收藏、用户关注、投稿状态历史、投稿、稿件
3. 删除 seed 公告（creatorId 是 seed admin）
4. 删除 seed 用户本身

## 各模块详细设计

### 1. 用户 (users.js)

生成 50 个用户：

| 字段 | 生成方式 |
|------|----------|
| email | `seed-{i}@test.com` |
| password | 统一 `SeedPass123!`（bcrypt hash） |
| name | faker.zh_CN 中文姓名 |
| avatar | null（使用默认头像） |
| bio | faker 生成的中文简介 |
| institution | 从预设的中国高校列表随机选 |
| role | 48 个 user + 1 个 admin + 1 个 superadmin |
| status | active |

### 2. 期刊评论/评分 (comments.js)

对已有期刊生成约 200 条评论：

| 字段 | 生成方式 |
|------|----------|
| userId | 随机 seed 用户 |
| journalId | 从 DB 查询已有期刊，随机选择 |
| content | 从学术评价模板库随机组合 |
| dimensionRatings | 5 个维度各随机 1-5 分 |
| parentId | 约 30% 的评论作为回复 |
| isDeleted | false |

评论创建后自动触发 JournalRatingCache 更新。

### 3. 帖子 + 帖子评论 (posts.js)

**帖子 (~100)**：

| 字段 | 生成方式 |
|------|----------|
| userId | 随机 seed 用户 |
| title | 从学术讨论标题模板库随机 |
| content | faker 生成 2-5 段中文内容 |
| category | 随机选：experience/discussion/question/news/review/other |
| tags | 从预设标签库随机 1-3 个 |
| journalId | 约 40% 关联已有期刊 |

**帖子评论 (~300)**：

| 字段 | 生成方式 |
|------|----------|
| postId | 随机选已创建的帖子 |
| userId | 随机 seed 用户 |
| content | faker 中文段落 |
| parentId | 约 30% 作为嵌套回复（最多 3 层） |

### 4. 投稿记录 (submissions.js)

**稿件 (~50)**：

| 字段 | 生成方式 |
|------|----------|
| userId | 随机 seed 用户 |
| title | 学术论文标题模板 |
| currentStatus | 根据投稿状态推导 |

**投稿 (~80)**（一篇稿件可投多个期刊）：

| 字段 | 生成方式 |
|------|----------|
| manuscriptId | 关联稿件 |
| userId | 稿件的作者 |
| journalId | 随机已有期刊 |
| submissionDate | 最近 6 个月内随机日期 |
| status | 合理的终态或中间态 |

**状态历史**：根据投稿当前 status 反向生成合理的状态变更链。例如：
- `accepted` → submitted → with_editor → under_review → minor_revision → revision_submitted → accepted
- `rejected` → submitted → with_editor → under_review → rejected

### 5. 互动数据 (interactions.js)

| 类型 | 说明 |
|------|------|
| 帖子点赞 (PostLike) | 每个帖子随机 0-15 个用户点赞 |
| 帖子收藏 (PostFavorite) | 每个帖子随机 0-8 个用户收藏 |
| 帖子关注 (PostFollow) | 每个帖子随机 0-5 个用户关注 |
| 期刊收藏 (Favorite) | 每个 seed 用户随机收藏 0-10 个期刊 |
| 用户关注 (Follow) | 每个 seed 用户随机关注 0-15 个其他 seed 用户 |

互动创建后同步更新帖子的 likeCount/favoriteCount/followCount。

### 6. 公告 (announcements.js)

生成 5 条公告：

| 条目 | type | status | targetType |
|------|------|--------|------------|
| 欢迎公告 | banner | active | all |
| 系统升级通知 | normal | active | all |
| 管理员通知 | normal | active | role:admin |
| 已归档公告 | normal | archived | all |
| 紧急维护通知 | urgent | draft | all |

## 依赖

```json
{
  "devDependencies": {
    "@faker-js/faker": "^9.0.0"
  }
}
```

## 幂等性

- `npm run seed` 执行前先检查是否已有 `seed-0@test.com` 用户
- 如果已存在，提示用户先执行 `npm run seed:reset`
- 避免重复灌入导致唯一约束冲突
