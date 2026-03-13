import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    commentCount: 'Comment Count',
    impactFactor: 'Impact Factor',
    rating: 'Overall Rating',
    overallExperience: 'Overall Experience',
    reviewSpeed: 'Review Speed',
    editorAttitude: 'Editor Attitude',
    acceptDifficulty: 'Accept Difficulty',
    reviewQuality: 'Review Quality'
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
    const { useJournals } = require('@/hooks/useJournals');
    useJournals.mockReturnValue(defaultUseJournalsReturn);
  });

  describe('Search Input', () => {
    it('should render search input', () => {
      render(<SearchAndFilter />);

      const searchInput = screen.getByPlaceholderText(/Search journal name, ISSN or level.../);
      expect(searchInput).toBeInTheDocument();
    });

    it('should call setSearchQuery when typing in search input', () => {
      render(<SearchAndFilter />);

      const searchInput = screen.getByPlaceholderText(/Search journal name, ISSN or level.../);
      fireEvent.change(searchInput, { target: { value: 'nature' } });

      expect(mockSetSearchQuery).toHaveBeenCalledWith('nature');
    });

    it('should display current search query value', () => {
      const { useJournals } = require('@/hooks/useJournals');
      useJournals.mockReturnValue({
        ...defaultUseJournalsReturn,
        searchQuery: 'test query'
      });

      render(<SearchAndFilter />);

      const searchInput = screen.getByPlaceholderText(/Search journal name, ISSN or level.../);
      expect(searchInput).toHaveValue('test query');
    });

    it('should show clear button when search query is not empty', () => {
      const { useJournals } = require('@/hooks/useJournals');
      useJournals.mockReturnValue({
        ...defaultUseJournalsReturn,
        searchQuery: 'test'
      });

      const { container } = render(<SearchAndFilter />);

      const clearButton = container.querySelector('.sfc-search-clear');
      expect(clearButton).toBeInTheDocument();
    });

    it('should clear search query when clear button is clicked', () => {
      const { useJournals } = require('@/hooks/useJournals');
      useJournals.mockReturnValue({
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

      expect(screen.getByText('Level')).toBeInTheDocument();
    });

    it('should open level dropdown when clicked', () => {
      render(<SearchAndFilter />);

      const levelTrigger = screen.getByText('All Levels');
      fireEvent.click(levelTrigger);

      expect(screen.getByText('SCI')).toBeInTheDocument();
      expect(screen.getByText('EI')).toBeInTheDocument();
      expect(screen.getByText('CSSCI')).toBeInTheDocument();
    });

    it('should call setSelectedCategory when level is selected', async () => {
      render(<SearchAndFilter />);

      const levelTrigger = screen.getByText('All Levels');
      fireEvent.click(levelTrigger);

      const sciOption = screen.getByText('SCI');
      fireEvent.click(sciOption);

      expect(mockSetSelectedCategory).toHaveBeenCalledWith('SCI');
    });
  });

  describe('Category Filter', () => {
    it('should render category filter', () => {
      render(<SearchAndFilter />);

      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    it('should open cascaded category dropdown when clicked', () => {
      render(<SearchAndFilter />);

      const categoryTrigger = screen.getByText('All Categories');
      fireEvent.click(categoryTrigger);

      expect(screen.getByText('Science')).toBeInTheDocument();
      expect(screen.getByText('Humanities')).toBeInTheDocument();
    });

    it('should show subcategories when hovering over parent category', async () => {
      render(<SearchAndFilter />);

      const categoryTrigger = screen.getByText('All Categories');
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

      const categoryTrigger = screen.getByText('All Categories');
      fireEvent.click(categoryTrigger);

      const scienceOption = screen.getByText('Science');
      fireEvent.click(scienceOption);

      expect(mockSetSelectedCategoryId).toHaveBeenCalledWith(1);
    });
  });

  describe('Rating Filter', () => {
    it('should render rating filter', () => {
      render(<SearchAndFilter />);

      expect(screen.getByText('Rating')).toBeInTheDocument();
    });

    it('should open rating dropdown when clicked', () => {
      render(<SearchAndFilter />);

      const ratingTrigger = screen.getByText('All Ratings');
      fireEvent.click(ratingTrigger);

      expect(screen.getByText('4 stars or above')).toBeInTheDocument();
      expect(screen.getByText('3 stars or above')).toBeInTheDocument();
      expect(screen.getByText('2 stars or above')).toBeInTheDocument();
    });

    it('should call setMinRating when rating option is selected', () => {
      render(<SearchAndFilter />);

      const ratingTrigger = screen.getByText('All Ratings');
      fireEvent.click(ratingTrigger);

      const fourStarOption = screen.getByText('4 stars or above');
      fireEvent.click(fourStarOption);

      expect(mockSetMinRating).toHaveBeenCalledWith(4);
    });
  });

  describe('Sort Panel', () => {
    it('should render sort button', () => {
      render(<SearchAndFilter />);

      expect(screen.getByText('Sort')).toBeInTheDocument();
    });

    it('should toggle sort panel when sort button is clicked', () => {
      render(<SearchAndFilter />);

      const sortButton = screen.getByText('Configure Sort');
      fireEvent.click(sortButton);

      expect(mockSetSortExpanded).toHaveBeenCalledWith(true);
    });

    it('should display sort panel when sortExpanded is true', () => {
      const { useJournals } = require('@/hooks/useJournals');
      useJournals.mockReturnValue({
        ...defaultUseJournalsReturn,
        sortExpanded: true
      });

      render(<SearchAndFilter />);

      expect(screen.getByText('Sort Configuration')).toBeInTheDocument();
      expect(screen.getByText('Comment Count')).toBeInTheDocument();
      expect(screen.getByText('Impact Factor')).toBeInTheDocument();
      expect(screen.getByText('Overall Rating')).toBeInTheDocument();
    });

    it('should call toggleSortField when sort field is clicked', () => {
      const { useJournals } = require('@/hooks/useJournals');
      useJournals.mockReturnValue({
        ...defaultUseJournalsReturn,
        sortExpanded: true
      });

      render(<SearchAndFilter />);

      const commentCountSort = screen.getByText('Comment Count').closest('button');
      if (commentCountSort) {
        fireEvent.click(commentCountSort);
      }

      expect(mockToggleSortField).toHaveBeenCalledWith('commentCount');
    });

    it('should show active state for active sort fields', () => {
      const { useJournals } = require('@/hooks/useJournals');
      useJournals.mockReturnValue({
        ...defaultUseJournalsReturn,
        sortExpanded: true,
        sortFields: { commentCount: 'desc' }
      });

      const { container } = render(<SearchAndFilter />);

      const activeCard = container.querySelector('.sort-item-card.active');
      expect(activeCard).toBeInTheDocument();
    });

    it('should display descending icon for desc sort order', () => {
      const { useJournals } = require('@/hooks/useJournals');
      useJournals.mockReturnValue({
        ...defaultUseJournalsReturn,
        sortExpanded: true,
        sortFields: { commentCount: 'desc' }
      });

      render(<SearchAndFilter />);

      expect(screen.getByText('Descending')).toBeInTheDocument();
    });

    it('should display ascending icon for asc sort order', () => {
      const { useJournals } = require('@/hooks/useJournals');
      useJournals.mockReturnValue({
        ...defaultUseJournalsReturn,
        sortExpanded: true,
        sortFields: { commentCount: 'asc' }
      });

      render(<SearchAndFilter />);

      expect(screen.getByText('Ascending')).toBeInTheDocument();
    });

    it('should close sort panel when close button is clicked', () => {
      const { useJournals } = require('@/hooks/useJournals');
      useJournals.mockReturnValue({
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

      expect(screen.queryByText('Reset Filters')).not.toBeInTheDocument();
    });

    it('should show clear button when search query is active', () => {
      const { useJournals } = require('@/hooks/useJournals');
      useJournals.mockReturnValue({
        ...defaultUseJournalsReturn,
        searchQuery: 'test'
      });

      render(<SearchAndFilter />);

      expect(screen.getByText('Reset Filters')).toBeInTheDocument();
    });

    it('should show clear button when category is selected', () => {
      const { useJournals } = require('@/hooks/useJournals');
      useJournals.mockReturnValue({
        ...defaultUseJournalsReturn,
        selectedCategory: 'SCI'
      });

      render(<SearchAndFilter />);

      expect(screen.getByText('Reset Filters')).toBeInTheDocument();
    });

    it('should show clear button when rating filter is active', () => {
      const { useJournals } = require('@/hooks/useJournals');
      useJournals.mockReturnValue({
        ...defaultUseJournalsReturn,
        minRating: 4
      });

      render(<SearchAndFilter />);

      expect(screen.getByText('Reset Filters')).toBeInTheDocument();
    });

    it('should show clear button when sort is active', () => {
      const { useJournals } = require('@/hooks/useJournals');
      useJournals.mockReturnValue({
        ...defaultUseJournalsReturn,
        hasActiveSorts: true
      });

      render(<SearchAndFilter />);

      expect(screen.getByText('Reset Filters')).toBeInTheDocument();
    });

    it('should call clearFilters when clear button is clicked', () => {
      const { useJournals } = require('@/hooks/useJournals');
      useJournals.mockReturnValue({
        ...defaultUseJournalsReturn,
        searchQuery: 'test'
      });

      render(<SearchAndFilter />);

      const clearButton = screen.getByText('Reset Filters');
      fireEvent.click(clearButton);

      expect(mockClearFilters).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label on section', () => {
      const { container } = render(<SearchAndFilter />);

      const section = container.querySelector('.search-filter-section');
      expect(section).toHaveAttribute('aria-label', 'Search and filter journals');
    });

    it('should have proper structure for screen readers', () => {
      render(<SearchAndFilter />);

      // Filter labels should be present
      expect(screen.getByText('Level')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Rating')).toBeInTheDocument();
      expect(screen.getByText('Sort')).toBeInTheDocument();
    });
  });

  describe('Multi-sort indicator', () => {
    it('should show "Multi-dimension Sort" when has active sorts', () => {
      const { useJournals } = require('@/hooks/useJournals');
      useJournals.mockReturnValue({
        ...defaultUseJournalsReturn,
        hasActiveSorts: true
      });

      render(<SearchAndFilter />);

      expect(screen.getByText('Multi-dimension Sort')).toBeInTheDocument();
    });

    it('should show "Configure Sort" when no active sorts', () => {
      render(<SearchAndFilter />);

      expect(screen.getByText('Configure Sort')).toBeInTheDocument();
    });
  });

  describe('Dropdown interactions', () => {
    it('should close dropdown when clicking outside', async () => {
      render(<SearchAndFilter />);

      // Open level dropdown
      const levelTrigger = screen.getByText('All Levels');
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
      const { useJournals } = require('@/hooks/useJournals');
      useJournals.mockReturnValue({
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
