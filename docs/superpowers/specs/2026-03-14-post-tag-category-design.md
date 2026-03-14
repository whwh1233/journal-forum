# 帖子标签与分类系统设计

> 日期: 2026-03-14
> 状态: approved

## 目标

将社区帖子的分类从硬编码枚举改为数据库驱动的动态分类，将自由文本标签升级为可管理、可审核、可合并的标签系统。

## 核心需求

- **分类**: 一级分类，管理员可增删改，数据库驱动
- **标签**: 管理员可创建官方标签，用户可自建标签（需审核），输入时智能推荐已有标签
- **标签去重**: 保留原始大小写显示，用 normalizedName（全小写）去重匹配，大小写仅不同时阻止创建
- **Pending 标签**: 用户自建标签状态为 pending，仅创建者可见，审核通过后全局可用
- **标签合并**: 管理员可将标签 A 合并到标签 B，所有关联帖子随之迁移
- **可配置**: 每帖最大标签数由管理员配置（默认 5）

## 约束

- 兼容现有数据 — 需迁移脚本将旧 category 枚举和 tags JSON 转换为新结构
- 标签长度 ≤ 10 字符，推荐 4-5 字
- 分类一般不删除，预留迁移接口

---

## 数据模型

### PostCategory 表

```sql
CREATE TABLE online_post_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(200) DEFAULT NULL,
  sortOrder INT DEFAULT 0,
  postCount INT DEFAULT 0,
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);
```

初始数据（迁移自现有枚举）：

| slug | name |
|------|------|
| experience | 投稿经验 |
| discussion | 学术讨论 |
| question | 求助问答 |
| news | 资讯分享 |
| review | 文献评述 |
| other | 其他 |

### Tag 表

```sql
CREATE TABLE online_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(10) NOT NULL,
  normalizedName VARCHAR(10) NOT NULL UNIQUE,
  status ENUM('approved', 'pending') DEFAULT 'pending',
  isOfficial BOOLEAN DEFAULT false,
  createdBy CHAR(36) NOT NULL,
  postCount INT DEFAULT 0,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (createdBy) REFERENCES online_users(id)
);
```

去重规则：
- `normalizedName = name.toLowerCase().trim()`
- 创建时检查 normalizedName 是否已存在，已存在则返回已有标签
- 数据库 UNIQUE 约束兜底并发场景

### PostTagMap 表

```sql
CREATE TABLE online_post_tag_map (
  postId INT NOT NULL,
  tagId INT NOT NULL,
  createdAt DATETIME NOT NULL,
  PRIMARY KEY (postId, tagId),
  FOREIGN KEY (postId) REFERENCES online_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tagId) REFERENCES online_tags(id) ON DELETE CASCADE
);
```

### SystemConfig 表

```sql
CREATE TABLE online_system_config (
  configKey VARCHAR(50) PRIMARY KEY,
  configValue VARCHAR(200) NOT NULL,
  description VARCHAR(200) DEFAULT NULL,
  updatedAt DATETIME NOT NULL
);
```

初始配置：

| configKey | configValue | description |
|-----------|-------------|-------------|
| maxTagsPerPost | 5 | 每帖最大标签数 |

### Post 表改动

- `category` 字段类型从 `ENUM(...)` 改为 `INT`，重命名为 `categoryId`，外键关联 PostCategory
- `tags` JSON 字段保留但不再使用（迁移完成后可删除），改用 PostTagMap 关联

---

## API 设计

### 标签公开接口 `/api/tags`

#### `GET /api/tags`
获取标签列表。

Query 参数：
- `search` — 模糊搜索（匹配 name）
- `status` — 筛选状态（approved/pending），默认 approved
- `sort` — 排序：postCount（默认）、latest
- `page` / `limit` — 分页

响应：
```json
{
  "tags": [
    { "id": 1, "name": "SCI", "isOfficial": true, "postCount": 42 }
  ],
  "pagination": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
}
```

#### `GET /api/tags/hot`
热门标签（approved，按 postCount 降序，最多 20 个）。

响应：
```json
{
  "tags": [
    { "id": 1, "name": "SCI", "isOfficial": true, "postCount": 42 }
  ]
}
```

#### `GET /api/tags/suggest?q=xxx` （需登录）
输入时实时推荐。按 normalizedName 模糊匹配，优先返回 official 标签，其次 approved 标签。对当前用户额外返回其创建的 pending 标签。最多返回 10 条。

