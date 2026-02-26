import React from 'react';
import { Search, X, BookOpen, Star, ChevronDown } from 'lucide-react';
import { useJournals } from '@/hooks/useJournals';
import { categoryMap } from '@/services/journalService';
import './SearchAndFilter.css';

const SearchAndFilter: React.FC = () => {
  const {
    searchQuery,
    selectedCategory,
    minRating,
    setSearchQuery,
    setSelectedCategory,
    setMinRating,
    clearFilters
  } = useJournals();

  const hasActiveFilters = searchQuery || selectedCategory || minRating > 0;

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
            placeholder="搜索期刊名称、ISSN 或学科领域..."
            className="search-input"
            aria-label="搜索期刊名称、ISSN 或学科领域"
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
          <label htmlFor="category-filter" className="filter-label">
            <BookOpen size={16} />
            学科
          </label>
          <div className="select-wrapper">
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`filter-select ${selectedCategory ? 'has-value' : ''}`}
              aria-label="按学科分类筛选"
            >
              <option value="">全部</option>
              {Object.entries(categoryMap).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
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
              {categoryMap[selectedCategory]}
              <button onClick={() => setSelectedCategory('')} aria-label="移除学科筛选">
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
        </div>
      )}
    </section>
  );
};

export default SearchAndFilter;