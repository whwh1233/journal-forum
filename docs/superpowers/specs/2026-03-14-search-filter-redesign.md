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
- 用分隔线（`.filter-divider`）对功能分组：筛选组 | 排序 | 操作（仅激活时）
- 保留现有全部功能（等级、分类、评分、多维度排序、重置）
- 全面对齐设计规范：CSS 变量、Lexend 字体、尺寸/间距/圆角体系

---

## 布局结构

```
.search-filter-section (flex-direction: column, gap: space-2)
  ├── .sfc-search-bar          ← 搜索栏（不变）
  └── .filter-bar              ← align-items: center (修复关键)
        ├── .filter-bar-label  ← "筛选" 文字标签 (text-xs, muted, uppercase)
        ├── [PopoverSelect 等级]   → .popover-select-container > .filter-trigger
        ├── [PopoverSelect 分类]   → .popover-select-container > .filter-trigger
        ├── [PopoverSelect 评分]   → .popover-select-container > .filter-trigger
        ├── .filter-divider        ← 常驻分隔线（筛选 | 排序）
        ├── [sort trigger button]  ← .filter-trigger.sort-trigger
        ├── .filter-divider        ← 条件分隔线，仅当 hasActiveFilters 时渲染
        └── [clear button]         ← .clear-filters-btn，仅当 hasActiveFilters 时渲染
```

排序面板 `.sort-panel-container` 保持在 `.search-filter-section` 内、`.filter-bar` 下方展开，结构不变。

---

## 条件渲染规则

| 元素 | 显示条件 |
|------|---------|
| `.filter-bar-label` | 始终显示 |
| 三个 `PopoverSelect` | 始终显示 |
| 第一个 `.filter-divider`（筛选/排序之间） | 始终显示 |
| sort trigger button | 始终显示 |
| 第二个 `.filter-divider`（排序/重置之间） | `hasActiveFilters` 为 true 时 |
| `.clear-filters-btn` | `hasActiveFilters` 为 true 时 |

`hasActiveFilters` 定义（与现有代码一致）：
```ts
const hasActiveFilters = searchQuery || selectedCategory || selectedCategoryId || minRating > 0 || hasActiveSorts;
```

---

## `PopoverSelect` 组件变更

**Props 接口不变**，保留全部现有 props：`label`, `icon`, `options`, `selectedId`, `onSelect`, `placeholder`, `isCascaded`。

`label` prop 继续传入，但**用途从独立标签元素改为内嵌进触发按钮文本区域前缀**。具体：将 `.filter-group` wrapper 和独立 `.filter-label` div 删除，触发按钮内部改为：

```tsx
// 改前（外部 wrapper + 独立 label div）
<div className="filter-group size-large">
  <div className="filter-label">{icon} <span>{label}</span></div>
  <div className="popover-select-container">
    <div className="popover-trigger ...">
      <span className="trigger-text">{selectedName}</span>
      <ChevronDown ... />
    </div>
  </div>
</div>

// 改后（无 wrapper，icon+label+value 全在 trigger 内）
<div className="popover-select-container">
  <div className="filter-trigger ..." onClick={toggleMenu}>
    <span className="ft-icon">{icon}</span>
    <span className="ft-label">{label}</span>
    <span className="ft-sep">·</span>
    <span className="ft-value">{selectedName}</span>
    <ChevronDown size={14} className={`ft-chevron ${isOpen ? 'open' : ''}`} />
  </div>
  {isOpen && <div className="popover-menu ...">...</div>}
</div>
```

当 `selectedId` 为空/0/null 时，`ft-value` 显示 `placeholder`（如"全部等级"），样式同 `color-text-muted`；选中后显示选中值，样式同 `color-secondary`。

---

## 新增 CSS 类定义

### `.filter-bar`（修改）

```css
.filter-bar {
  display: flex;
  align-items: center;      /* 修复：从 flex-end 改为 center */
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-top: var(--space-2);
}
```

### `.filter-bar-label`（新增）

```css
.filter-bar-label {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  flex-shrink: 0;
  padding-right: var(--space-1);
}
```

### `.filter-divider`（新增）

```css
.filter-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  flex-shrink: 0;
  margin: 0 var(--space-1);
}
```

### `.filter-trigger`（新增，替代 `.popover-trigger`）

```css
.filter-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: var(--size-md);
  padding: 0 var(--space-3);
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-bottom: 3px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  transition: all var(--duration-fast) var(--ease-out);
  min-width: 0;
}
```

### `.filter-trigger` 内部子类（新增）

