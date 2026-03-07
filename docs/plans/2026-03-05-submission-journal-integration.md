# 投稿追踪系统 - 期刊智能关联与数据整合 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标**: 将投稿追踪系统与期刊评价系统深度整合，提供智能搜索、丰富信息展示和双向快捷入口

**架构**: 组件化重构，创建 JournalPicker（期刊选择器）和 JournalInfoCard（期刊信息卡片）两个核心组件，改造现有 SubmissionTracker 和 JournalDetailPage，实现数据深度整合

**技术栈**: React + TypeScript + Vite, Node.js + Express + Sequelize, MySQL 8.0, Vitest + Playwright

---

## Phase 1: 后端 API 开发

### Task 1: 期刊搜索接口 - 测试先行

**文件**:
- Create: `backend/__tests__/integration/journal-search.test.js`
- Modify: `backend/controllers/journalController.js`
- Modify: `backend/routes/journalRoutes.js`

**Step 1: 编写失败的测试**

```javascript
// backend/__tests__/integration/journal-search.test.js
const request = require('supertest');
const app = require('../../server');
const { Journal } = require('../../models');

describe('Journal Search API', () => {
  beforeEach(async () => {
    // 插入测试数据
    await Journal.bulkCreate([
      { title: 'Nature', issn: '0028-0836', category: 'SCI', rating: 4.5, reviews: 123, dimensionAverages: { reviewSpeed: 3.2, overallExperience: 4.3 } },
      { title: 'Science', issn: '0036-8075', category: 'SCI', rating: 4.4, reviews: 98, dimensionAverages: { reviewSpeed: 3.5, overallExperience: 4.2 } },
      { title: 'Nature Communications', issn: '2041-1723', category: 'SCI', rating: 4.2, reviews: 87, dimensionAverages: { reviewSpeed: 3.8, overallExperience: 4.1 } }
    ]);
  });

  afterEach(async () => {
    await Journal.destroy({ where: {}, truncate: true });
  });

  test('GET /api/journals/search - 成功搜索', async () => {
    const res = await request(app)
      .get('/api/journals/search?q=nature')
      .expect(200);

    expect(res.body.results).toBeInstanceOf(Array);
    expect(res.body.results.length).toBeGreaterThan(0);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.hasMore).toBeDefined();
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
  });

  test('GET /api/journals/search - 关键词少于2字符返回400', async () => {
    const res = await request(app)
      .get('/api/journals/search?q=n')
      .expect(400);

    expect(res.body.message).toContain('至少需要 2 个字符');
  });

  test('GET /api/journals/search - 分类过滤', async () => {
    const res = await request(app)
      .get('/api/journals/search?q=nature&category=SCI')
      .expect(200);

    res.body.results.forEach(j => {
      expect(j.category).toBe('SCI');
    });
  });

  test('GET /api/journals/search - 分页功能', async () => {
    const res = await request(app)
      .get('/api/journals/search?q=a&page=1&limit=2')
      .expect(200);

    expect(res.body.results.length).toBeLessThanOrEqual(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
  });

  test('GET /api/journals/search - ISSN搜索', async () => {
    const res = await request(app)
      .get('/api/journals/search?q=0028')
      .expect(200);

    expect(res.body.results.some(j => j.issn.includes('0028'))).toBe(true);
  });
});
```

**Step 2: 运行测试验证失败**

```bash
cd backend && npm test -- journal-search.test.js
```

预期输出: FAIL - "Cannot GET /api/journals/search"

**Step 3: 实现最小化功能**

```javascript
// backend/controllers/journalController.js
const { Journal } = require('../models');
const { Op } = require('sequelize');

const searchJournals = async (req, res) => {
  try {
    const { q, category, page = 1, limit = 10 } = req.query;

    // 验证关键词长度
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: '搜索关键词至少需要 2 个字符' });
    }

    // 构建查询条件
    const where = {
      [Op.or]: [
        { title: { [Op.like]: `%${q}%` } },
        { issn: { [Op.like]: `%${q}%` } }
      ]
    };

    if (category) {
      where.category = category;
    }

    // 执行查询
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const { rows, count } = await Journal.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [['title', 'ASC']]
    });

    res.json({
      results: rows,
      total: count,
      page: pageNum,
      limit: limitNum,
      hasMore: count > pageNum * limitNum
    });
  } catch (error) {
    console.error('Error searching journals:', error);
    res.status(500).json({ message: '搜索失败' });
  }
};

module.exports = {
  ...module.exports,
  searchJournals
};
```

```javascript
// backend/routes/journalRoutes.js - 添加路由
const { searchJournals } = require('../controllers/journalController');

router.get('/search', searchJournals);
```

**Step 4: 运行测试验证通过**

```bash
cd backend && npm test -- journal-search.test.js
```

预期输出: PASS - 所有 5 个测试通过

**Step 5: 提交**

```bash
git add backend/__tests__/integration/journal-search.test.js backend/controllers/journalController.js backend/routes/journalRoutes.js
git commit -m "feat(api): add journal search endpoint with tests

- GET /api/journals/search with query params (q, category, page, limit)
- Supports fuzzy search on title and ISSN
- Returns paginated results with hasMore flag
- Validates minimum 2 characters for search query"
```

---

### Task 2: 期刊分类接口 - 测试先行

**文件**:
- Modify: `backend/__tests__/integration/journal-search.test.js`
- Modify: `backend/controllers/journalController.js`
- Modify: `backend/routes/journalRoutes.js`

**Step 1: 编写失败的测试**

```javascript
// backend/__tests__/integration/journal-search.test.js - 添加测试
describe('Journal Categories API', () => {
  beforeEach(async () => {
    await Journal.bulkCreate([
      { title: 'Nature', issn: '0028-0836', category: 'SCI', rating: 4.5, reviews: 123, dimensionAverages: {} },
      { title: 'Science', issn: '0036-8075', category: 'SCI', rating: 4.4, reviews: 98, dimensionAverages: {} },
      { title: 'IEEE Trans', issn: '1234-5678', category: 'EI', rating: 4.0, reviews: 50, dimensionAverages: {} }
    ]);
  });

  afterEach(async () => {
    await Journal.destroy({ where: {}, truncate: true });
  });

  test('GET /api/journals/categories - 返回分类列表', async () => {
    const res = await request(app)
      .get('/api/journals/categories')
      .expect(200);

    expect(res.body.categories).toBeInstanceOf(Array);
    expect(res.body.categories.length).toBeGreaterThan(0);
    expect(res.body.categories[0]).toHaveProperty('name');
    expect(res.body.categories[0]).toHaveProperty('count');
  });

  test('GET /api/journals/categories - 按数量降序排序', async () => {
    const res = await request(app)
      .get('/api/journals/categories')
      .expect(200);

    const counts = res.body.categories.map(c => c.count);
    const sortedCounts = [...counts].sort((a, b) => b - a);
    expect(counts).toEqual(sortedCounts);
  });
});
```

