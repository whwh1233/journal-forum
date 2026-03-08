import React from 'react';
import { Search, X, BookOpen, Star, ArrowUpDown, ChevronDown, FolderTree } from 'lucide-react';
import { useJournals } from '@/hooks/useJournals';
import { DIMENSION_LABELS } from '@/types';
import './SearchAndFilter.css';

const SearchAndFilter: React.FC = () => {
  const {
    searchQuery,
    selectedCategory, // 等级筛选
    selectedCategoryId, // 分类筛选
    minRating,
    sortBy,
    levels,           // 从 context 获取的动态等级列表
    categories,       // 分类树
    setSearchQuery,
    setSelectedCategory,
    setSelectedCategoryId,
    setMinRating,
    setSortBy,
    clearFilters
  } = useJournals();

  const hasActiveFilters = searchQuery || selectedCategory || selectedCategoryId || minRating > 0 || sortBy;

  // 获取选中分类的名称（用于显示标签）
  const getSelectedCategoryName = (): string | null => {
    if (!selectedCategoryId || !categories) return null;
    for (const parent of categories) {
      if (parent.id === selectedCategoryId) return parent.name;
      const child = parent.children?.find(c => c.id === selectedCategoryId);
      if (child) return child.name;
    }
    return null;
  };

  const ratingLabels: Record<number, string> = {
    0: '所有评分',
    2: '2星以上',
    3: '3星以上',
    4: '4星以上'
  };

  return (
    <section className="search-filter-section" aria-label="搜索和筛选期刊">
      {/* 搜索栏 */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            id="journal-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索期刊名称、ISSN 或学科等级..."
            className="search-input"
            aria-label="搜索期刊名称、ISSN 或学科等级"
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="清除搜索"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="filter-bar" role="group" aria-label="筛选选项">
        <div className="filter-group">
          <label htmlFor="level-filter" className="filter-label">
            <BookOpen size={16} />
            等级
          </label>
          <div className="select-wrapper">
            <select
              id="level-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`filter-select ${selectedCategory ? 'has-value' : ''}`}
              aria-label="按等级筛选"
            >
              <option value="">全部</option>
              {levels && levels.map((level) => (
                <option key={level.name} value={level.name}>
                  {level.name} ({level.count})
                </option>
              ))}
            </select>
            <ChevronDown className="select-arrow" size={14} />
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="category-filter" className="filter-label">
            <FolderTree size={16} />
            分类
          </label>
          <div className="select-wrapper">
            <select
              id="category-filter"
              value={selectedCategoryId || ''}
              onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
              className={`filter-select ${selectedCategoryId ? 'has-value' : ''}`}
              aria-label="按分类筛选"
            >
              <option value="">全部分类</option>
              {categories && categories.map((parent) => (
                <optgroup key={parent.id} label={parent.name}>
                  {parent.children?.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name} ({child.journalCount || 0})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="select-arrow" size={14} />
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="rating-filter" className="filter-label">
            <Star size={16} />
            评分
          </label>
          <div className="select-wrapper">
            <select
              id="rating-filter"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className={`filter-select ${minRating > 0 ? 'has-value' : ''}`}
              aria-label="按最低评分筛选"
            >
              <option value="0">全部</option>
              <option value="4">4星以上</option>
              <option value="3">3星以上</option>
              <option value="2">2星以上</option>
            </select>
            <ChevronDown className="select-arrow" size={14} />
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="sort-filter" className="filter-label">
            <ArrowUpDown size={16} />
            排序
          </label>
          <div className="select-wrapper">
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`filter-select ${sortBy ? 'has-value' : ''}`}
              aria-label="按维度排序"
            >
              <option value="">默认</option>
              <option value="rating">综合评分</option>
              <option value="reviewSpeed">审稿速度</option>
              <option value="editorAttitude">编辑态度</option>
              <option value="acceptDifficulty">录用难度</option>
              <option value="reviewQuality">审稿质量</option>
              <option value="overallExperience">综合体验</option>
            </select>
            <ChevronDown className="select-arrow" size={14} />
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="clear-filters-btn"
            aria-label="清除所有筛选条件"
          >
            <X size={14} />
            清除
          </button>
        )}
      </div>

      {/* 已选筛选标签 */}
      {hasActiveFilters && (
        <div className="active-filters">
          {searchQuery && (
            <span className="filter-tag">
              <Search size={12} />
              "{searchQuery}"
              <button onClick={() => setSearchQuery('')} aria-label="移除搜索条件">
                <X size={10} />
              </button>
            </span>
          )}
          {selectedCategory && (
            <span className="filter-tag">
              <BookOpen size={12} />
              {selectedCategory}
              <button onClick={() => setSelectedCategory('')} aria-label="移除等级筛选">
                <X size={10} />
              </button>
            </span>
          )}
          {selectedCategoryId && (
            <span className="filter-tag">
              <FolderTree size={12} />
              {getSelectedCategoryName()}
              <button onClick={() => setSelectedCategoryId(null)} aria-label="移除分类筛选">
                <X size={10} />
              </button>
            </span>
          )}
          {minRating > 0 && (
            <span className="filter-tag">
              <Star size={12} />
              {ratingLabels[minRating]}
              <button onClick={() => setMinRating(0)} aria-label="移除评分筛选">
                <X size={10} />
              </button>
            </span>
          )}
          {sortBy && (
            <span className="filter-tag">
              <ArrowUpDown size={12} />
              {sortBy === 'rating' ? '综合评分' : (DIMENSION_LABELS[sortBy] || sortBy)}
              <button onClick={() => setSortBy('')} aria-label="移除排序">
                <X size={10} />
              </button>
            </span>
          )}
        </div>
      )}
    </section>
  );
};

export default SearchAndFilter;