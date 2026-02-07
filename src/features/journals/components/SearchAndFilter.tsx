import React from 'react';
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

  return (
    <section className="search-section" aria-label="搜索和筛选期刊">
      <div className="search-container">
        <label htmlFor="journal-search" className="visually-hidden">
          搜索期刊
        </label>
        <input
          id="journal-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索期刊名称、ISSN 或学科领域..."
          className="search-input"
          aria-label="搜索期刊名称、ISSN 或学科领域"
        />
        <button className="search-button" aria-label="执行搜索">
          搜索
        </button>
      </div>
      <div className="filter-container" role="group" aria-label="筛选选项">
        <label htmlFor="category-filter" className="visually-hidden">
          按学科筛选
        </label>
        <select
          id="category-filter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="filter-select"
          aria-label="按学科分类筛选"
        >
          <option value="">所有学科</option>
          {Object.entries(categoryMap).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
        <label htmlFor="rating-filter" className="visually-hidden">
          按评分筛选
        </label>
        <select
          id="rating-filter"
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="filter-select"
          aria-label="按最低评分筛选"
        >
          <option value="0">所有评分</option>
          <option value="4">4星以上</option>
          <option value="3">3星以上</option>
          <option value="2">2星以上</option>
        </select>
        <button
          onClick={clearFilters}
          className="clear-filters-button"
          aria-label="清除所有筛选条件"
        >
          清除筛选
        </button>
      </div>
    </section>
  );
};

export default SearchAndFilter;