**Step 2: 运行测试验证失败**

```bash
cd backend && npm test -- journal-search.test.js
```

预期输出: FAIL - "Cannot GET /api/journals/categories"

**Step 3: 实现最小化功能**

```javascript
// backend/controllers/journalController.js - 添加函数
const { sequelize } = require('../config/database');

const getCategories = async (req, res) => {
  try {
    const categories = await Journal.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['category'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });

    res.json({
      categories: categories.map(c => ({
        name: c.category,
        count: parseInt(c.dataValues.count)
      }))
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ message: '获取分类失败' });
  }
};

module.exports = {
  ...module.exports,
  getCategories
};
```

```javascript
// backend/routes/journalRoutes.js - 添加路由
const { getCategories } = require('../controllers/journalController');

router.get('/categories', getCategories);
```

**Step 4: 运行测试验证通过**

```bash
cd backend && npm test -- journal-search.test.js
```

预期输出: PASS - 所有测试通过

**Step 5: 提交**

```bash
git add backend/__tests__/integration/journal-search.test.js backend/controllers/journalController.js backend/routes/journalRoutes.js
git commit -m "feat(api): add journal categories endpoint

- GET /api/journals/categories returns all categories with counts
- Ordered by count descending
- Includes tests for data validation and sorting"
```

---

## Phase 2: 前端基础组件

### Task 3: Service 层 - journalSearchService

**文件**:
- Create: `src/services/journalSearchService.ts`

**Step 1: 编写 Service 层代码**

```typescript
// src/services/journalSearchService.ts
import axios from 'axios';

export interface JournalSearchParams {
  q: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface JournalSearchResult {
  id: number;
  title: string;
  issn: string;
  category: string;
  rating: number;
  reviews: number;
  description?: string;
  dimensionAverages: {
    reviewSpeed?: number;
    editorAttitude?: number;
    acceptDifficulty?: number;
    reviewQuality?: number;
    overallExperience?: number;
  };
}

export interface JournalSearchResponse {
  results: JournalSearchResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CategoryItem {
  name: string;
  count: number;
}

export interface CategoriesResponse {
  categories: CategoryItem[];
}

export const searchJournals = async (
  params: JournalSearchParams
): Promise<JournalSearchResponse> => {
  const response = await axios.get('/api/journals/search', { params });
  return response.data;
};

export const getCategories = async (): Promise<CategoriesResponse> => {
  const response = await axios.get('/api/journals/categories');
  return response.data;
};
```

**Step 2: 验证 TypeScript 编译**

```bash
npm run type-check
```

预期输出: No errors

**Step 3: 提交**

```bash
git add src/services/journalSearchService.ts
git commit -m "feat(service): add journal search service layer

- Define TypeScript interfaces for search params and responses
- Implement searchJournals and getCategories API calls
- Type-safe service layer for journal operations"
```

---

### Task 4: Custom Hook - useJournalSearch

**文件**:
- Create: `src/hooks/useJournalSearch.ts`

**Step 1: 编写 Hook 代码**

```typescript
// src/hooks/useJournalSearch.ts
import { useState, useCallback, useRef } from 'react';
import { searchJournals, JournalSearchResult } from '../services/journalSearchService';

export const useJournalSearch = () => {
  const [results, setResults] = useState<JournalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(async (
    query: string,
    category?: string,
    isLoadMore = false
  ) => {
    if (query.trim().length < 2) {
      setResults([]);
      setHasMore(false);
      return;
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const response = await searchJournals({
        q: query,
        category,
        page: currentPage,
        limit: 10
      });

      setResults(prev =>
        isLoadMore ? [...prev, ...response.results] : response.results
      );
      setHasMore(response.hasMore);
      setPage(currentPage);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError('搜索失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  const loadMore = useCallback((query: string, category?: string) => {
    if (!loading && hasMore) {
      search(query, category, true);
    }
  }, [loading, hasMore, search]);

  const reset = useCallback(() => {
    setResults([]);
    setPage(1);
    setHasMore(false);
    setError(null);
  }, []);

  return { results, loading, error, hasMore, search, loadMore, reset };
};
```

**Step 2: 验证 TypeScript 编译**

```bash
npm run type-check
```

预期输出: No errors

**Step 3: 提交**

```bash
git add src/hooks/useJournalSearch.ts
git commit -m "feat(hook): add useJournalSearch custom hook

- Manages search state (results, loading, error, pagination)
- Implements request cancellation with AbortController
- Supports load more functionality
- Resets state when needed"
```

---

### Task 5: JournalPicker 组件 - 基础结构

**文件**:
- Create: `src/components/common/JournalPicker.tsx`
- Create: `src/components/common/JournalPicker.css`

**Step 1: 编写组件基础代码**