响应：
```json
{
  "tags": [
    { "id": 1, "name": "SCI", "isOfficial": true, "status": "approved" },
    { "id": 5, "name": "投稿技巧", "isOfficial": false, "status": "pending" }
  ]
}
```

#### `POST /api/tags` （需登录）
创建标签。

请求：
```json
{ "name": "SCI论文" }
```

逻辑：
1. `normalizedName = name.toLowerCase().trim()`
2. 查询已有标签：`WHERE normalizedName = ?`
3. 若已存在 → 返回已有标签（不创建）
4. 若不存在 → 创建，status = pending，isOfficial = false

响应：
```json
{
  "tag": { "id": 10, "name": "SCI论文", "status": "pending", "isNew": true },
  "message": "标签已创建，审核通过后将对所有人可见"
}
```

### 分类公开接口 `/api/post-categories`

#### `GET /api/post-categories`
获取所有启用的分类（isActive = true），按 sortOrder 排序。

响应：
```json
{
  "categories": [
    { "id": 1, "name": "投稿经验", "slug": "experience", "postCount": 120 }
  ]
}
```

### 管理员标签接口 `/api/admin/tags`

#### `GET /api/admin/tags`
标签列表（含 pending），支持筛选 status / isOfficial，带创建者信息和使用量。

#### `POST /api/admin/tags`
创建官方标签（isOfficial = true, status = approved）。

#### `PUT /api/admin/tags/:id`
编辑标签名称。同时更新 normalizedName，检查唯一性。

#### `DELETE /api/admin/tags/:id`
删除标签 + 清理 PostTagMap 关联，更新相关帖子。

#### `PUT /api/admin/tags/:id/approve`
审核通过 pending 标签。

#### `PUT /api/admin/tags/:id/reject`
拒绝 pending 标签：删除标签 + 清理关联。（未来通知系统就绪后通知创建者）

#### `POST /api/admin/tags/merge`
合并标签。

请求：
```json
{ "sourceId": 3, "targetId": 1 }
```

逻辑（事务内执行）：
1. 查出 source 关联的所有 postId
2. 查出 target 已关联的 postId
3. 计算差集：仅 source 有但 target 没有的 postId 需要迁移
4. 迁移：`UPDATE PostTagMap SET tagId = targetId WHERE tagId = sourceId AND postId IN (差集)`
5. 删除剩余 source 关联（即帖子已有 target 的那些重复记录）
6. 删除 source 标签
7. 重新计算 target 的 postCount：`SELECT COUNT(*) FROM PostTagMap WHERE tagId = targetId`

响应：
```json
{
  "message": "标签「sci」已合并到「SCI」，共迁移 15 篇帖子",
  "migratedCount": 15
}
```

#### `POST /api/admin/tags/batch-approve`
批量审核通过。

请求：
```json
{ "tagIds": [3, 5, 8] }
```

### 管理员分类接口 `/api/admin/post-categories`

#### `GET /api/admin/post-categories`
全部分类（含停用），带帖子数。

#### `POST /api/admin/post-categories`
新建分类。

请求：
```json
{ "name": "期刊推荐", "slug": "recommendation", "description": "推荐优质期刊" }
```

#### `PUT /api/admin/post-categories/:id`
编辑分类。

#### `PUT /api/admin/post-categories/:id/toggle`
启用/停用分类。

#### `POST /api/admin/post-categories/:id/migrate`
迁移分类下的帖子到目标分类（预留接口）。

请求：
```json
{ "targetCategoryId": 6 }
```

逻辑：批量 `UPDATE Post SET categoryId = targetId WHERE categoryId = sourceId`，更新两个分类的 postCount。

### 发帖接口改动

#### `POST /api/posts` / `PUT /api/posts/:id`

请求体变更：
```json
{
  "title": "...",
  "content": "...",
  "categoryId": 1,
  "tagIds": [1, 3],
  "newTags": ["新标签名"]
}
```

后端逻辑：
1. 校验 categoryId 对应的分类存在且 isActive
2. 合并 tagIds + newTags 创建的标签 ID，校验总数 ≤ maxTagsPerPost（从 SystemConfig 读取）
3. newTags 中的每个标签：检查 normalizedName 是否已存在，存在则用已有的，不存在则创建 pending 标签
4. 清除旧的 PostTagMap 关联，插入新的
5. 更新相关标签的 postCount

