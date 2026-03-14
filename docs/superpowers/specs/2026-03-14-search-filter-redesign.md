# SearchAndFilter 重设计规范

**日期**: 2026-03-14
**状态**: 已通过用户审批
**文件**: `src/features/journals/components/SearchAndFilter.tsx` + `SearchAndFilter.css`

---

## 问题背景

当前 `search-filter-section` 存在以下布局问题：

1. `.filter-bar { align-items: flex-end }` — 筛选项底部对齐，垂直不居中
2. 每个 `.filter-group` 是 `flex-direction: row`，将 `.filter-label`（高度 ≈ 16px）和 `.popover-trigger`（高度 40px）水平并排，造成视觉上的垂直不居中
3. "重置筛选" 按钮组用 `visibility: hidden` 的占位标签 hack 来对齐，代码语义差
4. 整体布局与设计规范（Lexend、CSS 变量、组件尺寸体系）不一致

---

## 设计目标

- 所有元素垂直居中，水平布局整齐
- 图标和标签内嵌进触发按钮，消除高度不一致根源
- 用分隔线（`filter-divider`）对功能分组：筛选组 | 排序 | 操作
- 保留现有全部功能（等级、分类、评分、多维度排序、重置）
- 全面对齐设计规范：CSS 变量、Lexend 字体、尺寸/间距/圆角体系

---

## 布局结构

```
.search-filter-section (flex-direction: column, gap: space-2)
  ├── .sfc-search-bar          ← 搜索栏（不变）
  └── .filter-bar              ← align-items: center (修复关键)
        ├── .filter-bar-label  ← "筛选" 文字标签 (text-xs, muted, uppercase)
        ├── .filter-trigger    ← 等级
        ├── .filter-trigger    ← 分类
        ├── .filter-trigger    ← 评分
        ├── .filter-divider    ← 1px 竖向分隔线
        ├── .filter-trigger.sort-trigger  ← 排序
        ├── .filter-divider    ← (仅有激活筛选时显示)
        └── .clear-btn         ← 重置筛选 (仅有激活筛选时显示)
```

排序面板 `.sort-panel-container` 保持在 `.search-filter-section` 内、`filter-bar` 下方展开，结构不变。

---

## 组件变更

### 删除的结构

- `.filter-group` 类（wrapper div）— 不再需要
- `.filter-label` 类（独立标签元素）— 内嵌进按钮
- `PopoverSelect` 组件内的 `filter-label` div
- "重置筛选" 组的 `visibility: hidden` 占位 div

### 新增的结构

- `.filter-bar-label` — `<span>` 文字标签，`text-xs / font-weight:700 / uppercase / color-text-muted`
- `.filter-divider` — `<div>`，`width:1px / height:20px / background:color-border`
- `.filter-trigger` — 重命名自 `.popover-trigger`，图标+文字+chevron 水平排列于内部
- `.clear-btn` — 重命名自 `.clear-filters-btn`，不再需要占位父容器

### 修改的结构

**`.filter-bar` CSS：**
```css
/* 改前 */
.filter-bar { align-items: flex-end; gap: var(--space-4); }

/* 改后 */
.filter-bar { align-items: center; gap: var(--space-2); flex-wrap: wrap; }
```

**`.filter-trigger`（原 `.popover-trigger`）内部结构：**
```tsx
// 改前（PopoverSelect 组件外部提供 label）
<div class="filter-group size-large">
  <div class="filter-label">{icon} <span>{label}</span></div>
  <div class="popover-select-container">
    <div class="popover-trigger">...</div>
  </div>
</div>

// 改后（icon+label 内嵌进 trigger）
<div class="popover-select-container">
  <button class="filter-trigger">
    <span class="ft-icon">{icon}</span>
    <span class="ft-text">{selectedName}</span>
    <ChevronDown class="ft-chevron" />
  </button>
</div>
```

---

## `PopoverSelect` 组件接口变更

`PopoverSelect` 不再接收 `label` prop（标签现在内嵌在触发按钮内部，仍保留）。

props 保持不变：`label`, `icon`, `options`, `selectedId`, `onSelect`, `placeholder`, `isCascaded`

触发按钮内部布局变为：`[icon] [label: selectedName] [chevron]`，当 `selectedId` 非空时显示选中值，否则显示 `placeholder`。

---

## 视觉规范

| 元素 | 尺寸 | 说明 |
|------|------|------|
| `.filter-trigger` | `height: var(--size-md)` = 40px | 设计规范 MD 默认尺寸 |
| `.filter-trigger` 字号 | `var(--text-sm)` = 14px | SM 字号 |
| `.filter-trigger` 图标 | `size={14}` (icon-xs = 14px) | 与 text-sm 配对 |
| `.filter-bar-label` 字号 | `var(--text-xs)` = 12px | 辅助标签 |
| `.filter-divider` 高度 | 20px | 视觉分隔，不超过按钮高度 |
| `.filter-trigger` 圆角 | `var(--radius-md)` = 8px | 标准 MD 圆角 |
| `.filter-bar` gap | `var(--space-2)` = 8px | 紧凑间距 |

**激活状态**（`has-value`）颜色保持不变：
- background: `var(--color-info-light)` (#dbeafe)
- border: `var(--color-accent)` (#2563eb)
- border-bottom: `var(--color-secondary)` (#4f46e5)
- color: `var(--color-secondary)`

---

## 测试影响

`src/__tests__/components/journals/SearchAndFilter.test.tsx` 中以下选择器需更新：

- `.filter-group` → 改为 `.popover-select-container` 或直接找 `.filter-trigger`
- `.filter-label` → 改为 `.ft-text` 或 `.filter-bar-label`
- `.clear-filters-btn` → 改为 `.clear-btn`

E2E 测试 `e2e/fixtures/test-data.ts` 中 `search` 对象的选择器同步更新：
- `filterGroup: '.filter-group'` → `filterTrigger: '.filter-trigger'`
- `filterLabel: '.filter-label'` → `filterBarLabel: '.filter-bar-label'`
- `clearFiltersBtn: '.clear-filters-btn'` → `clearFiltersBtn: '.clear-btn'`

---

## 不在本次范围内

- 下拉菜单（popover-menu）内部样式不变
- 排序面板（sort-panel-container）内部不变
- 搜索栏（sfc-search-bar）不变
- 响应式断点逻辑不变
