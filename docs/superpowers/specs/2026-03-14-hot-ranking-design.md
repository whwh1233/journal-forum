# 热门排序系统设计

## 概述

为帖子和期刊实现"近期热门"和"历史最热"两种排序方式。通过加权公式计算热度分数，事件驱动实时更新 + 定时任务处理时间衰减。

## 帖子 (Post) 热度算法

### 近期热门 (hot)

```
decay = 0.5 ^ (hours_since_creation / 48)
rawScore = commentCount × 5 + likeCount × 3 + favoriteCount × 2 + viewCount × 0.1
newBoost = 发布 < 24h ? 20 × (1 - hours_since_creation / 24) : 0

hotScore = (rawScore × decay) + newBoost
         ↑ 互动分数乘以衰减      ↑ 新帖加成独立叠加，不参与衰减
```

- 权重优先级：评论 > 点赞 > 收藏 > 浏览
- 48 小时半衰期，热度自然衰减
- 新帖 24 小时内获得额外加成（初始 20 分，线性衰减到 0），确保新帖有曝光机会
- 复用现有 `hotScore` 字段（DECIMAL 10,2，已有索引）

### 历史最热 (allTime)

```
allTimeScore = commentCount × 5 + likeCount × 3 + favoriteCount × 2 + viewCount × 0.1
```

- 纯累计分数，无时间衰减
- 新增 `allTimeScore` 字段（DECIMAL 10,2，加索引）

### 排序规则

- 置顶帖 (`isPinned = true`) 在所有排序模式下强制排在最前面：`ORDER BY isPinned DESC, <sortField> DESC`（新增行为，当前代码未处理 isPinned 排序）
- 排除 `isDeleted = true` 和 `status != 'published'` 的帖子

## 期刊 (Journal) 热度算法

### 近期热门 (hot)

```
hotScore = recentCommentCount(7天) × 5 + recentFavoriteCount(7天) × 3 + rating × 2
```

- 从 Comment 和 Favorite 表按 7 天时间窗口聚合
- 反映社区当前关注热点

### 历史最热 (allTime)

```
allTimeScore = ratingCount × 5 + totalFavoriteCount × 3 + rating × 2 + impactFactor × 1
```

- 综合用户参与度和学术指标
- 注意：`impactFactor` 在 `online_journals` 表，`ratingCount`/`rating` 在 `journal_rating_caches` 表，计算时需 JOIN 两表

## 数据库变更

### Post 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `hotScore` | DECIMAL(10,2) | 已存在，复用 |
| `allTimeScore` | DECIMAL(10,2) | 新增，加索引 |

### JournalRatingCache 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `hotScore` | DECIMAL(10,2) | 新增 |
| `allTimeScore` | DECIMAL(10,2) | 新增 |
| `favoriteCount` | INTEGER | 新增，从 Favorite 表同步 |

## 更新策略

### 事件驱动（实时）

| 事件 | 更新目标 |
|------|---------|
| 帖子被点赞/取消点赞 | 该帖子的 hotScore + allTimeScore |
| 帖子被评论/删除评论 | 该帖子的 hotScore + allTimeScore |
| 帖子被收藏/取消收藏 | 该帖子的 hotScore + allTimeScore |
| 帖子被浏览 | 该帖子的 allTimeScore（viewCount 权重仅 0.1，每次浏览不必更新 hotScore，由定时任务覆盖） |
| 期刊被评论/评分（Comment 表） | 该期刊的 hotScore + allTimeScore |
| 期刊被收藏/取消收藏（Favorite 表） | 该期刊的 favoriteCount + hotScore + allTimeScore |

**注意**：帖子互动使用 `PostLike`/`PostComment`/`PostFavorite` 表，期刊互动使用 `Comment`/`Favorite` 表，不要混淆。

### 定时任务（每小时）

| 任务 | 说明 |
|------|------|
| 帖子时间衰减 | 批量更新最近 7 天内帖子的 hotScore（更老的帖子衰减变化可忽略） |
| 期刊近期热门 | 重新聚合所有期刊的近 7 天评论数和收藏数，更新 hotScore |

- 使用 `node-cron` 在后端进程内运行
- 帖子批量更新只处理最近 7 天的数据，控制性能开销
- 超过 7 天的帖子在定时任务中将 hotScore 置为 0（避免残留过高的陈旧分数）
- 使用简单的执行锁（内存变量）防止定时任务重叠执行

## API 变更

### 帖子 API

`GET /api/posts?sortBy=hot|allTime|latest|likes|comments|views`

- `hot`（默认）：近期热门，按 hotScore 排序
- `allTime`：历史最热，按 allTimeScore 排序
- 其他选项保持不变

### 期刊 API

`GET /api/journals?sortBy=hot|allTime`

- `hot`：近期热门，按 hotScore 排序
- `allTime`：历史最热，按 allTimeScore 排序
- 与现有多维排序共存，`sortBy=hot/allTime` 时使用热度排序，否则沿用原有逻辑

## 前端变更

### 帖子排序选项

```javascript
SORT_OPTIONS = [
  { value: 'hot', label: '综合热度' },      // 已有
  { value: 'allTime', label: '历史最热' },   // 新增
  { value: 'latest', label: '最新发布' },
  { value: 'likes', label: '最多点赞' },
  { value: 'comments', label: '最多回复' },
  { value: 'views', label: '最多浏览' }
];
```

### 期刊排序

- 在现有多维排序区域新增"近期热门"和"历史最热"两个快捷排序按钮
- 选中热门排序时，替代多维排序逻辑

## 历史数据迁移

上线时需执行一次性脚本：

1. 遍历所有帖子，根据当前 commentCount/likeCount/favoriteCount/viewCount 计算初始 hotScore 和 allTimeScore
2. 遍历所有期刊，从 Comment/Favorite/JournalRatingCache 表聚合数据，计算初始 hotScore 和 allTimeScore
3. 初始化 JournalRatingCache 的 favoriteCount 字段
4. 迁移脚本应幂等（可安全重复执行）

## 热度计算工具函数

后端新增 `backend/utils/hotScore.js`：

```javascript
// 计算帖子近期热门分数
function calculatePostHotScore(post) {
  const hoursAge = (Date.now() - new Date(post.createdAt)) / 3600000;
  const decay = Math.pow(0.5, hoursAge / 48);
  const rawScore = post.commentCount * 5 + post.likeCount * 3 + post.favoriteCount * 2 + post.viewCount * 0.1;
  const newBoost = hoursAge < 24 ? 20 * (1 - hoursAge / 24) : 0;
  return Math.round((rawScore * decay + newBoost) * 100) / 100;
}

// 计算帖子历史最热分数
function calculatePostAllTimeScore(post) {
  const rawScore = post.commentCount * 5 + post.likeCount * 3 + post.favoriteCount * 2 + post.viewCount * 0.1;
  return Math.round(rawScore * 100) / 100;
}

// 计算期刊近期热门分数
function calculateJournalHotScore(recentCommentCount, recentFavoriteCount, rating) {
  return Math.round((recentCommentCount * 5 + recentFavoriteCount * 3 + (rating || 0) * 2) * 100) / 100;
}

// 计算期刊历史最热分数
function calculateJournalAllTimeScore(ratingCount, favoriteCount, rating, impactFactor) {
  return Math.round((ratingCount * 5 + favoriteCount * 3 + (rating || 0) * 2 + (impactFactor || 0) * 1) * 100) / 100;
}
```
