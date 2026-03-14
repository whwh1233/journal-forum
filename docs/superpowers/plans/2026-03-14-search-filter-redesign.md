# SearchAndFilter 重设计实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 SearchAndFilter 组件的垂直/水平居中问题，将 label+trigger 分离布局改为 icon+label 内嵌于触发按钮，用分隔线分组，对齐设计规范。

**Architecture:** 仅改动前端两个文件（TSX + CSS）。PopoverSelect 的 props 接口不变，内部 JSX 结构重构；filter-bar 的 align-items 从 flex-end 改为 center，旧 `.filter-group`/`.filter-label`/`.popover-trigger` 体系被新 `.filter-trigger` + ft-* 子类替代。

**Tech Stack:** React 18 + TypeScript + Vite, CSS Variables (src/styles/global.css), Lucide React icons, Vitest

---

## 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 修改 | `src/features/journals/components/SearchAndFilter.tsx` | 重构 PopoverSelect + SearchAndFilter JSX |
| 修改 | `src/features/journals/components/SearchAndFilter.css` | 替换 filter-group/label/trigger 类，新增 filter-divider/bar-label/ft-* |
| 修改 | `src//__tests__/components/journals/SearchAndFilter.test.tsx` | 修复 2 处 "排序功能" 文本断言 |
| 修改 | `e2e/fixtures/test-data.ts` | 更新 filterGroup、filterLabel、popoverTrigger、sortTrigger 选择器 |

**不改动：** 后端任何文件；JournalContext；useJournals hook；popover-menu 内部；sort-panel-container 内部；sfc-search-bar。

---

## Chunk 1: CSS 重写

### Task 1: 重写 SearchAndFilter.css

**Files:**
- Modify: `src/features/journals/components/SearchAndFilter.css`

- [ ] **Step 1: 用新 CSS 完整替换文件**

将文件内容替换为以下完整内容（保留不变部分，删除旧类，新增新类）：