```typescript
// src/components/common/JournalPicker.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useJournalSearch } from '../../hooks/useJournalSearch';
import { getCategories, CategoryItem, JournalSearchResult } from '../../services/journalSearchService';
import { DIMENSION_LABELS } from '../../types';
import './JournalPicker.css';

interface JournalPickerProps {
  value: JournalSearchResult | null;
  onChange: (journal: JournalSearchResult | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

const JournalPicker: React.FC<JournalPickerProps> = ({
  value,
  onChange,
  placeholder = '搜索期刊名称或ISSN...',
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [displayDimensions, setDisplayDimensions] = useState<string[]>(() => {
    const saved = localStorage.getItem('journalPickerDimensions');
    return saved ? JSON.parse(saved) : ['reviewSpeed', 'overallExperience'];
  });

  const { results, loading, error, hasMore, search, loadMore, reset } = useJournalSearch();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 加载分类
  useEffect(() => {
    getCategories().then(res => setCategories(res.categories));
  }, []);

  // 点击外部关闭下拉列表
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 防抖搜索
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (newValue.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        search(newValue, selectedCategory || undefined);
        setIsOpen(true);
      }, 300);
    } else {
      reset();
      setIsOpen(false);
    }
  };

  // 选中期刊
  const handleSelect = (journal: JournalSearchResult) => {
    onChange(journal);
    setIsOpen(false);
    setInputValue('');
    reset();
  };

  // 清除选择
  const handleClear = () => {
    onChange(null);
  };

  // 切换分类
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    if (inputValue.trim().length >= 2) {
      search(inputValue, category || undefined);
    }
  };

  // 切换维度
  const toggleDimension = (dimension: string) => {
    setDisplayDimensions(prev => {
      let next: string[];
      if (prev.includes(dimension)) {
        next = prev.length > 1 ? prev.filter(d => d !== dimension) : prev;
      } else {
        next = prev.length < 3 ? [...prev, dimension] : prev;
      }
      localStorage.setItem('journalPickerDimensions', JSON.stringify(next));
      return next;
    });
  };

  // 滚动加载更多
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
      if (!loading && hasMore) {
        loadMore(inputValue, selectedCategory || undefined);
      }
    }
  };

  const ALL_DIMENSIONS = [
    { key: 'reviewSpeed', label: '审稿速度' },
    { key: 'editorAttitude', label: '编辑态度' },
    { key: 'acceptDifficulty', label: '录用难度' },
    { key: 'reviewQuality', label: '审稿质量' },
    { key: 'overallExperience', label: '综合体验' }
  ];

  return (
    <div className="journal-picker" ref={dropdownRef}>
      {/* 分类标签 */}
      <div className="category-tabs">
        <button
          className={selectedCategory === null ? 'active' : ''}
          onClick={() => handleCategoryChange(null)}
        >
          全部
        </button>
        {categories.map(cat => (
          <button
            key={cat.name}
            className={selectedCategory === cat.name ? 'active' : ''}
            onClick={() => handleCategoryChange(cat.name)}
          >
            {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      {/* 搜索框 */}
      <div className="search-input-wrapper">
        {value ? (
          <div className="selected-journal">
            <span className="journal-name">{value.title}</span>
            <button className="clear-btn" onClick={handleClear} disabled={disabled}>
              ×
            </button>
          </div>
        ) : (
          <input
            type="text"
            className="search-input"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            disabled={disabled}
          />
        )}
      </div>

      {/* 下拉列表 */}
      {isOpen && !value && (
        <div className="dropdown">
          {/* 维度选择器 */}
          <div className="dimension-selector">
            <span className="selector-label">显示：</span>
            {ALL_DIMENSIONS.map(dim => (
              <button
                key={dim.key}
                className={`dimension-btn ${displayDimensions.includes(dim.key) ? 'active' : ''}`}
                onClick={() => toggleDimension(dim.key)}
              >
                {dim.label}
              </button>
            ))}
          </div>

          {/* 结果列表 */}
          <div className="results-list" onScroll={handleScroll}>
            {error && <div className="error-message">{error}</div>}

            {results.map(journal => (
              <div
                key={journal.id}
                className="journal-item"
                onClick={() => handleSelect(journal)}
              >
                <div className="journal-header">
                  <span className="journal-title">{journal.title}</span>
                  <span className="journal-rating">⭐ {journal.rating.toFixed(1)} ({journal.reviews})</span>
                </div>
                <div className="journal-meta">
                  <span>ISSN: {journal.issn}</span>
                  <span className="separator">|</span>
                  <span>{journal.category}</span>
                </div>
                <div className="journal-dimensions">
                  {displayDimensions.map(dimKey => (
                    <div key={dimKey} className="dimension-row">
                      <span className="dimension-label">{DIMENSION_LABELS[dimKey as keyof typeof DIMENSION_LABELS]}:</span>
                      <div className="dimension-dots">
                        {[1, 2, 3, 4, 5].map(i => (
                          <span
                            key={i}
                            className={`dot ${i <= (journal.dimensionAverages[dimKey as keyof typeof journal.dimensionAverages] || 0) ? 'filled' : ''}`}
                          >
                            ●
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {loading && <div className="loading-message">加载中...</div>}

            {!loading && results.length === 0 && inputValue.trim().length >= 2 && (
              <div className="empty-message">未找到匹配的期刊，试试其他关键词</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalPicker;
```

**Step 2: 编写基础样式**

```css
/* src/components/common/JournalPicker.css */
.journal-picker {
  position: relative;
  width: 100%;
}

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.category-tabs button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.category-tabs button.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.category-tabs button:hover:not(.active) {
  background: var(--color-bg-secondary);
}

/* 搜索框 */
.search-input-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.selected-journal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
}

.selected-journal .journal-name {
  font-weight: 500;
  color: var(--color-primary);
}

.selected-journal .clear-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-journal .clear-btn:hover {
  color: var(--color-danger);
}

/* 下拉列表 */
.dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 450px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 维度选择器 */
.dimension-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.selector-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.dimension-btn {
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.dimension-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.dimension-btn:hover:not(.active) {
  background: var(--color-bg-secondary);
}

/* 结果列表 */
.results-list {
  overflow-y: auto;
  max-height: 350px;
}

.journal-item {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background 0.2s;
}

.journal-item:hover {
  background: var(--color-bg-secondary);
}

.journal-item:last-child {
  border-bottom: none;
}

.journal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.journal-title {
  font-weight: 500;
  font-size: 0.95rem;
}

.journal-rating {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.journal-meta {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 0.75rem;
}

.separator {
  margin: 0 0.5rem;
}

.journal-dimensions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dimension-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.dimension-label {
  width: 80px;
  color: var(--color-text-muted);
}

.dimension-dots {
  display: flex;
  gap: 0.25rem;
}

.dot {
  font-size: 0.875rem;
  color: var(--color-text-lightest);
}

.dot.filled {
  color: var(--color-primary);
}

/* 消息 */
.loading-message,
.empty-message,
.error-message {
  padding: 1.5rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.error-message {
  color: var(--color-danger);
}
```

**Step 3: 验证编译**

```bash
npm run dev
```

预期: 编译成功，无错误

**Step 4: 提交**

```bash
git add src/components/common/JournalPicker.tsx src/components/common/JournalPicker.css
git commit -m "feat(component): add JournalPicker component

- Implements search with 300ms debounce
- Category filtering with dynamic counts
- Customizable dimension display (1-3 dims)
- Scroll-to-load-more pagination
- AbortController for request cancellation
- localStorage for dimension preferences"
```

