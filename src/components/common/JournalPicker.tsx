import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useJournalSearch } from '../../hooks/useJournalSearch';
import { getCategories, getLevels, CategoryItem, LevelItem, JournalSearchResult } from '../../services/journalSearchService';
import { DIMENSION_LABELS } from '../../types';
import { createCustomJournal, isCustomJournal } from './journalPickerUtils';
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
  placeholder = '输入期刊名称、ISSN 或刊号搜索...',
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // 等级筛选状态
  const [levels, setLevels] = useState<LevelItem[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [isLevelsExpanded, setIsLevelsExpanded] = useState(false);

  // 学科分类筛选状态
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('全部学科');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<CategoryItem | null>(null);

  // 维度显示设置
  const [displayDimensions, setDisplayDimensions] = useState<string[]>(() => {
    const saved = localStorage.getItem('journalPickerDimensions');
    return saved ? JSON.parse(saved) : ['reviewSpeed', 'overallExperience'];
  });

  const { results, loading, error, hasMore, search, loadMore, reset } = useJournalSearch();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 加载等级和分类数据
  useEffect(() => {
    getLevels().then(res => setLevels(res.levels)).catch(err => {
      console.error('Error loading levels:', err);
    });
    getCategories().then(res => setCategories(res.categories)).catch(err => {
      console.error('Error loading categories:', err);
    });
  }, []);

  // 点击外部关闭下拉列表和分类菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setIsCategoryMenuOpen(false);
        setHoveredCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 触发搜索
  const triggerSearch = (query: string, level: string | null, categoryId: number | null) => {
    if (query.trim().length >= 1) {
      search(query, level || undefined, categoryId || undefined);
      setIsOpen(true);
    }
  };

  // 防抖搜索
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (newValue.trim().length >= 1) {
      debounceTimerRef.current = setTimeout(() => {
        triggerSearch(newValue, selectedLevel, selectedCategoryId);
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

  // 使用自定义名称
  const handleUseCustomName = () => {
    if (inputValue.trim()) {
      const customJournal = createCustomJournal(inputValue);
      onChange(customJournal);
      setIsOpen(false);
      setInputValue('');
      reset();
    }
  };

  // 清除选择
  const handleClear = () => {
    onChange(null);
  };

  // 切换等级筛选
  const handleLevelChange = (level: string | null) => {
    setSelectedLevel(level);
    if (inputValue.trim().length >= 1) {
      triggerSearch(inputValue, level, selectedCategoryId);
    }
  };

  // 选择学科分类（一级或二级）
  const handleCategorySelect = (categoryId: number | null, categoryName: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName);
    setIsCategoryMenuOpen(false);
    setHoveredCategory(null);
    if (inputValue.trim().length >= 1) {
      triggerSearch(inputValue, selectedLevel, categoryId);
    }
  };

  // 计算一级分类的期刊总数
  const getCategoryTotalCount = (category: CategoryItem): number => {
    return category.children.reduce((sum, child) => sum + child.journalCount, 0);
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
        loadMore(inputValue, selectedLevel || undefined, selectedCategoryId || undefined);
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

  // 显示的等级数量（折叠时显示前8个）
  const COLLAPSED_LEVEL_COUNT = 8;
  const displayedLevels = isLevelsExpanded ? levels : levels.slice(0, COLLAPSED_LEVEL_COUNT);
  const hasMoreLevels = levels.length > COLLAPSED_LEVEL_COUNT;

  return (
    <div className="journal-picker" ref={dropdownRef}>
      {/* 等级筛选 */}
      <div className="filter-section">
        <span className="filter-label">等级筛选：</span>
        <div className={`level-tabs ${isLevelsExpanded ? 'expanded' : ''}`}>
          <button
            type="button"
            className={`filter-btn ${selectedLevel === null ? 'active' : ''}`}
            onClick={() => handleLevelChange(null)}
          >
            全部
          </button>
          {displayedLevels.map(level => (
            <button
              type="button"
              key={level.name}
              className={`filter-btn ${selectedLevel === level.name ? 'active' : ''}`}
              onClick={() => handleLevelChange(level.name)}
            >
              {level.name}({level.count})
            </button>
          ))}
          {hasMoreLevels && (
            <button
              type="button"
              className="expand-btn"
              onClick={() => setIsLevelsExpanded(!isLevelsExpanded)}
            >
              {isLevelsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {isLevelsExpanded ? '收起' : `更多(${levels.length - COLLAPSED_LEVEL_COUNT})`}
            </button>
          )}
        </div>
      </div>

      {/* 学科分类筛选 */}
      <div className="filter-section">
        <span className="filter-label">学科分类：</span>
        <div className="category-selector" ref={categoryMenuRef}>
          <button
            type="button"
            className={`category-trigger ${isCategoryMenuOpen ? 'open' : ''}`}
            onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
          >
            <span>{selectedCategoryName}</span>
            <ChevronDown size={14} className={`arrow ${isCategoryMenuOpen ? 'rotated' : ''}`} />
          </button>

          {isCategoryMenuOpen && (
            <div className="category-menu">
              <div className="category-list">
                {/* 全部选项 */}
                <div
                  className={`category-item ${selectedCategoryId === null ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(null, '全部学科')}
                >
                  全部学科
                </div>

                {/* 一级分类列表 */}
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    className={`category-item ${selectedCategoryId === cat.id ? 'active' : ''} ${hoveredCategory?.id === cat.id ? 'hovered' : ''}`}
                    onMouseEnter={() => setHoveredCategory(cat)}
                    onClick={() => handleCategorySelect(cat.id, cat.name)}
                  >
                    <span>{cat.name}</span>
                    <span className="count">({getCategoryTotalCount(cat)})</span>
                    {cat.children.length > 0 && <ChevronDown size={12} className="submenu-arrow" />}
                  </div>
                ))}
              </div>

              {/* 二级分类悬浮面板 */}
              {hoveredCategory && hoveredCategory.children.length > 0 && (
                <div className="subcategory-panel">
                  <div className="subcategory-header">{hoveredCategory.name}</div>
                  <div className="subcategory-list">
                    {hoveredCategory.children.map(child => (
                      <div
                        key={child.id}
                        className={`subcategory-item ${selectedCategoryId === child.id ? 'active' : ''}`}
                        onClick={() => handleCategorySelect(child.id, `${hoveredCategory.name} > ${child.name}`)}
                      >
                        <span>{child.name}</span>
                        <span className="count">({child.journalCount})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 搜索框 */}
      <div className="search-input-wrapper">
        {value ? (
          <div className={`selected-journal ${isCustomJournal(value) ? 'custom' : ''}`}>
            <div className="journal-name-wrapper">
              <span className="journal-name">{value.name || value.title}</span>
              {isCustomJournal(value) && <span className="custom-badge">自定义</span>}
            </div>
            <button type="button" className="clear-btn" onClick={handleClear} disabled={disabled}>
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
            onKeyDown={e => {
              // 阻止 Enter 键触发表单提交
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            disabled={disabled}
          />
        )}
      </div>

      {/* 下拉列表 */}
      {isOpen && !value && (
        <div className="dropdown" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
          {/* 维度选择器 */}
          <div className="dimension-selector">
            <span className="selector-label">显示：</span>
            {ALL_DIMENSIONS.map(dim => (
              <button
                type="button"
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
                key={journal.journalId || journal.id}
                className="journal-item"
                onClick={() => handleSelect(journal)}
              >
                <div className="journal-header">
                  <span className="journal-title">{journal.name || journal.title}</span>
                  <span className="journal-rating">⭐ {journal.rating.toFixed(1)} ({journal.reviews})</span>
                </div>
                <div className="journal-meta">
                  <span>ISSN: {journal.issn}</span>
                  <span className="separator">|</span>
                  <span>{journal.levels?.join(', ') || journal.category}</span>
                </div>
                <div className="journal-dimensions">
                  {displayDimensions.map(dimKey => {
                    const dimValue = journal.dimensionAverages?.[dimKey as keyof typeof journal.dimensionAverages] || 0;
                    return (
                      <div key={dimKey} className="dimension-row">
                        <span className="dimension-label">{DIMENSION_LABELS[dimKey as keyof typeof DIMENSION_LABELS]}:</span>
                        <div className="dimension-dots">
                          {[1, 2, 3, 4, 5].map(i => (
                            <span
                              key={i}
                              className={`dot ${i <= dimValue ? 'filled' : ''}`}
                            >
                              ●
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {loading && <div className="loading-message">加载中...</div>}

            {/* 搜索无结果时的提示和自定义选项 */}
            {!loading && results.length === 0 && inputValue.trim().length >= 1 && (
              <div className="no-results-section">
                <div className="empty-message">在期刊库中未找到匹配结果</div>
                <button type="button" className="use-custom-btn" onClick={handleUseCustomName}>
                  <Plus size={16} />
                  <span>使用「{inputValue.trim()}」作为期刊名称</span>
                </button>
              </div>
            )}

            {/* 有结果时也显示自定义选项 */}
            {!loading && results.length > 0 && inputValue.trim().length >= 1 && (
              <div className="custom-option-footer">
                <button type="button" className="use-custom-btn secondary" onClick={handleUseCustomName}>
                  <Plus size={14} />
                  <span>找不到？使用「{inputValue.trim()}」</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalPicker;
