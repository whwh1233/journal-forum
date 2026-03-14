import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useJournals } from '@/hooks/useJournals';
import SearchAndFilter from '@/features/journals/components/SearchAndFilter';

// Mock the useJournals hook
const mockSetSearchQuery = vi.fn();
const mockSetSelectedCategory = vi.fn();
const mockSetSelectedCategoryId = vi.fn();
const mockSetMinRating = vi.fn();
const mockToggleSortField = vi.fn();
const mockSetSortExpanded = vi.fn();
const mockClearFilters = vi.fn();

vi.mock('@/hooks/useJournals', () => ({
  useJournals: vi.fn()
}));

// Mock JournalContext
vi.mock('@/contexts/JournalContext', () => ({
  SORT_FIELD_PRIORITY: ['commentCount', 'impactFactor', 'rating', 'overallExperience', 'reviewSpeed', 'editorAttitude', 'acceptDifficulty', 'reviewQuality'],
  SORT_FIELD_LABELS: {
    commentCount: '评论数',
    impactFactor: '影响因子',
    rating: '综合评分',
    overallExperience: '综合体验',
    reviewSpeed: '审稿速度',
    editorAttitude: '编辑态度',
    acceptDifficulty: '录用难度',
    reviewQuality: '审稿质量'
  }
}));

const mockLevels = [
  { name: 'SCI', count: 100 },
  { name: 'EI', count: 50 },
  { name: 'CSSCI', count: 30 }
];

const mockCategories = [
  {
    id: 1,
    name: 'Science',
    children: [
      { id: 11, name: 'Computer Science' },
      { id: 12, name: 'Physics' }
    ]
  },
  {
    id: 2,
    name: 'Humanities',
    children: [
      { id: 21, name: 'History' },
      { id: 22, name: 'Philosophy' }
    ]
  }
];

const defaultUseJournalsReturn = {
  searchQuery: '',
  selectedCategory: '',
  selectedCategoryId: null,
  minRating: 0,
  sortFields: {},
  sortExpanded: false,
  hasActiveSorts: false,
  levels: mockLevels,
  categories: mockCategories,
  setSearchQuery: mockSetSearchQuery,
  setSelectedCategory: mockSetSelectedCategory,
  setSelectedCategoryId: mockSetSelectedCategoryId,
  setMinRating: mockSetMinRating,
  toggleSortField: mockToggleSortField,
  setSortExpanded: mockSetSortExpanded,
  clearFilters: mockClearFilters
};