---

### Task 6: JournalInfoCard 组件

**文件**:
- Create: `src/components/common/JournalInfoCard.tsx`
- Create: `src/components/common/JournalInfoCard.css`

**Step 1: 编写组件代码**

```typescript
// src/components/common/JournalInfoCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DIMENSION_LABELS, DIMENSION_KEYS } from '../../types';
import './JournalInfoCard.css';

interface JournalInfoCardProps {
  journal: {
    id: number;
    title: string;
    issn: string;
    category: string;
    rating: number;
    reviews: number;
    description?: string;
    dimensionAverages: {
      reviewSpeed?: number;
      editorAttitude?: number;
      acceptDifficulty?: number;
      reviewQuality?: number;
      overallExperience?: number;
    };
  };
  isFavorited?: boolean;
  onFavoriteToggle?: () => void;
  className?: string;
}

const JournalInfoCard: React.FC<JournalInfoCardProps> = ({
  journal,
  isFavorited = false,
  onFavoriteToggle,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleTitleClick = () => {
    navigate(`/journals/${journal.id}`);
  };

  const handleViewComments = () => {
    navigate(`/journals/${journal.id}`);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={`journal-info-card ${className}`}>
      {/* 区域1：顶部 - 基本信息 */}
      <div className="card-header">
        <div className="header-left">
          <h4
            className="journal-title"
            onClick={handleTitleClick}
            title={journal.title}
          >
            {truncateText(journal.title, 50)}
          </h4>
          <div className="journal-meta">
            <span className="issn">ISSN: {journal.issn}</span>
            <span className="separator">|</span>
            <span className="category">{journal.category}</span>
          </div>
        </div>
        <div className="header-right">
          <div className="rating">⭐ {journal.rating.toFixed(1)}</div>
          {onFavoriteToggle && (
            <button
              className={`favorite-btn ${isFavorited ? 'active' : ''}`}
              onClick={onFavoriteToggle}
              title={isFavorited ? '取消收藏' : '收藏'}
            >
              {isFavorited ? '★' : '☆'}
            </button>
          )}
        </div>
      </div>

      {/* 区域2：中间 - 5个维度评分 */}
      <div className="dimensions-section">
        {DIMENSION_KEYS.map(key => {
          const value = journal.dimensionAverages[key] || 0;
          return (
            <div key={key} className="dimension-bar">
              <span className="dimension-label">{DIMENSION_LABELS[key]}</span>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{ width: `${(value / 5) * 100}%` }}
                />
              </div>
              <span className="dimension-value">{value.toFixed(1)}</span>
            </div>
          );
        })}
      </div>

      {/* 区域3：底部 - 描述 + 操作 */}
      <div className="card-footer">
        {journal.description && (
          <p className="description" title={journal.description}>
            {journal.description}
          </p>
        )}
        <div className="actions">
          <span className="review-count">{journal.reviews} 条评论</span>
          <button className="view-comments-btn" onClick={handleViewComments}>
            查看评论
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalInfoCard;
```

**Step 2: 编写样式**

```css
/* src/components/common/JournalInfoCard.css */
.journal-info-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 300px;
}

/* 区域1：顶部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.header-left {
  flex: 1;
  min-width: 0;
}

.journal-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--color-primary);
  transition: color 0.2s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.journal-title:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

.journal-meta {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.separator {
  margin: 0 0.5rem;
}

.category {
  font-weight: 500;
  color: var(--color-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.rating {
  font-size: 1rem;
  font-weight: 500;
  white-space: nowrap;
}

.favorite-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: color 0.2s;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.favorite-btn:hover {
  color: var(--color-warning);
}

.favorite-btn.active {
  color: var(--color-warning);
}

/* 区域2：维度评分 */
.dimensions-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.dimension-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dimension-label {
  width: 80px;
  font-size: 0.875rem;
  color: var(--color-text);
  flex-shrink: 0;
}

.bar-container {
  flex: 1;
  height: 8px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-dark));
  transition: width 0.3s ease;
}

.dimension-value {
  width: 32px;
  text-align: right;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

/* 区域3：底部 */
.card-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.review-count {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.view-comments-btn {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s;
}

.view-comments-btn:hover {
  background: var(--color-primary-dark);
}
```

**Step 3: 验证编译**

```bash
npm run dev
```

预期: 编译成功

**Step 4: 提交**

```bash
git add src/components/common/JournalInfoCard.tsx src/components/common/JournalInfoCard.css
git commit -m "feat(component): add JournalInfoCard component

- Three-section layout: header, dimensions, footer
- Displays all 5 dimension ratings with progress bars
- Clickable journal title navigates to detail page
- Favorite toggle with optimistic UI
- Description truncated to 2 lines with tooltip
- View comments button navigates to journal page"
```

---

## Phase 3: 组件集成与现有代码改造

### Task 7: SubmissionTracker - 引入 JournalPicker

**文件**:
- Modify: `src/features/submissions/SubmissionTracker.tsx`

**Step 1: 导入并修改 CreateManuscriptModal**

```typescript
// src/features/submissions/SubmissionTracker.tsx
// 在文件顶部添加导入
import JournalPicker from '../../components/common/JournalPicker';
import type { JournalSearchResult } from '../../services/journalSearchService';

// 修改 CreateManuscriptModal 的 Props
interface CreateManuscriptModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  prefilledJournal?: JournalSearchResult | null;  // 新增
}

// 修改 CreateManuscriptModal 组件
const CreateManuscriptModal: React.FC<CreateManuscriptModalProps> = ({
  onClose,
  onSubmit,
  prefilledJournal = null  // 新增
}) => {
  const [title, setTitle] = useState('');
  const [selectedJournal, setSelectedJournal] = useState<JournalSearchResult | null>(prefilledJournal);  // 修改
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('submitted');
  const [customStatus, setCustomStatus] = useState('');
  const [note, setNote] = useState('');
  const [useCustomStatus, setUseCustomStatus] = useState(false);

  // 如果有预填期刊，自动设置
  useEffect(() => {
    if (prefilledJournal) {
      setSelectedJournal(prefilledJournal);
    }
  }, [prefilledJournal]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      journalId: selectedJournal?.id || undefined,
      journalName: selectedJournal?.title || undefined,
      submissionDate,
      status: useCustomStatus ? customStatus.trim() : status,
      note: note.trim() || undefined
    });
  };

  return (
    <div className="submission-modal-overlay" onClick={onClose}>
      <div className="submission-modal" onClick={e => e.stopPropagation()}>
        <div className="submission-modal-header">
          <h3>📝 新增稿件</h3>
          <button className="submission-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="submission-modal-body">
          <div className="submission-form-group">
            <label>稿件标题 *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="输入你的论文标题"
            />
          </div>

          {/* 替换原有的 input 为 JournalPicker */}
          <div className="submission-form-group">
            <label>投稿期刊</label>
            <JournalPicker
              value={selectedJournal}
              onChange={(journal) => setSelectedJournal(journal)}
              placeholder="搜索期刊名称或ISSN..."
            />
          </div>

          {/* 其余代码保持不变 */}
          <div className="submission-form-group">
            <label>投稿日期</label>
            <input
              type="date"
              value={submissionDate}
              onChange={e => setSubmissionDate(e.target.value)}
            />
          </div>
          {/* ... 其余表单字段 ... */}
        </div>
        <div className="submission-modal-footer">
          <button className="btn-modal-cancel" onClick={onClose}>取消</button>
          <button className="btn-modal-submit" onClick={handleSubmit} disabled={!title.trim()}>
            创建稿件
          </button>
        </div>
      </div>
    </div>
  );
};
```