```css
:root {
  --filter-primary: var(--color-accent);
  --filter-secondary: var(--color-secondary);
  --filter-bg-light: var(--color-surface);
  --filter-border-color: var(--color-border);
  --filter-text-main: var(--color-text);
  --filter-text-muted: var(--color-text-muted);
}

/* Root section wrapper */
.search-filter-section {
  width: 100%;
  max-width: 1200px;
  margin: var(--space-1) auto var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--color-background);
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: all var(--duration-normal) var(--ease-in-out);
}

/* --- Search Bar --- */
.sfc-search-bar {
  width: 100%;
}

.sfc-search-inner {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.sfc-search-input {
  width: 100%;
  height: var(--size-md);
  padding-left: var(--space-8);
  padding-right: var(--space-8);
  border: 1.5px solid var(--color-border);
  border-bottom: 3px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background: var(--color-surface);
  color: var(--color-text);
  transition: all var(--duration-fast) var(--ease-in-out);
}

.sfc-search-input:focus {
  outline: none;
  border-color: var(--color-accent);
  border-bottom-color: var(--color-secondary);
  background: var(--color-background);
  box-shadow: var(--focus-ring);
}

.sfc-search-icon {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sfc-search-clear {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  background: var(--color-surface);
  border: none;
  border-radius: 50%;
  width: var(--size-xs);
  height: var(--size-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.sfc-search-clear:hover {
  background: var(--color-error-light);
  color: var(--color-error);
}

/* --- Filter Bar Layout (核心修复) --- */
.filter-bar {
  display: flex;
  align-items: center;        /* 修复：从 flex-end 改为 center */
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-top: var(--space-2);
}

/* "筛选" 文字标签 */
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

/* 分隔线 */
.filter-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  flex-shrink: 0;
  margin: 0 var(--space-1);
}

/* --- Filter Trigger (替代 .popover-trigger + .sort-trigger-btn) --- */
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
  font-family: inherit;
}

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

.filter-trigger.open {
  transform: translateY(1px);
  border-bottom-width: 2px;
  border-color: var(--color-accent);
  background: var(--color-background);
}

/* ft-* 内部子元素 */
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
  font-weight: 400;
}

.ft-value {
  color: var(--color-text-muted);
  font-weight: 500;
}

.ft-chevron {
  transition: transform var(--duration-fast);
  opacity: 0.45;
  flex-shrink: 0;
  margin-left: var(--space-1);
}

.ft-chevron.open {
  transform: rotate(180deg);
  opacity: 1;
}

/* 激活状态下 ft-* 颜色 */
.filter-trigger.has-value .ft-icon   { color: var(--color-secondary); }
.filter-trigger.has-value .ft-label  { color: var(--color-secondary); }
.filter-trigger.has-value .ft-value  { color: var(--color-secondary); font-weight: 700; }
.filter-trigger.has-value .ft-chevron { opacity: 1; }

/* --- Popover Select Container --- */
.popover-select-container {
  position: relative;
  user-select: none;
}

/* --- Absolute Menu (不变) --- */
.popover-menu {
  position: absolute;
  top: calc(100% + var(--space-3));
  left: 0;
  display: flex;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: var(--z-dropdown);
  animation: popoverIn var(--duration-slow) var(--ease-out);
  overflow: hidden;
  min-width: 180px;
}

@keyframes popoverIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.menu-column {
  padding: var(--space-3);
  max-height: 450px;
  overflow-y: auto;
  min-width: 180px;
}

.menu-item {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-base);
  transition: all var(--duration-fast);
  color: var(--color-text-muted);
}

.menu-item:hover {
  background: var(--color-surface);
  color: var(--color-accent);
}

.menu-item.active {
  background: var(--color-info-light);
  color: var(--color-secondary);
  font-weight: 700;
}

.cascaded .main-column {
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
}

/* --- Sort Panel (不变) --- */
.sort-panel-container {
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  box-shadow: var(--shadow-lg);
  margin-top: var(--space-1);
  animation: fadeScaleIn var(--duration-normal) var(--ease-out);
}

@keyframes fadeScaleIn {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.sort-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.header-info .title {
  font-size: var(--text-base);
  font-weight: 800;
  color: var(--color-text);
}

.header-info .desc {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.close-panel-btn {
  background: var(--color-surface);
  border: none;
  border-radius: 50%;
  width: var(--size-sm);
  height: var(--size-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: all var(--duration-fast);
}

.close-panel-btn:hover {
  background: var(--color-error-light);
  color: var(--color-error);
}

.sort-field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: var(--space-2);
}

.sort-item-card {
  position: relative;
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-bottom: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-in-out);
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sort-item-card:hover {
  transform: translateY(-1.5px);
  background: var(--color-background);
  border-color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

.sort-item-card.active {
  border-color: var(--color-accent);
  border-bottom-color: var(--color-secondary);
  background: var(--color-info-light);
}

.sort-item-card.active .field-name {
  color: var(--color-secondary);
  font-weight: 700;
}

.field-name {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-text-muted);
}

.sort-status {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.sort-item-card.active .sort-status {
  color: var(--color-accent);
}

.active-glow {
  position: absolute;
  top: -1.5px;
  left: -1.5px;
  right: -1.5px;
  bottom: -1.5px;
  border-radius: var(--radius-md);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.08);
  pointer-events: none;
}

/* --- Reset Filter Button --- */
.clear-filters-btn {
  height: var(--size-md);
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-error-light);
  background: var(--color-background);
  color: var(--color-error);
  font-weight: 700;
  font-size: var(--text-sm);
  font-family: inherit;
  transition: all var(--duration-fast);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
}

.clear-filters-btn:hover {
  background: var(--color-error);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .search-filter-section {
    padding: var(--space-4);
  }

  .filter-bar {
    gap: var(--space-2);
  }
}
```

- [ ] **Step 2: 验证旧 CSS 类已删除**

以下类不应存在于新文件中，逐一确认：
- `.filter-group` ✗
- `.filter-label` ✗
- `.popover-trigger` ✗
- `.sort-trigger-btn` ✗
- `.clear-group` ✗