---

## 前端交互

### PostForm 标签输入组件

```
┌─────────────────────────────────────────────────┐
│ 标签（最多 5 个，建议 4-5 字）                      │
│ ┌───────────┐ ┌──────────┐ ┌──────────────┐     │
│ │ SCI ★  ×  │ │ 审稿快 × │ │ 投稿技巧 ⏳ × │     │
│ └───────────┘ └──────────┘ └──────────────┘     │
│ ┌────────────────────────────────────┐          │
│ │ 输入标签...                         │          │
│ └────────────────────────────────────┘          │
│   ┌─ 推荐 ─────────────────────────┐            │
│   │ ★ SCI论文        (42篇帖子)     │            │
│   │ ★ 审稿流程        (28篇帖子)     │            │
│   │   投稿技巧         (15篇帖子)     │            │
│   │ ──────────────────────────────  │            │
│   │   + 创建「xxx」（审核后全局可见）  │            │
│   └─────────────────────────────────┘            │
└─────────────────────────────────────────────────┘

★ = 官方标签    ⏳ = 审核中（仅自己可见）
```

交互细节：
- 输入时调用 `GET /api/tags/suggest?q=xxx`，300ms 防抖
- 推荐列表中官方标签置顶，显示 ★ 标识和使用量
- 完全匹配 normalizedName 时自动选中已有标签
- 无匹配时显示"创建新标签"选项，提示审核机制
- 已选标签以 chip 形式展示，pending 标签显示 ⏳ 图标
- 达到上限时输入框禁用
- 输入超过 10 字符时阻止并提示

### PostForm 分类选择

- 从 `GET /api/post-categories` 动态加载
- 按钮组样式（与社区页分类栏一致），替代硬编码的 CATEGORY_LABELS

### 社区页面 CommunityPage

- 分类栏：动态加载，替代硬编码
- 标签云：调用 `GET /api/tags/hot`，替代现有实现
- 点击标签 → 筛选帖子列表（行为不变）

### 帖子卡片 PostCard / 帖子详情 PostDetail

- 标签从 Post 的 tags JSON 改为从关联的 Tag 对象渲染
- Pending 标签：仅创建者可见，显示虚线边框 + "审核中" tooltip
- 其他用户看帖子时不显示 pending 标签

### 管理后台 — 标签管理页 AdminTagsPanel

```
┌─────────────────────────────────────────────────────┐
│ 标签管理                              [+ 创建官方标签] │
│                                                     │
│ 筛选: [全部 ▼] [官方/用户 ▼]  搜索: [________]       │
│                                                     │
│ ┌─ 待审核 (3) ──────────────────────────────────┐   │
│ │ ☐ 投稿技巧   用户:张三   2篇   3/14           │   │
│ │ ☐ 审稿周期   用户:李四   1篇   3/14           │   │
│ │ ☐ ei检索     用户:王五   1篇   3/13           │   │
│ │                    [批量通过] [批量拒绝]        │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ 标签        类型    使用量   状态    操作              │
│ ─────────────────────────────────────────────────   │
│ SCI         官方    42篇    approved  [编辑] [合并]  │
│ Nature      官方    28篇    approved  [编辑] [合并]  │
│ 投稿经验     用户    15篇    approved  [编辑] [合并]  │
│ ...                                                 │
│                                                     │
│ 共 56 个标签  « 1 2 3 »                              │
└─────────────────────────────────────────────────────┘
```

合并弹窗：
```
┌─ 合并标签 ───────────────────────────┐
│                                      │
│ 将「sci」合并到 → [SCI ▼ 搜索选择]    │
│                                      │
│ ⚠ 将影响 8 篇帖子                     │
│   其中 2 篇已有目标标签（自动去重）     │
│                                      │
│              [取消]  [确认合并]        │
└──────────────────────────────────────┘
```

### 管理后台 — 分类管理页 AdminPostCategoriesPanel