**Step 2: 验证编译和基本功能**

```bash
npm run dev
```

测试步骤:
1. 打开投稿管理页面
2. 点击"新增稿件"
3. 验证 JournalPicker 显示正常
4. 输入期刊名称测试搜索
5. 选择期刊验证功能

**Step 3: 提交**

```bash
git add src/features/submissions/SubmissionTracker.tsx
git commit -m "feat(submissions): integrate JournalPicker into CreateManuscriptModal

- Replace manual input with JournalPicker component
- Add prefilledJournal prop for URL parameter support
- Auto-populate journal when provided
- Maintain backward compatibility (journalId can be undefined)"
```

---

### Task 8: SubmissionTracker - 添加 URL 参数处理

**文件**:
- Modify: `src/features/submissions/SubmissionTracker.tsx`
- Modify: `src/services/journalService.ts` (如果不存在则创建)

**Step 1: 添加期刊详情获取函数**

```typescript
// src/services/journalService.ts (如果不存在则创建)
import axios from 'axios';
import type { Journal } from '../types';

export const getJournalById = async (id: string | number): Promise<Journal> => {
  const response = await axios.get(`/api/journals/${id}`);
  return response.data;
};
```

**Step 2: 修改 SubmissionTracker 主组件**

```typescript
// src/features/submissions/SubmissionTracker.tsx
// 添加导入
import { useSearchParams } from 'react-router-dom';
import { getJournalById } from '../../services/journalService';
import { useToast } from '../../contexts/ToastContext';  // 假设存在

const SubmissionTracker: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const journalIdParam = searchParams.get('journalId');
  const { toast } = useToast();  // 假设存在toast context

  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // 弹窗状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddSubmissionModal, setShowAddSubmissionModal] = useState<number | null>(null);
  const [showAddStatusModal, setShowAddStatusModal] = useState<number | null>(null);
  const [prefilledJournal, setPrefilledJournal] = useState<JournalSearchResult | null>(null);  // 新增

  // 处理 URL 参数
  useEffect(() => {
    if (journalIdParam) {
      getJournalById(journalIdParam)
        .then(journal => {
          setPrefilledJournal(journal as JournalSearchResult);
          setShowCreateModal(true);
        })
        .catch(err => {
          console.error('Error loading journal:', err);
          toast?.error?.('期刊加载失败');
          setSearchParams({}, { replace: true });
        });
    }
  }, [journalIdParam, setSearchParams, toast]);

  const handleCreateSuccess = async (data: any) => {
    try {
      const result = await createManuscript(data);
      setShowCreateModal(false);
      setPrefilledJournal(null);
      setSearchParams({}, { replace: true });  // 清除 URL 参数
      await loadData();
      setExpandedIds(prev => new Set(prev).add(result.id));
      toast?.success?.('投稿记录已创建');
    } catch (error) {
      console.error('Error creating manuscript:', error);
      toast?.error?.('创建投稿记录失败');
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setPrefilledJournal(null);
    setSearchParams({}, { replace: true });  // 清除 URL 参数
  };

  // ... 其余代码保持不变

  return (
    <div className="submission-section">
      {/* ... */}

      {showCreateModal && (
        <CreateManuscriptModal
          onClose={handleCloseModal}
          onSubmit={handleCreateSuccess}
          prefilledJournal={prefilledJournal}
        />
      )}

      {/* 其余弹窗 */}
    </div>
  );
};
```

**Step 3: 验证功能**

测试URL: `http://localhost:3000/submissions?journalId=1`

预期行为:
1. 自动打开创建弹窗
2. 期刊已预填
3. 创建成功后 URL 参数清除

**Step 4: 提交**

```bash
git add src/features/submissions/SubmissionTracker.tsx src/services/journalService.ts
git commit -m "feat(submissions): add URL parameter handling for journal prefill

- Read journalId from URL query params
- Fetch journal details and prefill modal
- Clear URL params after successful creation
- Handle errors with toast notifications"
```

---

### Task 9: SubmissionTracker - 集成 JournalInfoCard

**文件**:
- Modify: `src/features/submissions/SubmissionTracker.tsx`

**Step 1: 导入并修改 SubmissionItem**

