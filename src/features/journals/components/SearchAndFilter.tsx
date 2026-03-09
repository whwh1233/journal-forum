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

  const selectedName = useMemo(() => {
    if (selectedId === null || selectedId === undefined || selectedId === '' || selectedId === 0) return placeholder;
    for (const opt of options) {
      if (opt.id === selectedId) return opt.name;
      const child = opt.children?.find(c => c.id === selectedId);
      if (child) return child.name;
    }
    return placeholder;
  }, [selectedId, options, placeholder]);

  const hoveredParent = options.find(o => o.id === hoveredParentId);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    if (!isOpen) setHoveredParentId(null);
  };

  return (
    <div className="filter-group size-large" ref={containerRef}>
      <div className="filter-label">{icon} <span>{label}</span></div>
      <div className="popover-select-container">
        <div
          className={`popover-trigger ${selectedId && selectedId !== '0' && selectedId !== 0 ? 'has-value' : ''} ${isOpen ? 'open' : ''}`}
          onClick={toggleMenu}
        >
          <span className="trigger-text">{selectedName}</span>
          <ChevronDown size={14} className={`arrow ${isOpen ? 'open' : ''}`} />
        </div>

        {isOpen && (
          <div className={`popover-menu ${isCascaded ? 'cascaded' : ''}`}>
            <div className="menu-column main-column">
              <div
                className={`menu-item ${!selectedId || selectedId === '0' || selectedId === 0 ? 'active' : ''}`}
                onClick={() => { onSelect(isCascaded ? null : (typeof options[0]?.id === 'number' ? 0 : '')); setIsOpen(false); }}
              >
                <span className="item-text">{isCascaded ? '全部分类' : '全部'}</span>
                {(!selectedId || selectedId === '0' || selectedId === 0) && <Check size={14} className="check-icon" />}
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
        <PopoverSelect
          label="等级"
          icon={<BookOpen size={18} />}
          options={levelOptions}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
          placeholder="全部等级"
        />

        <PopoverSelect
          label="分类"
          icon={<FolderTree size={18} />}
          options={categoryOptions}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
          placeholder="全部分类"
          isCascaded={true}
        />

        <PopoverSelect
          label="评分"
          icon={<Star size={18} />}
          options={ratingOptions}
          selectedId={minRating}
          onSelect={setMinRating}
          placeholder="全部评分"
        />

        <div className="filter-group size-large">
          <div className="filter-label"><ArrowUpDown size={16} /> <span>排序功能</span></div>
          <button
            className={`sort-trigger-btn ${hasActiveSorts ? 'has-value' : ''} ${sortExpanded ? 'open' : ''}`}
            onClick={() => setSortExpanded(!sortExpanded)}
          >
            <span className="trigger-text">{hasActiveSorts ? '多维度排序' : '配置排序'}</span>
            <ChevronDown size={14} className={`arrow ${sortExpanded ? 'open' : ''}`} />
          </button>
        </div>

        {hasActiveFilters && (
          <div className="filter-group clear-group">
            <div className="filter-label" style={{ visibility: 'hidden' }}><X size={16} /> <span>占位</span></div>
            <button onClick={clearFilters} className="clear-filters-btn">
              <X size={14} /> <span>重置筛选</span>
            </button>
          </div>
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
