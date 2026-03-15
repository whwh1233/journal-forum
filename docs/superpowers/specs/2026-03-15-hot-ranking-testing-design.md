# Hot Ranking Testing Design Spec

> Date: 2026-03-15
> Status: Approved
> Scope: 热度排序功能的完整自动化测试（后端单元 + 集成 + 前端组件 + E2E）

## 决策记录

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 测试覆盖层级 | C - 全栈 + E2E | 项目测试规范要求三层覆盖 |
| Cron 测试策略 | C - 两者结合 | 核心逻辑用直接调用，调度行为用 mock timer |
| E2E 时间衰减处理 | B - API 构造数据 | E2E 只验证用户可见行为，不重复验证后端计算 |
| 测试文件组织 | B - 独立文件 | 热度排序横跨帖子和期刊，独立文件便于维护 |
| 测试方案 | A - 逐层独立 | 职责分层清晰，与现有目录结构一致 |

## 文件规划

| 层级 | 文件路径 | 状态 |
|------|----------|------|
| 后端单元测试 | `backend/__tests__/unit/hotScore.test.js` | 扩展现有 |
| 后端集成测试 | `backend/__tests__/integration/hotRanking.test.js` | 新建 |
| 前端组件测试 | `src/__tests__/components/HotRanking.test.tsx` | 新建 |
| E2E 测试 | `e2e/tests/hot-ranking.spec.ts` | 新建 |

## 第 1 部分：后端单元测试（扩展 hotScore.test.js）

现有 8 个测试用例，新增 ~12 个，总计 ~20 个。

### calculatePostHotScore

| 用例 | 验证点 |
|------|--------|
| ✅ 已有：0h 新帖 boost=20 | newBoost 最大值 |
| ✅ 已有：48h 衰减一半 | 半衰期公式 |
| ✅ 已有：>24h 无 newBoost | boost 截止 |
| 新增：12h 帖子 boost=10 | boost 线性衰减中间值 |
| 新增：96h decay ≈ 0.25 | 两个半衰期精确验证 |
| 新增：168h(7天) score 趋近 0 | 长期衰减行为 |
| 新增：全 0 engagement + >24h | 无 boost 无 engagement → 0 |
| 新增：无效/未来 createdAt | hoursAge 为负数时的行为 |
| 新增：负数 engagement 值 | 防御性输入 |

### calculatePostAllTimeScore

| 用例 | 验证点 |
|------|--------|
| ✅ 已有：权重验证 | 各字段权重正确 |
| ✅ 已有：全 0 返回 0 | 零值处理 |
| 新增：极大值 viewCount=1000000 | 精度验证 |
| 新增：undefined/null 字段 | 源码无 `\|\| 0` 防护，会产生 NaN |
| 新增：浮点数 engagement | Math.round 精度 |

### calculateJournalHotScore

| 用例 | 验证点 |
|------|--------|
| ✅ 已有：权重验证 | 各字段权重正确 |
| ✅ 已有：null rating | null 防护 |
| 新增：全 0 输入 | 返回 0 |

### calculateJournalAllTimeScore

| 用例 | 验证点 |
|------|--------|
| ✅ 已有：impactFactor | 包含影响因子 |
| ✅ 已有：null impactFactor + rating | null 防护 |
| 新增：全 0 输入 | 返回 0 |

### updatePostScores

| 用例 | 验证点 |
|------|--------|
| 新增：正常调用 | post.update 被调用，参数包含 hotScore 和 allTimeScore |
| 新增：post.update 失败 | 异常冒泡（源码无 try/catch） |

## 第 2 部分：后端集成测试（新建 hotRanking.test.js）

### Post score updates on engagement

| 用例 | API | 验证 |
|------|-----|------|
| 点赞帖子 | POST /api/posts/:id/like | hotScore + allTimeScore 增加 |
| 取消点赞 | POST /api/posts/:id/like (toggle) | 分数减少 |
| 收藏帖子 | POST /api/posts/:id/favorite | 分数增加 |
| 取消收藏 | POST /api/posts/:id/favorite (toggle) | 分数减少 |
| 发表评论 | POST /api/posts/:postId/comments | 分数增加 |
| 删除评论 | DELETE /api/posts/comments/:commentId | 分数减少 |
| 浏览帖子 | POST /api/posts/:id/view | 仅 allTimeScore 增加，hotScore 不变 |
| 新建帖子 | POST /api/posts | hotScore 和 allTimeScore 默认为 0 |

