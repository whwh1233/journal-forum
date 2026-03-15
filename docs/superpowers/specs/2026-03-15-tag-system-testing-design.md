# Tag System Testing Design Spec

**Status:** approved
**Date:** 2026-03-15
**Scope:** 标签系统全栈自动化测试（后端集成 + 前端组件 + E2E）

## Background

标签系统（Tag + PostCategory）已完整实现，包含公开 API、管理员 API、前端组件（TagInput、AdminTagsPanel），但目前没有任何测试覆盖。需要补充三层测试。

## Testing Strategy

三层测试，沿用项目现有模式：
- **后端集成测试**：Jest + supertest + 真实 MySQL（同 `post.test.js` 模式）
- **前端组件测试**：Vitest + React Testing Library（同 `src/__tests__/setup.ts` 配置）
- **E2E 测试**：Playwright（同 `community-posts.spec.ts` 模式）

每个测试文件自建/清理测试数据，不抽取共享 helpers。

---

## Layer 1: Backend Integration Tests

### File: `backend/__tests__/integration/tag.test.js`

测试公开标签 API（`/api/tags/*`）。

**Setup/Teardown 模式**（同 `post.test.js`）：
- `beforeAll`: `sequelize.authenticate()`
- `beforeEach`: 清理 PostTagMap → Tag → (测试创建的 Post) → PostCategory，注册测试用户获取 token
- `afterAll`: `sequelize.close()`

**Test Cases:**

```
describe('GET /api/tags')
  ✓ 返回已审核标签列表（含 pagination）
  ✓ search 参数模糊搜索
  ✓ sort=name 按名称排序
  ✓ sort=newest 按创建时间排序
  ✓ sort=postCount 按帖子数排序（默认）
  ✓ 不返回 pending 标签

describe('GET /api/tags/hot')
  ✓ 返回热门标签（按 postCount DESC）
  ✓ 最多返回 20 个
  ✓ 不返回 pending 标签

describe('GET /api/tags/suggest')
  ✓ 未登录返回 401
  ✓ 有查询词时返回前缀匹配结果
  ✓ 返回已审核标签 + 当前用户的 pending 标签
  ✓ 不返回其他用户的 pending 标签
  ✓ 空查询返回热门标签 + 用户 pending 标签
  ✓ 结果中官方标签排在前面

describe('POST /api/tags')
  ✓ 未登录返回 401
  ✓ 创建新标签，状态为 pending，返回 isNew: true
  ✓ 标签名 normalization（"SCI" → normalizedName "sci"）
  ✓ 重复标签名返回已存在标签，isNew: false
  ✓ 大小写不同视为同名（"SCI" vs "sci"）
  ✓ 空标签名返回 400

describe('GET /api/post-categories')
  ✓ 返回活跃分类列表
  ✓ 按 sortOrder 排序
  ✓ 不返回未激活分类
```

### File: `backend/__tests__/integration/adminTag.test.js`

测试管理员标签/分类 API（`/api/admin/tags/*`, `/api/admin/post-categories/*`）。

**Setup**（同上，额外创建 admin 用户）：
- `beforeEach`: 清理数据，注册普通用户 + admin 用户（`User.update({ role: 'admin' })`）

**Test Cases:**