describe('SearchAndFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useJournals).mockReturnValue(defaultUseJournalsReturn);
  });

  describe('Search Input', () => {
    it('should render search input', () => {
      render(<SearchAndFilter />);

      const searchInput = screen.getByPlaceholderText(/搜索期刊名称/);
      expect(searchInput).toBeInTheDocument();
    });

    it('should call setSearchQuery when typing in search input', () => {
      render(<SearchAndFilter />);

      const searchInput = screen.getByPlaceholderText(/搜索期刊名称/);
      fireEvent.change(searchInput, { target: { value: 'nature' } });

      expect(mockSetSearchQuery).toHaveBeenCalledWith('nature');
    });

    it('should display current search query value', () => {
      vi.mocked(useJournals).mockReturnValue({
        ...defaultUseJournalsReturn,
        searchQuery: 'test query'
      });

      render(<SearchAndFilter />);

      const searchInput = screen.getByPlaceholderText(/搜索期刊名称/);
      expect(searchInput).toHaveValue('test query');
    });

    it('should show clear button when search query is not empty', () => {
      vi.mocked(useJournals).mockReturnValue({
        ...defaultUseJournalsReturn,
        searchQuery: 'test'
      });

      const { container } = render(<SearchAndFilter />);

      const clearButton = container.querySelector('.sfc-search-clear');
      expect(clearButton).toBeInTheDocument();
    });

    it('should clear search query when clear button is clicked', () => {
      vi.mocked(useJournals).mockReturnValue({
        ...defaultUseJournalsReturn,
        searchQuery: 'test'
      });

      const { container } = render(<SearchAndFilter />);

      const clearButton = container.querySelector('.sfc-search-clear');
      if (clearButton) {
        fireEvent.click(clearButton);
      }

      expect(mockSetSearchQuery).toHaveBeenCalledWith('');
    });
  });

  describe('Level Filter', () => {
    it('should render level filter', () => {
      render(<SearchAndFilter />);

      expect(screen.getByText('等级')).toBeInTheDocument();
    });

    it('should open level dropdown when clicked', () => {
      render(<SearchAndFilter />);

      const levelTrigger = screen.getByText('全部等级');
      fireEvent.click(levelTrigger);

      expect(screen.getByText('SCI')).toBeInTheDocument();
      expect(screen.getByText('EI')).toBeInTheDocument();
      expect(screen.getByText('CSSCI')).toBeInTheDocument();
    });

    it('should call setSelectedCategory when level is selected', async () => {
      render(<SearchAndFilter />);

      const levelTrigger = screen.getByText('全部等级');
      fireEvent.click(levelTrigger);

      const sciOption = screen.getByText('SCI');
      fireEvent.click(sciOption);

      expect(mockSetSelectedCategory).toHaveBeenCalledWith('SCI');
    });
  });

  describe('Category Filter', () => {
    it('should render category filter', () => {
      render(<SearchAndFilter />);

      expect(screen.getByText('分类')).toBeInTheDocument();
    });

    it('should open cascaded category dropdown when clicked', () => {
      render(<SearchAndFilter />);

      const categoryTrigger = screen.getByText('全部分类');
      fireEvent.click(categoryTrigger);

      expect(screen.getByText('Science')).toBeInTheDocument();
      expect(screen.getByText('Humanities')).toBeInTheDocument();
    });

    it('should show subcategories when hovering over parent category', async () => {
      render(<SearchAndFilter />);

      const categoryTrigger = screen.getByText('全部分类');
      fireEvent.click(categoryTrigger);

      const scienceOption = screen.getByText('Science');
      fireEvent.mouseEnter(scienceOption);

      await waitFor(() => {
        expect(screen.getByText('Computer Science')).toBeInTheDocument();
        expect(screen.getByText('Physics')).toBeInTheDocument();
      });
    });

    it('should call setSelectedCategoryId when category is selected', () => {
      render(<SearchAndFilter />);

      const categoryTrigger = screen.getByText('全部分类');
      fireEvent.click(categoryTrigger);

      const scienceOption = screen.getByText('Science');
      fireEvent.click(scienceOption);

      expect(mockSetSelectedCategoryId).toHaveBeenCalledWith(1);
    });
  });

  describe('Rating Filter', () => {
    it('should render rating filter', () => {
      render(<SearchAndFilter />);

      expect(screen.getByText('评分')).toBeInTheDocument();
    });

    it('should open rating dropdown when clicked', () => {
      render(<SearchAndFilter />);

      const ratingTrigger = screen.getByText('全部评分');
      fireEvent.click(ratingTrigger);

      expect(screen.getByText('4星以上')).toBeInTheDocument();
      expect(screen.getByText('3星以上')).toBeInTheDocument();
      expect(screen.getByText('2星以上')).toBeInTheDocument();
    });

    it('should call setMinRating when rating option is selected', () => {
      render(<SearchAndFilter />);

      const ratingTrigger = screen.getByText('全部评分');
      fireEvent.click(ratingTrigger);

      const fourStarOption = screen.getByText('4星以上');
      fireEvent.click(fourStarOption);

      expect(mockSetMinRating).toHaveBeenCalledWith(4);
    });
  });

  describe('Sort Panel', () => {
    it('should render sort button', () => {
      render(<SearchAndFilter />);

      expect(screen.getByText('排序')).toBeInTheDocument();
    });

    it('should toggle sort panel when sort button is clicked', () => {
      render(<SearchAndFilter />);

      const sortButton = screen.getByText('配置排序');
      fireEvent.click(sortButton);

      expect(mockSetSortExpanded).toHaveBeenCalledWith(true);
    });

    it('should display sort panel when sortExpanded is true', () => {
      vi.mocked(useJournals).mockReturnValue({
        ...defaultUseJournalsReturn,
        sortExpanded: true
      });

      render(<SearchAndFilter />);

      expect(screen.getByText('排序配置管理')).toBeInTheDocument();
      expect(screen.getByText('评论数')).toBeInTheDocument();
      expect(screen.getByText('影响因子')).toBeInTheDocument();
      expect(screen.getByText('综合评分')).toBeInTheDocument();
    });

    it('should call toggleSortField when sort field is clicked', () => {
      vi.mocked(useJournals).mockReturnValue({
        ...defaultUseJournalsReturn,
        sortExpanded: true
      });

      render(<SearchAndFilter />);

      const commentCountSort = screen.getByText('评论数').closest('button');
      if (commentCountSort) {
        fireEvent.click(commentCountSort);
      }

      expect(mockToggleSortField).toHaveBeenCalledWith('commentCount');
    });

    it('should show active state for active sort fields', () => {
      vi.mocked(useJournals).mockReturnValue({
        ...defaultUseJournalsReturn,
        sortExpanded: true,
        sortFields: { commentCount: 'desc' }
      });

      const { container } = render(<SearchAndFilter />);

      const activeCard = container.querySelector('.sort-item-card.active');
      expect(activeCard).toBeInTheDocument();
    });

    it('should display descending icon for desc sort order', () => {
      vi.mocked(useJournals).mockReturnValue({
        ...defaultUseJournalsReturn,
        sortExpanded: true,
        sortFields: { commentCount: 'desc' }
      });

      render(<SearchAndFilter />);

      expect(screen.getByText('降序排列')).toBeInTheDocument();
    });

    it('should display ascending icon for asc sort order', () => {
      vi.mocked(useJournals).mockReturnValue({
        ...defaultUseJournalsReturn,
        sortExpanded: true,
        sortFields: { commentCount: 'asc' }
      });

      render(<SearchAndFilter />);

      expect(screen.getByText('升序排列')).toBeInTheDocument();
    });

    it('should close sort panel when close button is clicked', () => {
      vi.mocked(useJournals).mockReturnValue({
        ...defaultUseJournalsReturn,
        sortExpanded: true
      });

      const { container } = render(<SearchAndFilter />);

      const closeButton = container.querySelector('.close-panel-btn');
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      expect(mockSetSortExpanded).toHaveBeenCalledWith(false);
    });
  });

  describe('Clear Filters', () => {
    it('should not show clear button when no filters are active', () => {
      render(<SearchAndFilter />);

      expect(screen.queryByText(/重置筛选/)).not.toBeInTheDocument();
    });

    it('should show clear button when search query is active', () => {
      vi.mocked(useJournals).mockReturnValue({
        ...defaultUseJournalsReturn,
        searchQuery: 'test'
      });

      render(<SearchAndFilter />);

      expect(screen.getByText(/重置筛选/)).toBeInTheDocument();
    });

    it('should show clear button when category is selected', () => {
      vi.mocked(useJournals).mockReturnValue({
        ...defaultUseJournalsReturn,
        selectedCategory: 'SCI'
      });

      render(<SearchAndFilter />);

      expect(screen.getByText(/重置筛选/)).toBeInTheDocument();
    });

    it('should show clear button when rating filter is active', () => {
      vi.mocked(useJournals).mockReturnValue({
        ...defaultUseJournalsReturn,
        minRating: 4
      });

      render(<SearchAndFilter />);

      expect(screen.getByText(/重置筛选/)).toBeInTheDocument();
    });

    it('should show clear button when sort is active', () => {
      vi.mocked(useJournals).mockReturnValue({
        ...defaultUseJournalsReturn,
        hasActiveSorts: true
      });

      render(<SearchAndFilter />);

      expect(screen.getByText(/重置筛选/)).toBeInTheDocument();
    });

    it('should call clearFilters when clear button is clicked', () => {
      vi.mocked(useJournals).mockReturnValue({
        ...defaultUseJournalsReturn,
        searchQuery: 'test'
      });

      render(<SearchAndFilter />);

      const clearButton = screen.getByText(/重置筛选/);
      fireEvent.click(clearButton);

      expect(mockClearFilters).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label on section', () => {
      const { container } = render(<SearchAndFilter />);

      const section = container.querySelector('.search-filter-section');
      expect(section).toHaveAttribute('aria-label', '搜索和筛选期刊');
    });

    it('should have proper structure for screen readers', () => {
      render(<SearchAndFilter />);

      // Filter labels should be present
      expect(screen.getByText('等级')).toBeInTheDocument();
      expect(screen.getByText('分类')).toBeInTheDocument();
      expect(screen.getByText('评分')).toBeInTheDocument();
      expect(screen.getByText('排序')).toBeInTheDocument();
    });
  });

  describe('Multi-sort indicator', () => {
    it('should show "Multi-dimension Sort" when has active sorts', () => {
      vi.mocked(useJournals).mockReturnValue({
        ...defaultUseJournalsReturn,
        hasActiveSorts: true
      });

      render(<SearchAndFilter />);

      expect(screen.getByText('多维度排序')).toBeInTheDocument();
    });

    it('should show "Configure Sort" when no active sorts', () => {
      render(<SearchAndFilter />);

      expect(screen.getByText('配置排序')).toBeInTheDocument();
    });
  });

  describe('Dropdown interactions', () => {
    it('should close dropdown when clicking outside', async () => {
      render(<SearchAndFilter />);

      // Open level dropdown
      const levelTrigger = screen.getByText('全部等级');
      fireEvent.click(levelTrigger);

      // Verify dropdown is open
      expect(screen.getByText('SCI')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('SCI')).not.toBeInTheDocument();
      });
    });

    it('should show check icon for selected option', () => {
      vi.mocked(useJournals).mockReturnValue({
        ...defaultUseJournalsReturn,
        selectedCategory: 'SCI'
      });

      const { container } = render(<SearchAndFilter />);

      const levelTrigger = screen.getByText('SCI');
      fireEvent.click(levelTrigger);

      const checkIcon = container.querySelector('.check-icon');
      expect(checkIcon).toBeInTheDocument();
    });
  });
});
