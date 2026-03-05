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
    getCategories().then(res => setCategories(res.categories)).catch(err => {
      console.error('Error loading categories:', err);
    });
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