```typescript
// src/features/submissions/SubmissionTracker.tsx
// 添加导入
import JournalInfoCard from '../../components/common/JournalInfoCard';
import { toggleFavorite } from '../../services/favoriteService';  // 假设存在

// 在 SubmissionTracker 主组件中添加收藏处理函数
const handleFavoriteToggle = async (journalId: number) => {
  // 1. 找到当前收藏状态
  let currentFavorited = false;
  manuscripts.forEach(m => {
    m.submissions?.forEach(s => {
      if (s.journal?.id === journalId) {
        currentFavorited = s.journal.isFavorited || false;
      }
    });
  });

  // 2. 乐观更新 UI
  setManuscripts(prev => prev.map(m => ({
    ...m,
    submissions: m.submissions?.map(s =>
      s.journal?.id === journalId
        ? { ...s, journal: { ...s.journal, isFavorited: !currentFavorited } }
        : s
    )
  })));

  try {
    // 3. 调用 API
    await toggleFavorite(journalId);
    toast?.success?.(currentFavorited ? '已取消收藏' : '已收藏');
  } catch (err) {
    // 4. 失败时回滚
    setManuscripts(prev => prev.map(m => ({
      ...m,
      submissions: m.submissions?.map(s =>
        s.journal?.id === journalId
          ? { ...s, journal: { ...s.journal, isFavorited: currentFavorited } }
          : s
      )
    })));
    console.error('Error toggling favorite:', err);
    toast?.error?.('操作失败，请重试');
  }
};

// 修改 SubmissionItem 组件
const SubmissionItem: React.FC<SubmissionItemProps> = ({
  submission,
  onDelete,
  onAddStatus
}) => {
  const journalDisplayName = submission.journal?.title || submission.journalName || '未知期刊';
  const statusColor = getStatusColor(submission.status);

  return (
    <div className="submission-item">
      <div className="submission-item-header">
        <div className="submission-journal-info">
          {/* 替换原有的简单显示 */}
          {submission.journal ? (
            <JournalInfoCard
              journal={submission.journal}
              isFavorited={submission.journal.isFavorited}
              onFavoriteToggle={() => handleFavoriteToggle(submission.journal.id)}
            />
          ) : (
            <div className="unlinked-journal">
              <span className="journal-name">📰 {submission.journalName}</span>
              <button
                className="btn-link-journal"
                onClick={() => {/* TODO: 实现关联功能 */}}
              >
                关联到期刊库
              </button>
            </div>
          )}
        </div>
        <div className="submission-item-actions">
          <button title="删除此投稿" onClick={onDelete}>🗑️</button>
        </div>
      </div>

      {/* 时间轴保持不变 */}
      <div className="submission-timeline">
        {/* ... */}
      </div>

      <button className="timeline-add-btn" onClick={onAddStatus}>
        ＋ 添加状态更新
      </button>
    </div>
  );
};
```

**Step 2: 添加未关联期刊的样式**

```css
/* src/features/submissions/SubmissionTracker.css */
.unlinked-journal {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
}

.journal-name {
  flex: 1;
  font-weight: 500;
}

.btn-link-journal {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.btn-link-journal:hover {
  background: var(--color-primary-dark);
}
```

**Step 3: 验证功能**

测试步骤:
1. 打开投稿管理页
2. 查看已关联期刊的投稿 - 应显示 JournalInfoCard
3. 点击收藏按钮 - 验证乐观更新和 Toast
4. 查看未关联期刊的投稿 - 应显示"关联到期刊库"按钮

**Step 4: 提交**

```bash
git add src/features/submissions/SubmissionTracker.tsx src/features/submissions/SubmissionTracker.css
git commit -m "feat(submissions): integrate JournalInfoCard and favorite toggle

- Display JournalInfoCard for linked journals
- Show link button for unlinked journals
- Implement optimistic favorite toggle with rollback
- Add styles for unlinked journal display"
```

---

### Task 10: JournalDetailPage - 添加"记录投稿"按钮

**文件**:
- Modify: `src/features/journals/pages/JournalDetailPage.tsx`
- Modify: `src/features/journals/pages/JournalDetailPage.css` (或相应样式文件)

**Step 1: 修改页面添加按钮**

```typescript
// src/features/journals/pages/JournalDetailPage.tsx
// 添加导入
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useAuthModal } from '../../../contexts/AuthModalContext';

const JournalDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  // ... 现有代码

  const handleRecordSubmission = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    navigate(`/submissions?journalId=${id}`);
  };

  return (
    <div className="journal-detail-page">
      <div className="page-header">
        <div className="header-left">
          <h1>{journal.title}</h1>
          <div className="meta">
            <span>ISSN: {journal.issn}</span>
            <span className="separator">|</span>
            <span>{journal.category}</span>
          </div>
        </div>
        <button className="record-submission-btn" onClick={handleRecordSubmission}>
          📝 记录投稿
        </button>
      </div>

      {/* 其余内容保持不变 */}
    </div>
  );
};
```

**Step 2: 添加样式**

```css
/* src/features/journals/pages/JournalDetailPage.css */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
  gap: 2rem;
}

.header-left {
  flex: 1;
  min-width: 0;
}

.header-left h1 {
  margin: 0 0 0.5rem 0;
}

.header-left .meta {
  font-size: 0.95rem;
  color: var(--color-text-muted);
}

.separator {
  margin: 0 0.5rem;
}

.record-submission-btn {
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: background 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.record-submission-btn:hover {
  background: var(--color-primary-dark);
}
```

**Step 3: 验证功能**

测试步骤:
1. 未登录状态访问期刊详情页
2. 点击"记录投稿"
3. 验证登录弹窗打开
4. 登录后再次点击
5. 验证跳转到 /submissions?journalId=X
6. 验证弹窗自动打开且期刊已预填

**Step 4: 提交**

```bash
git add src/features/journals/pages/JournalDetailPage.tsx src/features/journals/pages/JournalDetailPage.css
git commit -m "feat(journals): add record submission button to detail page

- Add button to page header aligned with title
- Check authentication before navigation
- Navigate to submissions page with journalId param
- Open auth modal if user not logged in"
```

---

## Phase 4: 测试

### Task 11: 后端集成测试

**文件**:
- Verify: `backend/__tests__/integration/journal-search.test.js`

**Step 1: 运行所有后端测试**

```bash
cd backend && npm test
```

预期输出: 所有测试通过，包括新增的搜索和分类接口测试

**Step 2: 检查测试覆盖率**

```bash
cd backend && npm run test:coverage
```

预期: journalController.js 覆盖率 > 80%

**Step 3: 如果有失败，修复并重新测试**

**Step 4: 提交（如有修复）**

```bash
git add backend/__tests__/integration/journal-search.test.js backend/controllers/journalController.js
git commit -m "test(backend): ensure all journal API tests pass

- Fix any failing tests
- Verify coverage thresholds
- Add edge case tests if needed"
```

---

### Task 12: 前端组件测试 - JournalPicker

**文件**:
- Create: `src/__tests__/components/JournalPicker.test.tsx`

**Step 1: 编写测试**