```css
.ft-icon {
  display: flex;
  align-items: center;
  color: var(--color-accent);
  flex-shrink: 0;
}
.ft-label {
  font-weight: 700;
  color: var(--color-text);
}
.ft-sep {
  color: var(--color-text-muted);
  opacity: 0.5;
}
.ft-value {
  color: var(--color-text-muted);
  font-weight: 500;
}
.ft-chevron {
  transition: transform var(--duration-fast);
  opacity: 0.45;
  flex-shrink: 0;
}
.ft-chevron.open {
  transform: rotate(180deg);
  opacity: 1;
}
```

### `.filter-trigger` 状态（修改）

```css
.filter-trigger:hover {
  transform: translateY(-2px);
  background: var(--color-background);
  border-color: var(--gray-300);
  box-shadow: var(--shadow-md);
}
.filter-trigger.has-value {
  background: var(--color-info-light);
  border-color: var(--color-accent);
  border-bottom-color: var(--color-secondary);
}
.filter-trigger.has-value .ft-icon  { color: var(--color-secondary); }
.filter-trigger.has-value .ft-label { color: var(--color-secondary); }
.filter-trigger.has-value .ft-value { color: var(--color-secondary); font-weight: 700; }
.filter-trigger.has-value .ft-chevron { opacity: 1; }
.filter-trigger.open {
  transform: translateY(1px);
  border-bottom-width: 2px;
  border-color: var(--color-accent);
  background: var(--color-background);
}
```

### `.clear-filters-btn`（保持类名，移除 wrapper hack）

类名 `.clear-filters-btn` **保持不变**（避免破坏现有 E2E 选择器）。移除包裹它的 `.filter-group.clear-group` div 和 `visibility:hidden` 占位标签。

---

## 图标尺寸

触发按钮内所有图标改为 `size={14}`（对应 `--icon-xs: 14px`，与 `--text-sm: 14px` 配对）：

| 当前 | 改后 | 位置 |
|------|------|------|
| `<BookOpen size={18}/>` | `<BookOpen size={14}/>` | 等级 trigger |
| `<FolderTree size={18}/>` | `<FolderTree size={14}/>` | 分类 trigger |
| `<Star size={18}/>` | `<Star size={14}/>` | 评分 trigger |
| `<ArrowUpDown size={16}/>` | `<ArrowUpDown size={14}/>` | 排序 trigger |
| `<ChevronDown size={14}/>` | `<ChevronDown size={14}/>` | 不变 |

---

## 删除的 CSS 类

以下类从 `SearchAndFilter.css` 完全删除（不再使用）：

- `.filter-group`
- `.filter-group.size-large`
- `.filter-label`
- `.filter-label svg`
- `.filter-label span`
- `.popover-trigger`（被 `.filter-trigger` 替代）
- `.sort-trigger-btn`（被 `.filter-trigger.sort-trigger` 替代）
- `.clear-group`

---

## 测试影响

### 单元测试 (`src/__tests__/components/journals/SearchAndFilter.test.tsx`)

| 旧选择器 | 新选择器 |
|---------|---------|
| `.filter-group` | `.filter-trigger`（或 `.popover-select-container`） |
| `.filter-label` | `.ft-label`（或 `.filter-bar-label`） |
| `.popover-trigger` | `.filter-trigger` |
| `.sort-trigger-btn` | `.filter-trigger.sort-trigger` |
| `.clear-filters-btn` | `.clear-filters-btn`（不变） |

### E2E fixtures (`e2e/fixtures/test-data.ts`)

`search` 对象更新：

```ts
// 旧
filterGroup: '.filter-group',
filterLabel: '.filter-label',
popoverTrigger: '.popover-trigger',

// 新
filterTrigger: '.filter-trigger',
filterBarLabel: '.filter-bar-label',
popoverTrigger: '.filter-trigger',   // 同一元素，保持向后兼容名
```

`clearFiltersBtn: '.clear-filters-btn'` **不变**。

---

## 响应式行为

`flex-wrap: wrap` 已在 `.filter-bar` 保留。窄屏时按钮自动换行，换行后仍 `align-items: center`，各行内居中对齐。

`@media (max-width: 768px)` 块保持现有 `padding` 调整，无需额外变更。

---

## 不在本次范围内

- 下拉菜单（`.popover-menu`）内部样式不变
- 排序面板（`.sort-panel-container`）内部不变
- 搜索栏（`.sfc-search-bar`）不变
- 期刊列表、路由、Context 逻辑不变