### Journal score updates on engagement

| 用例 | API | 验证 |
|------|-----|------|
| 发表期刊评论 | POST /api/comments | JournalRatingCache hotScore/allTimeScore 更新 |
| 删除期刊评论 | DELETE /api/comments/:id | 分数调整 |
| 删除回复评论（非顶层） | DELETE /api/comments/:id | 分数不变（仅顶层评论触发重算） |
| 收藏期刊 | POST /api/favorites (body: journalId) | hotScore/allTimeScore/favoriteCount 更新 |
| 取消收藏期刊 | DELETE /api/favorites/:journalId | 分数和 favoriteCount 减少 |

### Post sorting API

| 用例 | 请求 | 验证 |
|------|------|------|
| hot 排序 | GET /api/posts?sortBy=hot | 按 hotScore DESC |
| allTime 排序 | GET /api/posts?sortBy=allTime | 按 allTimeScore DESC |
| 置顶优先 | GET /api/posts?sortBy=hot (含置顶帖) | isPinned 帖子排最前 |

### Journal sorting API

| 用例 | 请求 | 验证 |
|------|------|------|
| hot 排序 | GET /api/journals?sortBy=hot | 按 hot_score DESC（使用 optionalAuth） |
| allTime 排序 | GET /api/journals?sortBy=allTime | 按 all_time_score DESC（使用 optionalAuth） |
| 无 RatingCache 的期刊 | GET /api/journals?sortBy=hot | 无 cache 记录的期刊排在末尾（LEFT JOIN NULL） |

### Cron job functions

| 用例 | 方式 | 验证 |
|------|------|------|
| updatePostTimeDecay 重算 | 直接调用函数 | 7 天内帖子 hotScore 被重新计算 |
| updatePostTimeDecay 归零 | 直接调用函数 | >7 天帖子 hotScore 变为 0 |
| updateJournalHotScores 刷新 | 直接调用函数 | 所有期刊 hotScore 被刷新 |
| 并发锁 | Mock timer + 连续调用 | isRunning=true 时第二次调用跳过 |

## 第 3 部分：前端组件测试（新建 HotRanking.test.tsx）

### CommunityPage hot ranking

| 用例 | 验证 |
|------|------|
| 默认请求 sortBy=hot | API 调用参数正确 |
| select 切换到 allTime | 选择 allTime 选项后触发重新请求 |
| 切换排序后列表重新渲染 | 帖子顺序变化 |
| select 当前值正确 | 默认选中 hot 选项 |

### SearchAndFilter hot ranking

| 用例 | 验证 |
|------|------|
| hotSortMode 切换按钮渲染 | 按钮存在（需 mock useJournals context） |
| 点击切换触发回调 | setHotSortMode 被调用 |
| 当前模式按钮高亮 | active 样式正确 |

### 实现注意

- CommunityPage 排序使用 `<select>` 下拉框，非独立按钮
- SearchAndFilter 的 hotSortMode/setHotSortMode 来自 `useJournals()` hook，需 mock JournalContext
- Cron 的 `isRunning` 是模块级变量，测试间需重置模块状态

## 第 4 部分：E2E 测试（新建 hot-ranking.spec.ts）

数据策略：通过 API 直接插入不同分数值的帖子/期刊，不测试时间衰减。

| 用例 | 步骤 | 验证 |
|------|------|------|
| 帖子 hot 排序 | 构造 3 个不同 hotScore 的帖子 | 列表按分数降序 |
| 帖子排序切换 | 点击"历史最佳" | 列表按 allTimeScore 重排 |
| 期刊 hot 排序 | 构造不同分数的期刊 | hot 排序正确 |
| 期刊排序切换 | 切换到 allTime | 验证重排 |
| 置顶帖子 | 包含一个低分置顶帖 | 置顶帖始终排第一 |

## 预期用例总计

| 层级 | 用例数 |
|------|--------|
| 后端单元测试 | ~20 |
| 后端集成测试 | ~24 |
| 前端组件测试 | ~7 |
| E2E 测试 | ~5 |
| **总计** | **~56** |