```typescript
// src/__tests__/components/JournalPicker.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JournalPicker from '../../components/common/JournalPicker';
import * as journalSearchService from '../../services/journalSearchService';

vi.mock('../../services/journalSearchService');

describe('JournalPicker', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('输入2个字符后触发搜索', async () => {
    const mockSearchResults = {
      results: [
        {
          id: 1,
          title: 'Nature',
          issn: '0028-0836',
          category: 'SCI',
          rating: 4.5,
          reviews: 123,
          dimensionAverages: { reviewSpeed: 3.2, overallExperience: 4.3 }
        }
      ],
      total: 1,
      page: 1,
      limit: 10,
      hasMore: false
    };

    vi.mocked(journalSearchService.searchJournals).mockResolvedValue(mockSearchResults);
    vi.mocked(journalSearchService.getCategories).mockResolvedValue({ categories: [] });

    render(<JournalPicker value={null} onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText(/搜索期刊/i);
    fireEvent.change(input, { target: { value: 'na' } });

    await waitFor(() => {
      expect(journalSearchService.searchJournals).toHaveBeenCalledWith({
        q: 'na',
        category: undefined,
        page: 1,
        limit: 10
      });
    }, { timeout: 500 });
  });

  test('选中期刊后调用 onChange 并关闭下拉列表', async () => {
    const mockSearchResults = {
      results: [
        {
          id: 1,
          title: 'Nature',
          issn: '0028-0836',
          category: 'SCI',
          rating: 4.5,
          reviews: 123,
          dimensionAverages: {}
        }
      ],
      total: 1,
      page: 1,
      limit: 10,
      hasMore: false
    };

    vi.mocked(journalSearchService.searchJournals).mockResolvedValue(mockSearchResults);
    vi.mocked(journalSearchService.getCategories).mockResolvedValue({ categories: [] });

    render(<JournalPicker value={null} onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText(/搜索期刊/i);
    fireEvent.change(input, { target: { value: 'nature' } });

    await waitFor(() => screen.getByText('Nature'));

    const journalItem = screen.getByText('Nature');
    fireEvent.click(journalItem);

    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ title: 'Nature' }));
  });

  test('维度切换保存到 localStorage', async () => {
    vi.mocked(journalSearchService.getCategories).mockResolvedValue({ categories: [] });

    render(<JournalPicker value={null} onChange={mockOnChange} />);

    // 触发搜索打开下拉列表
    const input = screen.getByPlaceholderText(/搜索期刊/i);
    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(() => screen.getByText(/显示/i));

    const dimensionBtn = screen.getByText('录用难度');
    fireEvent.click(dimensionBtn);

    const saved = localStorage.getItem('journalPickerDimensions');
    expect(saved).toBeTruthy();
    const parsed = JSON.parse(saved!);
    expect(parsed).toContain('acceptDifficulty');
  });
});
```

**Step 2: 运行测试**

```bash
npm test -- JournalPicker.test.tsx
```

预期输出: 所有测试通过

**Step 3: 提交**

```bash
git add src/__tests__/components/JournalPicker.test.tsx
git commit -m "test(frontend): add JournalPicker component tests

- Test search trigger with 2+ characters
- Test selection and onChange callback
- Test dimension toggle and localStorage
- Mock journal search service"
```

---

### Task 13: 前端组件测试 - JournalInfoCard

**文件**:
- Create: `src/__tests__/components/JournalInfoCard.test.tsx`

**Step 1: 编写测试**

```typescript
// src/__tests__/components/JournalInfoCard.test.tsx
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import JournalInfoCard from '../../components/common/JournalInfoCard';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('JournalInfoCard', () => {
  const mockJournal = {
    id: 1,
    title: 'Nature',
    issn: '0028-0836',
    category: 'SCI',
    rating: 4.5,
    reviews: 123,
    description: '顶级综合性科学期刊',
    dimensionAverages: {
      reviewSpeed: 3.2,
      editorAttitude: 4.1,
      acceptDifficulty: 4.8,
      reviewQuality: 4.5,
      overallExperience: 4.3
    }
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('渲染全部5个维度评分', () => {
    render(
      <BrowserRouter>
        <JournalInfoCard journal={mockJournal} />
      </BrowserRouter>
    );

    expect(screen.getByText('审稿速度')).toBeInTheDocument();
    expect(screen.getByText('编辑态度')).toBeInTheDocument();
    expect(screen.getByText('录用难度')).toBeInTheDocument();
    expect(screen.getByText('审稿质量')).toBeInTheDocument();
    expect(screen.getByText('综合体验')).toBeInTheDocument();
  });

  test('点击期刊名称跳转详情页', () => {
    render(
      <BrowserRouter>
        <JournalInfoCard journal={mockJournal} />
      </BrowserRouter>
    );

    const titleElement = screen.getByText('Nature');
    fireEvent.click(titleElement);

    expect(mockNavigate).toHaveBeenCalledWith('/journals/1');
  });

  test('收藏按钮切换状态', () => {
    const onToggle = vi.fn();

    const { rerender } = render(
      <BrowserRouter>
        <JournalInfoCard
          journal={mockJournal}
          isFavorited={false}
          onFavoriteToggle={onToggle}
        />
      </BrowserRouter>
    );

    const btn = screen.getByTitle('收藏');
    expect(btn).toHaveTextContent('☆');

    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalled();

    rerender(
      <BrowserRouter>
        <JournalInfoCard
          journal={mockJournal}
          isFavorited={true}
          onFavoriteToggle={onToggle}
        />
      </BrowserRouter>
    );

    expect(btn).toHaveTextContent('★');
  });

  test('显示描述并截断', () => {
    render(
      <BrowserRouter>
        <JournalInfoCard journal={mockJournal} />
      </BrowserRouter>
    );

    expect(screen.getByText(/顶级综合性科学期刊/)).toBeInTheDocument();
  });
});
```

**Step 2: 运行测试**

```bash
npm test -- JournalInfoCard.test.tsx
```

预期输出: 所有测试通过

**Step 3: 提交**

```bash
git add src/__tests__/components/JournalInfoCard.test.tsx
git commit -m "test(frontend): add JournalInfoCard component tests

- Test 5 dimension ratings render
- Test title click navigation
- Test favorite toggle state
- Test description display"
```

---

### Task 14: E2E 测试 - 完整流程

**文件**:
- Create: `e2e/tests/journal-submission-integration.spec.ts`

**Step 1: 编写 E2E 测试**