```
describe('Admin Tag API - Permission')
  ✓ 未登录返回 401
  ✓ 普通用户返回 403

describe('GET /api/admin/tags')
  ✓ 返回所有标签（含 pending）
  ✓ status 参数过滤
  ✓ isOfficial 参数过滤
  ✓ search 参数搜索
  ✓ 包含 creator 信息
  ✓ 分页正确

describe('POST /api/admin/tags')
  ✓ 创建官方标签（isOfficial=true, status=approved）
  ✓ 重复名称返回 400
  ✓ 空名称返回 400

describe('PUT /api/admin/tags/:id')
  ✓ 更新标签名称
  ✓ 更新后 normalizedName 同步变化
  ✓ 更新为已存在名称返回 400
  ✓ 空名称返回 400
  ✓ 不存在的 id 返回 404

describe('DELETE /api/admin/tags/:id')
  ✓ 删除标签成功
  ✓ CASCADE 删除相关 PostTagMap
  ✓ 不存在的 id 返回 404

describe('PUT /api/admin/tags/:id/approve')
  ✓ 审核通过，status 变为 approved
  ✓ 不存在的 id 返回 404

describe('PUT /api/admin/tags/:id/reject')
  ✓ 拒绝标签（硬删除）
  ✓ 不存在的 id 返回 404

describe('POST /api/admin/tags/batch-approve')
  ✓ 批量审核通过多个标签
  ✓ 空数组返回 400
  ✓ 非数组返回 400

describe('POST /api/admin/tags/batch-reject')
  ✓ 批量拒绝（删除 PostTagMap + Tag）
  ✓ 空数组返回 400

describe('POST /api/admin/tags/merge')
  ✓ 合并标签：源标签帖子迁移到目标标签
  ✓ 重叠帖子不产生重复关联
  ✓ 源标签被删除
  ✓ 目标标签 postCount 重新计算
  ✓ sourceTagId === targetTagId 返回 400
  ✓ 不存在的源标签返回 404
  ✓ 不存在的目标标签返回 404
  ✓ 缺少参数返回 400

describe('Admin Category API - Permission')
  ✓ 未登录返回 401
  ✓ 普通用户返回 403

describe('Admin Category API')
  ✓ GET /api/admin/post-categories - 返回所有分类（含未激活）
  ✓ POST /api/admin/post-categories - 创建分类，sortOrder 自增
  ✓ POST 缺少 name 或 slug 返回 400
  ✓ POST 重复 slug 返回 400
  ✓ PUT /api/admin/post-categories/:id - 更新分类
  ✓ PUT /api/admin/post-categories/:id - 不存在的 id 返回 404
  ✓ PUT /api/admin/post-categories/:id - 重复 slug 返回 400
  ✓ PUT /api/admin/post-categories/:id/toggle - 切换激活状态
  ✓ PUT /api/admin/post-categories/:id/toggle - 不存在的 id 返回 404
  ✓ PUT /api/admin/post-categories/reorder - 重新排序
  ✓ PUT /api/admin/post-categories/reorder - 空数组返回 400
  ✓ POST /api/admin/post-categories/:id/migrate - 迁移帖子到另一分类
  ✓ POST /api/admin/post-categories/:id/migrate - 不存在的源/目标分类返回 404
```

---

## Layer 2: Frontend Component Tests

### File: `src/__tests__/components/posts/TagInput.test.tsx`

Mock `tagService` 的所有方法，专注组件交互逻辑。

**Test Cases:**

```
describe('TagInput - Rendering')
  ✓ 渲染输入框和提示文字
  ✓ 显示已选标签 chips
  ✓ 官方标签显示 Star 图标
  ✓ pending 标签显示 Clock 图标
  ✓ 达到上限时输入框禁用

describe('TagInput - Autocomplete')
  ✓ 输入文字后 300ms 触发 suggestTags（需 vi.useFakeTimers + vi.advanceTimersByTime）
  ✓ onFocus 时如果输入框有文字则触发 suggestTags
  ✓ 显示建议下拉列表
  ✓ 已选标签不出现在建议中
  ✓ 官方标签排在建议列表前面
  ✓ 无精确匹配时显示"创建"选项
  ✓ 有精确匹配时不显示"创建"选项
  ✓ 输入超过 10 字符被截断

describe('TagInput - Keyboard Navigation')
  ✓ ArrowDown 移动高亮
  ✓ ArrowUp 移动高亮
  ✓ Enter 选中高亮项
  ✓ Enter 在"创建"选项上创建新标签
  ✓ Escape 关闭下拉

describe('TagInput - Tag Management')
  ✓ 点击建议项添加标签
  ✓ 点击 X 移除已选标签
  ✓ 点击 X 移除新建标签
  ✓ 选中后清空输入框
  ✓ onChange 回调包含正确的 tags 和 newTagNames

describe('TagInput - Disabled State')
  ✓ disabled 时输入框不可编辑
  ✓ disabled 时移除按钮不可点击
```

### File: `src/__tests__/components/admin/AdminTagsPanel.test.tsx`

Mock `tagService` 管理员方法。

