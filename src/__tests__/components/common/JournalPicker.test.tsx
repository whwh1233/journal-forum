import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JournalPicker from '@/components/common/JournalPicker';

// Mock the hook that JournalPicker uses
const mockSearch = vi.fn();
const mockLoadMore = vi.fn();
const mockReset = vi.fn();

let mockResults: any[] = [];
let mockLoading = false;
let mockError: string | null = null;
let mockHasMore = false;

vi.mock('@/hooks/useJournalSearch', () => ({
  useJournalSearch: () => ({
    results: mockResults,
    loading: mockLoading,
    error: mockError,
    hasMore: mockHasMore,
    search: mockSearch,
    loadMore: mockLoadMore,
    reset: mockReset,
  }),
}));

// Mock the service functions that the component calls on mount
vi.mock('@/services/journalSearchService', () => ({
  searchJournals: vi.fn(),
  getCategories: vi.fn().mockResolvedValue({ categories: [] }),
  getLevels: vi.fn().mockResolvedValue({ levels: [] }),
  // Re-export types won't matter for runtime
}));

// Mock the utility functions
vi.mock('@/components/common/journalPickerUtils', () => ({
  createCustomJournal: vi.fn((name: string) => ({
    journalId: `custom-${name}`,
    id: `custom-${name}`,
    name,
    title: name,
    issn: '',
    levels: [],
    rating: 0,
    reviews: 0,
    category: '',
    dimensionAverages: {},
  })),
  isCustomJournal: vi.fn(() => false),
}));

// Mock DIMENSION_LABELS
vi.mock('@/types', () => ({
  DIMENSION_LABELS: {
    reviewSpeed: '审稿速度',
    editorAttitude: '编辑态度',
    acceptDifficulty: '录用难度',
    reviewQuality: '审稿质量',
    overallExperience: '综合体验',
  },
}));

describe('JournalPicker', () => {
  const mockOnChange = vi.fn();

  const sampleResults = [
    {
      journalId: '1',
      id: '1',
      name: 'Nature',
      title: 'Nature',
      issn: '0028-0836',
      levels: ['SCI'],
      rating: 4.5,
      reviews: 120,
      category: 'Science',
      dimensionAverages: {
        reviewSpeed: 4.0,
        editorAttitude: 4.5,
        acceptDifficulty: 4.8,
        reviewQuality: 4.6,
        overallExperience: 4.5,
      },
    },
    {
      journalId: '2',
      id: '2',
      name: 'Science',
      title: 'Science',
      issn: '0036-8075',
      levels: ['SCI'],
      rating: 4.4,
      reviews: 110,
      category: 'Science',
      dimensionAverages: {
        reviewSpeed: 3.9,
        editorAttitude: 4.3,
        acceptDifficulty: 4.7,
        reviewQuality: 4.5,
        overallExperience: 4.4,
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockResults = [];
    mockLoading = false;
    mockError = null;
    mockHasMore = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('渲染测试', () => {
    it('should render input field with default placeholder', () => {
      render(<JournalPicker value={null} onChange={mockOnChange} />);
      expect(screen.getByPlaceholderText('输入期刊名称、ISSN 或刊号搜索...')).toBeInTheDocument();
    });

    it('should render with selected journal name', () => {
      render(<JournalPicker value={sampleResults[0] as any} onChange={mockOnChange} />);
      // When a value is selected, the name is shown instead of input
      expect(screen.getByText('Nature')).toBeInTheDocument();
    });

    it('should show clear button when value is selected', () => {
      render(<JournalPicker value={sampleResults[0] as any} onChange={mockOnChange} />);
      expect(screen.getByText('×')).toBeInTheDocument();
    });
  });

  describe('搜索功能', () => {
    it('should trigger search after debounce on input', async () => {
      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('输入期刊名称、ISSN 或刊号搜索...');
      await user.type(input, 'Na');

      // The component uses 300ms debounce
      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should not search if input is cleared', async () => {
      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('输入期刊名称、ISSN 或刊号搜索...');
      await user.type(input, 'N');
      await user.clear(input);

      // After clearing, reset should be called
      await waitFor(() => {
        expect(mockReset).toHaveBeenCalled();
      });
    });

    it('should display search results when available', async () => {
      mockResults = sampleResults;

      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('输入期刊名称、ISSN 或刊号搜索...');
      await user.type(input, 'Na');

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalled();
      }, { timeout: 1000 });

      // Results should be visible in the dropdown
      await waitFor(() => {
        const items = document.querySelectorAll('.journal-item');
        expect(items.length).toBe(2);
      });
    });
  });

  describe('选择功能', () => {
    it('should call onChange when journal is selected from results', async () => {
      mockResults = sampleResults;

      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('输入期刊名称、ISSN 或刊号搜索...');
      await user.type(input, 'Na');

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalled();
      }, { timeout: 1000 });

      await waitFor(() => {
        const items = document.querySelectorAll('.journal-item');
        expect(items.length).toBeGreaterThan(0);
      });

      const firstItem = document.querySelector('.journal-item');
      fireEvent.click(firstItem!);
      expect(mockOnChange).toHaveBeenCalledWith(sampleResults[0]);
    });

    it('should call onChange(null) when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<JournalPicker value={sampleResults[0] as any} onChange={mockOnChange} />);

      const clearButton = screen.getByText('×');
      await user.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });
  });

  describe('错误处理', () => {
    it('should show no results message when search returns empty', async () => {
      mockResults = [];

      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('输入期刊名称、ISSN 或刊号搜索...');
      await user.type(input, 'NonExistent');

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalled();
      }, { timeout: 1000 });

      // Component shows "在期刊库中未找到匹配结果"
      await waitFor(() => {
        expect(screen.getByText('在期刊库中未找到匹配结果')).toBeInTheDocument();
      });
    });

    it('should show error message from the hook', async () => {
      mockError = '搜索失败，请重试';

      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('输入期刊名称、ISSN 或刊号搜索...');
      await user.type(input, 'Nature');

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalled();
      }, { timeout: 1000 });

      await waitFor(() => {
        expect(screen.getByText('搜索失败，请重试')).toBeInTheDocument();
      });
    });
  });

  describe('加载状态', () => {
    it('should show loading indicator while searching', async () => {
      mockLoading = true;

      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('输入期刊名称、ISSN 或刊号搜索...');
      await user.type(input, 'Nature');

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalled();
      }, { timeout: 1000 });

      // Component shows "加载中..."
      await waitFor(() => {
        expect(screen.getByText('加载中...')).toBeInTheDocument();
      });
    });
  });

  describe('滚动加载', () => {
    it('should call loadMore on scroll near bottom', async () => {
      mockResults = sampleResults;
      mockHasMore = true;

      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('输入期刊名称、ISSN 或刊号搜索...');
      await user.type(input, 'Nature');

      await waitFor(() => {
        expect(mockSearch).toHaveBeenCalled();
      }, { timeout: 1000 });

      await waitFor(() => {
        const resultsList = document.querySelector('.results-list');
        expect(resultsList).toBeTruthy();
      });

      const resultsList = document.querySelector('.results-list');
      if (resultsList) {
        Object.defineProperty(resultsList, 'scrollHeight', { value: 500, configurable: true });
        Object.defineProperty(resultsList, 'scrollTop', { value: 450, configurable: true });
        Object.defineProperty(resultsList, 'clientHeight', { value: 100, configurable: true });

        fireEvent.scroll(resultsList);
      }

      await waitFor(() => {
        expect(mockLoadMore).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });
});
