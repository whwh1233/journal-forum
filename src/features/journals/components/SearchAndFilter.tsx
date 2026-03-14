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
  onSelect: (id: string | number | null) => void;
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

  // selectedId === 0 is the "no filter" sentinel for the minRating (numeric) filter
  const hasValue = selectedId !== null && selectedId !== undefined && selectedId !== '' && selectedId !== 0;

  const selectedName = useMemo(() => {
    if (!hasValue) return placeholder;
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
    <div className="popover-select-container" ref={containerRef}>
      <button
        type="button"
        className={`filter-trigger${hasValue ? ' has-value' : ''}${isOpen ? ' open' : ''}`}
        onClick={toggleMenu}
      >
        <span className="ft-icon">{icon}</span>
        <span className="ft-label">{label}</span>
        <span className="ft-sep">·</span>
        <span className="ft-value">{selectedName}</span>
        <ChevronDown size={14} className={`ft-chevron ${isOpen ? 'open' : ''}`} />
      </button>

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

const RATING_OPTIONS: Option[] = [
  { id: 4, name: '4星以上' },
  { id: 3, name: '3星以上' },
  { id: 2, name: '2星以上' },
];

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

  const levelOptions = useMemo(() => levels?.map(l => ({ id: l.name, name: l.name })) || [], [levels]);
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
          options={RATING_OPTIONS}
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
            <span className="header-label">排序</span>
            <button className="close-panel-btn" onClick={() => setSortExpanded(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="sort-field-grid">
            {SORT_FIELD_PRIORITY.map((field) => {
              const order = sortFields[field];
              const isActive = !!order;
              return (
                <button
                  key={field}
                  className={`sort-item-card${isActive ? ` active ${order}` : ' inactive'}`}
                  onClick={() => toggleSortField(field)}
                >
                  <span className="field-name">{SORT_FIELD_LABELS[field]}</span>
                  {order === 'desc' ? <ArrowDown size={13} className="sort-icon" /> :
                   order === 'asc'  ? <ArrowUp size={13} className="sort-icon" /> :
                                      <Circle size={10} className="sort-icon" />}
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