---

## Chunk 2: TSX 重写

### Task 2: 重写 SearchAndFilter.tsx

**Files:**
- Modify: `src/features/journals/components/SearchAndFilter.tsx`

- [ ] **Step 1: 重写完整文件内容**

```tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, BookOpen, Star, ArrowUpDown, ChevronDown, FolderTree, ArrowDown, ArrowUp, Circle, Check, ChevronRight } from 'lucide-react';
import { useJournals } from '@/hooks/useJournals';
import { SORT_FIELD_PRIORITY, SORT_FIELD_LABELS } from '@/contexts/JournalContext';
import './SearchAndFilter.css';

interface Option {
  id: string | number;
  name: string;
  children?: Option[];
}

interface PopoverSelectProps {
  label: string;
  icon: React.ReactNode;
  options: Option[];
  selectedId: string | number | null;
  onSelect: (id: any) => void;
  placeholder?: string;
  isCascaded?: boolean;
}

const PopoverSelect: React.FC<PopoverSelectProps> = ({
  label, icon, options, selectedId, onSelect, placeholder = '请选择', isCascaded = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredParentId, setHoveredParentId] = useState<string | number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasValue = selectedId !== null && selectedId !== undefined && selectedId !== '' && selectedId !== 0;

  const selectedName = useMemo(() => {
    if (!hasValue) return placeholder;
    for (const opt of options) {
      if (opt.id === selectedId) return opt.name;
      const child = opt.children?.find(c => c.id === selectedId);
      if (child) return child.name;
    }
    return placeholder;
  }, [selectedId, options, placeholder, hasValue]);

  const hoveredParent = options.find(o => o.id === hoveredParentId);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    if (!isOpen) setHoveredParentId(null);
  };

  return (
    <div className="popover-select-container" ref={containerRef}>
      <div
        className={`filter-trigger ${hasValue ? 'has-value' : ''} ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
      >
        <span className="ft-icon">{icon}</span>
        <span className="ft-label">{label}</span>
        <span className="ft-sep">·</span>
        <span className="ft-value">{selectedName}</span>
        <ChevronDown size={14} className={`ft-chevron ${isOpen ? 'open' : ''}`} />
      </div>

      {isOpen && (
        <div className={`popover-menu ${isCascaded ? 'cascaded' : ''}`}>
          <div className="menu-column main-column">
            <div
              className={`menu-item ${!hasValue ? 'active' : ''}`}
              onClick={() => { onSelect(isCascaded ? null : (typeof options[0]?.id === 'number' ? 0 : '')); setIsOpen(false); }}
            >
              <span className="item-text">{isCascaded ? '全部分类' : '全部'}</span>
              {!hasValue && <Check size={14} className="check-icon" />}
            </div>
            {options.map(opt => (
              <div
                key={opt.id}
                className={`menu-item ${hoveredParentId === opt.id ? 'hovered' : ''} ${selectedId === opt.id ? 'active' : ''}`}
                onMouseEnter={() => isCascaded && setHoveredParentId(opt.id)}
                onClick={() => {
                  onSelect(opt.id);
                  setIsOpen(false);
                }}
              >
                <span className="item-text">{opt.name}</span>
                {isCascaded && opt.children && opt.children.length > 0 && <ChevronRight size={14} className="sub-arrow" />}
                {(!isCascaded && selectedId === opt.id) && <Check size={14} className="check-icon" />}
              </div>
            ))}
          </div>

          {isCascaded && hoveredParent && hoveredParent.children && hoveredParent.children.length > 0 && (
            <div className="menu-column sub-column">
              {hoveredParent.children.map(child => (
                <div
                  key={child.id}
                  className={`menu-item ${selectedId === child.id ? 'active' : ''}`}
                  onClick={() => { onSelect(child.id); setIsOpen(false); }}
                >
                  <span className="item-text">{child.name}</span>
                  {selectedId === child.id && <Check size={14} className="check-icon" />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SearchAndFilter: React.FC = () => {
  const {
    searchQuery,
    selectedCategory,
    selectedCategoryId,
    minRating,
    sortFields,
    sortExpanded,
    hasActiveSorts,
    levels,
    categories,
    setSearchQuery,
    setSelectedCategory,
    setSelectedCategoryId,
    setMinRating,
    toggleSortField,
    setSortExpanded,
    clearFilters
  } = useJournals();

  const hasActiveFilters = searchQuery || selectedCategory || selectedCategoryId || minRating > 0 || hasActiveSorts;

  const getSortIcon = (field: string) => {
    const order = sortFields[field];
    if (order === 'desc') return <ArrowDown size={14} className="sort-icon desc" />;
    if (order === 'asc') return <ArrowUp size={14} className="sort-icon asc" />;
    return <Circle size={10} className="sort-icon none" />;
  };

  const levelOptions = useMemo(() => levels?.map(l => ({ id: l.name, name: l.name })) || [], [levels]);
  const ratingOptions = [
    { id: 4, name: '4星以上' },
    { id: 3, name: '3星以上' },
    { id: 2, name: '2星以上' }
  ];
  const categoryOptions = useMemo(() => categories?.map(c => ({
    id: c.id,
    name: c.name,
    children: c.children?.map(child => ({ id: child.id, name: child.name }))
  })) || [], [categories]);

  return (
    <section className="search-filter-section" aria-label="搜索和筛选期刊">
      <div className="sfc-search-bar">
        <div className="sfc-search-inner">
          <Search className="sfc-search-icon" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索期刊名称、ISSN 或学科等级..."
            className="sfc-search-input"
          />
          {searchQuery && (
            <button className="sfc-search-clear" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="filter-bar">
        <span className="filter-bar-label">筛选</span>

        <PopoverSelect
          label="等级"
          icon={<BookOpen size={14} />}
          options={levelOptions}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
          placeholder="全部等级"
        />

        <PopoverSelect
          label="分类"
          icon={<FolderTree size={14} />}
          options={categoryOptions}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
          placeholder="全部分类"
          isCascaded={true}
        />

        <PopoverSelect
          label="评分"
          icon={<Star size={14} />}
          options={ratingOptions}
          selectedId={minRating}
          onSelect={setMinRating}
          placeholder="全部评分"
        />

        <div className="filter-divider" />

        <button
          className={`filter-trigger${hasActiveSorts ? ' has-value' : ''}${sortExpanded ? ' open' : ''}`}
          onClick={() => setSortExpanded(!sortExpanded)}
        >
          <span className="ft-icon"><ArrowUpDown size={14} /></span>
          <span className="ft-label">排序</span>
          <span className="ft-sep">·</span>
          <span className="ft-value">{hasActiveSorts ? '多维度排序' : '配置排序'}</span>
          <ChevronDown size={14} className={`ft-chevron${sortExpanded ? ' open' : ''}`} />
        </button>

        {hasActiveFilters && (
          <>
            <div className="filter-divider" />
            <button onClick={clearFilters} className="clear-filters-btn">
              <X size={14} /> <span>重置筛选</span>
            </button>
          </>
        )}
      </div>

      {sortExpanded && (
        <div className="sort-panel-container">
          <div className="sort-panel-header">
            <div className="header-info">
              <span className="title">排序配置管理</span>
              <span className="desc">支持多重排序组合，点击卡片进行切换控制</span>
            </div>
            <button className="close-panel-btn" onClick={() => setSortExpanded(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="sort-field-grid">
            {SORT_FIELD_PRIORITY.map((field) => {
              const order = sortFields[field];
              const isActive = !!order;
              return (
                <button
                  key={field}
                  className={`sort-item-card ${isActive ? `active ${order}` : ''}`}
                  onClick={() => toggleSortField(field)}
                >
                  <div className="sort-item-content">
                    <span className="field-name">{SORT_FIELD_LABELS[field]}</span>
                    <div className="sort-status">
                      {getSortIcon(field)}
                      <span className="status-text">{order === 'desc' ? '降序排列' : order === 'asc' ? '升序排列' : '暂未启用'}</span>
                    </div>
                  </div>
                  {isActive && <div className="active-glow" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default SearchAndFilter;
```

- [ ] **Step 2: TypeScript 类型检查**

运行：`npx tsc --noEmit --project D:\claude\journal-forum\tsconfig.json`

预期：无错误输出（或只有不相关的其他文件报错）

---

## Chunk 3: 测试修复

### Task 3: 修复单元测试中的文本断言

**Files:**
- Modify: `src/__tests__/components/journals/SearchAndFilter.test.tsx`

背景：原来 sort 按钮的 `.filter-label` 显示 "排序功能"，新设计改为 `.ft-label` 显示 "排序"。有两处测试会断言 "排序功能"。

- [ ] **Step 1: 修复 Sort Panel describe 里的断言 (line 253)**

将：
```ts
expect(screen.getByText('排序功能')).toBeInTheDocument();
```
改为：
```ts
expect(screen.getByText('排序')).toBeInTheDocument();
```

- [ ] **Step 2: 修复 Accessibility describe 里的断言 (line 430)**

将：
```ts
expect(screen.getByText('排序功能')).toBeInTheDocument();
```
改为：
```ts
expect(screen.getByText('排序')).toBeInTheDocument();
```

注意：`screen.getByText('排序')` 会匹配 `.ft-label` 内的文字，但要注意避免歧义。如果在同一个 test case 里有多个包含 "排序" 的元素（比如排序面板展开时的卡片），确保此 test case 中 `sortExpanded: false`（默认值），这样只有 trigger 的 ft-label 会显示 "排序"，不会有歧义。

- [ ] **Step 3: 运行单元测试**

```bash
cd D:\claude\journal-forum && npm test -- --run src/__tests__/components/journals/SearchAndFilter.test.tsx
```

预期：所有测试通过（xx passed, 0 failed）

---

### Task 4: 更新 E2E 测试 fixtures

**Files:**
- Modify: `e2e/fixtures/test-data.ts`

- [ ] **Step 1: 更新 search 对象选择器**

找到 `e2e/fixtures/test-data.ts` 中的 `search:` 对象，将：

```ts
filterGroup: '.filter-group',
filterLabel: '.filter-label',
popoverTrigger: '.popover-trigger',
sortTrigger: '.sort-trigger-btn',
```

改为：

```ts
filterTrigger: '.filter-trigger',
filterBarLabel: '.filter-bar-label',
popoverTrigger: '.filter-trigger',
sortTrigger: '.filter-trigger',
```

`clearFiltersBtn: '.clear-filters-btn'` 保持不变。

---

## Chunk 4: 运行测试 & 提交

### Task 5: 全量测试 & 提交

**Files:** 无新文件

- [ ] **Step 1: 运行全部前端单元测试**

```bash
cd D:\claude\journal-forum && npm test -- --run
```

预期：全部通过，原有 101 个用例不减少。

- [ ] **Step 2: 目视验证（可选）**

启动 dev server：`npm run dev`，在浏览器打开 `http://localhost:3000`，确认：
1. filter-bar 内所有按钮垂直居中
2. 每个 trigger 显示 `[icon] [label] · [value] [chevron]`
3. 分隔线正确显示
4. 选中筛选项后触发按钮变蓝
5. 排序面板展开/关闭正常
6. 重置按钮在有激活筛选时显示，点击后消失

- [ ] **Step 3: 提交**

```bash
cd D:\claude\journal-forum
git add src/features/journals/components/SearchAndFilter.tsx \
        src/features/journals/components/SearchAndFilter.css \
        src/__tests__/components/journals/SearchAndFilter.test.tsx \
        e2e/fixtures/test-data.ts
git commit -m "feat: redesign SearchAndFilter layout — fix vertical alignment, embed labels in triggers"
```