**Test Cases:**

```
describe('AdminTagsPanel - Rendering')
  ✓ 渲染标签列表
  ✓ 显示 pending/approved 状态标识
  ✓ 显示官方标签标识
  ✓ 显示 creator 信息

describe('AdminTagsPanel - Filtering')
  ✓ 按状态筛选
  ✓ 按官方/非官方筛选
  ✓ 搜索标签名

describe('AdminTagsPanel - Actions')
  ✓ 审核通过标签
  ✓ 拒绝标签
  ✓ 编辑标签名（点击编辑按钮进入内联编辑）
  ✓ 内联编辑 Enter 保存、Escape 取消
  ✓ 删除标签（显示确认弹窗，确认后删除）
  ✓ 创建官方标签（打开创建弹窗，输入名称）

describe('AdminTagsPanel - Batch Operations')
  ✓ 勾选多个标签
  ✓ 全选/取消全选
  ✓ 批量审核通过
  ✓ 批量拒绝

describe('AdminTagsPanel - States')
  ✓ 加载中显示 spinner
  ✓ 加载失败显示错误信息
  ✓ 空列表显示"暂无标签"

describe('AdminTagsPanel - Merge')
  ✓ 打开合并弹窗
  ✓ 选择源和目标标签
  ✓ 确认合并调用 adminMergeTags
```

---

## Layer 3: E2E Tests

### File: `e2e/tests/tag-system.spec.ts`

沿用 `community-posts.spec.ts` 模式：每个 test 注册新用户。

**Test Cases:**

```
test.describe('Tag System - User Flow')
  ✓ 发帖时使用 TagInput 搜索并选择标签
  ✓ 发帖时创建新标签（显示为 pending）
  ✓ 帖子详情页显示标签
  ✓ 社区页面按标签筛选帖子

test.describe('Tag System - Admin Flow')
  beforeEach: 注册用户 → 通过 API 注册后直接用 Sequelize 式的
  后端测试辅助端点提升角色（见下方 E2E Admin Setup 说明）

  ✓ 管理面板查看 pending 标签列表
  ✓ 审核通过 pending 标签
  ✓ 拒绝 pending 标签
  ✓ 创建官方标签
  ✓ 合并两个标签
  ✓ 批量审核通过多个标签
```

---

## Key Implementation Details

### Data Cleanup Order

由于外键约束，清理顺序必须是（子表先于父表）：
```
PostTagMap → Tag → (测试创建的 Post) → PostCategory
```
说明：PostTagMap 依赖 Tag 和 Post，Post 依赖 PostCategory。Tag 和 PostCategory 之间无依赖关系。合并测试会创建 Post，需在 Tag 之后、PostCategory 之前清理。

### Admin User Creation

沿用 `post.test.js` 的模式：先注册普通用户，再 `User.update({ role: 'admin' })`。

### Tag Merge Testing

合并测试需要先准备数据：
1. 创建两个标签 A、B
2. 创建帖子关联到 A 和 B
3. 调用 merge(A → B)
4. 验证：A 被删除，B 的 postCount 正确，原 A 帖子现在关联 B

### E2E Admin Setup

E2E 中无法直接调用 Sequelize，需要通过 HTTP API 提升用户角色。具体方案：

**方案：使用后端测试辅助端点**

在 E2E 测试环境下（`NODE_ENV=test`），后端暴露一个仅限测试的端点用于设置用户角色。如果该端点不存在，则需要在实现阶段新增：

```js
// backend/routes/testHelperRoutes.js（仅 NODE_ENV=test 时加载）
router.put('/api/test/users/:id/role', async (req, res) => {
  const { role } = req.body;
  await User.update({ role }, { where: { id: req.params.id } });
  res.json({ success: true });
});
```

E2E 流程：
1. 通过 UI 注册用户
2. 通过 `request.put('/api/test/users/:id/role')` 设置 `role: 'admin'`
3. 刷新页面后通过 UI 操作管理面板

---

## Out of Scope

- PostForm 完整集成测试（已有现成 E2E 覆盖发帖流程）
- tagService.ts 单元测试（纯 API 封装，集成测试已覆盖）
- 性能/压力测试