```
┌─────────────────────────────────────────────────────┐
│ 帖子分类管理                            [+ 新建分类]  │
│                                                     │
│ 排序  名称        Slug          帖子数  状态   操作   │
│ ────────────────────────────────────────────────── │
│ ≡ 1  投稿经验    experience     120    启用   [编辑] │
│ ≡ 2  学术讨论    discussion      89    启用   [编辑] │
│ ≡ 3  求助问答    question        56    启用   [编辑] │
│ ≡ 4  资讯分享    news            34    启用   [编辑] │
│ ≡ 5  文献评述    review          22    启用   [编辑] │
│ ≡ 6  其他        other           15    启用   [编辑] │
│                                                     │
│ ≡ = 拖拽排序                                         │
└─────────────────────────────────────────────────────┘
```

---

## 数据迁移方案

在部署新版本时执行一次性迁移脚本 `backend/scripts/migratePostTagCategory.js`：

### 步骤

1. **创建新表**: PostCategory, Tag, PostTagMap, SystemConfig
2. **迁移分类**:
   - 将 6 个枚举值写入 PostCategory 表
   - 遍历所有帖子，将 `category` 字符串映射为 `categoryId`
   - 更新每个分类的 postCount
3. **迁移标签**:
   - 遍历所有帖子的 `tags` JSON 数组
   - 对每个标签：`normalizedName = tag.toLowerCase().trim()`
   - 按 normalizedName 去重，首次出现的保留原始大小写作为 name
   - 创建 Tag 记录（status = approved，isOfficial = false，createdBy = 帖子作者）
   - 创建 PostTagMap 关联
   - 计算每个标签的 postCount
4. **验证**: 对比迁移前后帖子数、标签数、分类分布
5. **清理**: 迁移确认无误后，可删除 Post 表的旧 `category` 和 `tags` 字段（建议保留一段时间作为回退）

### 回退策略

- 旧字段不立即删除，出问题可回退代码恢复旧逻辑
- 迁移脚本支持 `--dry-run` 模式，只输出计划不执行

---

## 影响范围

### 新增文件

**后端:**
- `backend/models/PostCategory.js` — 分类模型
- `backend/models/Tag.js` — 标签模型
- `backend/models/PostTagMap.js` — 关联模型
- `backend/models/SystemConfig.js` — 系统配置模型
- `backend/controllers/tagController.js` — 标签控制器
- `backend/controllers/postCategoryController.js` — 分类控制器
- `backend/routes/tagRoutes.js` — 标签路由
- `backend/routes/postCategoryRoutes.js` — 分类路由
- `backend/scripts/migratePostTagCategory.js` — 迁移脚本

**前端:**
- `src/features/posts/components/TagInput.tsx` — 标签输入组件（自动补全 + chip）
- `src/features/posts/components/TagChip.tsx` — 标签 chip 组件（含 pending 样式）
- `src/features/admin/components/AdminTagsPanel.tsx` — 管理后台标签管理
- `src/features/admin/components/AdminPostCategoriesPanel.tsx` — 管理后台分类管理
- `src/features/admin/components/TagMergeModal.tsx` — 标签合并弹窗
- `src/services/tagService.ts` — 标签 API 客户端
- `src/services/postCategoryService.ts` — 分类 API 客户端

### 修改文件

**后端:**
- `backend/models/Post.js` — category 改为 categoryId（INT FK），移除 tags JSON
- `backend/models/index.js` — 注册新模型，添加关联关系
- `backend/controllers/postController.js` — 发帖/编辑逻辑改用 categoryId + tagIds/newTags，列表查询 JOIN Tag 表
- `backend/routes/postRoutes.js` — 无大改动
- `backend/routes/adminRoutes.js` — 注册标签/分类管理路由

**前端:**
- `src/features/posts/types/post.ts` — 更新 Post 类型定义（categoryId, tags 从 string[] 改为 Tag[]）
- `src/features/posts/components/PostForm.tsx` — 分类改为动态加载，标签改为 TagInput 组件
- `src/features/posts/components/PostCard.tsx` — 标签渲染改用 Tag 对象，处理 pending 可见性
- `src/features/posts/components/PostDetail.tsx` — 同上
- `src/features/posts/pages/CommunityPage.tsx` — 分类栏和标签云改为动态加载
- `src/features/posts/services/postService.ts` — 发帖请求体变更
- `src/contexts/PostContext.tsx` — 适配新的 filter 参数

---

## 未来增强（不在本次范围）

- **通知系统集成**: 标签被拒绝/合并时通知用户（依赖通知系统完成）
- **标签关注**: 用户关注感兴趣的标签
- **标签趋势图**: 管理后台显示标签使用趋势
- **标签同义词**: 建立标签别名映射关系