```typescript
// e2e/tests/journal-submission-integration.spec.ts
import { test, expect } from '@playwright/test';

test('完整流程：浏览期刊 → 记录投稿 → 查看投稿记录', async ({ page }) => {
  // 1. 登录
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/');

  // 2. 浏览期刊详情页
  await page.goto('/journals/1');
  await expect(page.locator('h1')).toContainText('Nature');

  // 3. 点击"记录投稿"
  await page.click('button:has-text("记录投稿")');
  await expect(page).toHaveURL(/\/submissions\?journalId=1/);

  // 4. 自动打开弹窗并验证期刊预填
  await expect(page.locator('.submission-modal')).toBeVisible();
  await expect(page.locator('.selected-journal')).toContainText('Nature');

  // 5. 填写表单并提交
  await page.fill('[name="title"]', 'My Research Paper on Climate Change');
  await page.fill('[name="submissionDate"]', '2025-01-15');
  await page.click('button:has-text("创建稿件")');

  // 6. 验证成功 Toast
  await expect(page.locator('.toast-success')).toContainText('投稿记录已创建');

  // 7. 验证 URL 参数已清除
  await expect(page).toHaveURL('/submissions');

  // 8. 验证投稿记录显示
  await expect(page.locator('.manuscript-card')).toContainText('My Research Paper on Climate Change');

  // 9. 验证 JournalInfoCard 显示
  await expect(page.locator('.journal-info-card')).toBeVisible();
  await expect(page.locator('.journal-info-card h4')).toContainText('Nature');
  await expect(page.locator('.dimension-bar')).toHaveCount(5);

  // 10. 测试收藏功能
  const favoriteBtn = page.locator('.favorite-btn').first();
  await favoriteBtn.click();
  await expect(page.locator('.toast-success')).toContainText('已收藏');
  await expect(favoriteBtn).toHaveText('★');
});

test('期刊搜索自动补全功能', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.goto('/submissions');
  await page.click('button:has-text("新增稿件")');

  // 输入搜索关键词
  const searchInput = page.locator('.journal-picker input[type="text"]');
  await searchInput.fill('nat');

  // 等待下拉列表出现
  await expect(page.locator('.dropdown')).toBeVisible({ timeout: 1000 });
  await expect(page.locator('.journal-item')).toHaveCount(3, { timeout: 2000 });

  // 点击选择期刊
  await page.click('.journal-item:has-text("Nature")');

  // 验证选中状态
  await expect(page.locator('.selected-journal')).toContainText('Nature');
});
```

**Step 2: 运行 E2E 测试**

```bash
npm run test:e2e
```

预期输出: 所有测试通过

**Step 3: 提交**

```bash
git add e2e/tests/journal-submission-integration.spec.ts
git commit -m "test(e2e): add journal-submission integration tests

- Test full flow: journal detail -> record submission
- Verify URL parameter handling and prefill
- Test JournalPicker autocomplete
- Test JournalInfoCard display and favorite toggle"
```

---

## Phase 5: 文档与收尾

### Task 15: 更新 CLAUDE.md

**文件**:
- Modify: `CLAUDE.md`

**Step 1: 更新文档**

在"功能模块导航"中的"投稿追踪系统"部分更新：

```markdown
### 📝 投稿追踪系统 (Updated)
**状态**: ✅ 已完成（已整合期刊智能关联）
**功能**: 稿件管理、多次投稿、状态时间轴、**期刊智能搜索、数据深度整合**
**新增特性**:
- **期刊智能搜索**: 支持期刊名称/ISSN 模糊搜索，300ms 防抖，滚动加载更多
- **JournalPicker 组件**: 分类过滤、自定义维度显示（1-3个）、localStorage 持久化偏好
- **JournalInfoCard 组件**: 展示 5 维度评分、收藏快捷操作、点击跳转详情页
- **双向快捷入口**: 期刊详情页 ↔ 投稿记录页
- **URL 参数传递**: 从期刊页跳转自动预填期刊信息

**关键文件**:
- 前端组件: `src/components/common/JournalPicker.*`, `src/components/common/JournalInfoCard.*`
- Hook: `src/hooks/useJournalSearch.ts`
- Service: `src/services/journalSearchService.ts`
- 页面: `src/features/submissions/SubmissionTracker.tsx`, `src/features/journals/pages/JournalDetailPage.tsx`
- 后端: `backend/routes/journalRoutes.js`, `backend/controllers/journalController.js`
- 测试: `backend/__tests__/integration/journal-search.test.js`, `e2e/tests/journal-submission-integration.spec.ts`

**API 路由**:
```
GET    /api/journals/search?q=nature&category=SCI&page=1&limit=10  # 期刊搜索
GET    /api/journals/categories                                     # 获取分类列表
```
```

**Step 2: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with journal integration features

- Document new JournalPicker and JournalInfoCard components
- Add API routes for search and categories
- Update submission tracker feature description
- Add file references and testing info"
```

---

### Task 16: 最终验证与部署准备

**Step 1: 运行所有测试**

```bash
# 后端测试
cd backend && npm test

# 前端测试
npm test

# E2E 测试
npm run test:e2e
```

预期: 所有测试通过

**Step 2: 类型检查**

```bash
npm run type-check
```

预期: 无错误

**Step 3: Lint 检查**

```bash
npm run lint
```

预期: 无错误或警告

**Step 4: 构建验证**

```bash
npm run build
```

预期: 构建成功

**Step 5: 手动功能测试清单**

- [ ] 期刊搜索（输入2字符、分类过滤、滚动加载）
- [ ] 维度切换（1-3个维度，localStorage 持久化）
- [ ] 创建投稿（使用 JournalPicker）
- [ ] 查看投稿（JournalInfoCard 显示）
- [ ] 收藏切换（乐观更新、Toast 提示）
- [ ] 期刊详情页"记录投稿"（未登录提示、已登录跳转）
- [ ] URL 参数处理（自动打开弹窗、预填期刊、参数清除）
- [ ] 未关联期刊显示"关联到期刊库"按钮

**Step 6: 最终提交**

```bash
git add .
git commit -m "chore: final verification and cleanup

- All tests passing (backend, frontend, e2e)
- Type check passed
- Lint passed
- Build verified
- Manual testing completed"
```

---

## 实施完成

计划完成，已保存到 `docs/plans/2026-03-05-submission-journal-integration.md`。

**两种执行选项**:

**1. Subagent-Driven (当前会话)** - 我在当前会话中派发新的子代理执行每个任务，任务间有代码审查，快速迭代

**2. Parallel Session (单独会话)** - 在新会话中使用 executing-plans skill，批量执行并设置检查点

你选择哪种方式？
