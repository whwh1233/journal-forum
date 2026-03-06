import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@/__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import JournalPicker from '@/components/common/JournalPicker';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('JournalPicker', () => {
  const mockJournals = [
    {
      id: 1,
      title: 'Nature',
      issn: '0028-0836',
      category: 'SCI',
      rating: 4.5,
      reviews: 120,
      description: 'Leading scientific journal',
      dimensionAverages: {
        reviewSpeed: 4.0,
        editorAttitude: 4.5,
        acceptDifficulty: 4.8,
        reviewQuality: 4.6,
        overallExperience: 4.5
      }
    },
    {
      id: 2,
      title: 'Science',
      issn: '0036-8075',
      category: 'SCI',
      rating: 4.4,
      reviews: 110,
      description: 'Premier scientific journal',
      dimensionAverages: {
        reviewSpeed: 3.9,
        editorAttitude: 4.3,
        acceptDifficulty: 4.7,
        reviewQuality: 4.5,
        overallExperience: 4.4
      }
    }
  ];

  const mockCategories = {
    categories: [
      { name: 'SCI', count: 50 },
      { name: 'EI', count: 30 }
    ]
  };

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Mock categories endpoint
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/journals/categories') {
        return Promise.resolve({ data: { data: mockCategories } });
      }
      // Mock search endpoint
      if (url === '/api/journals/search') {
        return Promise.resolve({
          data: {
            data: {
              journals: mockJournals,
              hasMore: false
            }
          }
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('渲染测试', () => {
    it('should render input field with placeholder', () => {
      render(<JournalPicker value={null} onChange={mockOnChange} placeholder="搜索期刊" />);
      const input = screen.getByPlaceholderText('搜索期刊');
      expect(input).toBeInTheDocument();
    });

    it('should render with selected journal', () => {
      render(<JournalPicker value={mockJournals[0]} onChange={mockOnChange} />);
      expect(screen.getByDisplayValue('Nature')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<JournalPicker value={null} onChange={mockOnChange} disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });

  describe('搜索功能', () => {
    it('should show dropdown when input is focused', async () => {
      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText(/分类/i)).toBeInTheDocument();
      });
    });

    it('should search journals when typing', async () => {
      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Nature');

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          '/api/journals/search',
          expect.objectContaining({
            params: expect.objectContaining({
              q: 'Nature',
              page: 1,
              limit: 10
            })
          })
        );
      });
    });

    it('should display search results', async () => {
      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Nature');

      await waitFor(() => {
        expect(screen.getByText('Nature')).toBeInTheDocument();
        expect(screen.getByText('Science')).toBeInTheDocument();
      });
    });

    it('should not search if query is less than 2 characters', async () => {
      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'N');

      // Wait a bit to ensure debounce has passed
      await new Promise(resolve => setTimeout(resolve, 400));

      // Should not have called the search endpoint
      expect(mockedAxios.get).not.toHaveBeenCalledWith(
        '/api/journals/search',
        expect.anything()
      );
    });
  });

  describe('分类过滤', () => {
    it('should load categories on mount', async () => {
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/journals/categories');
      });
    });

    it('should filter by category when category is selected', async () => {
      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByText(/全部/i)).toBeInTheDocument();
      });

      // Find and click SCI category
      const sciButton = screen.getByRole('button', { name: /SCI/i });
      await user.click(sciButton);

      // Type to trigger search with category
      await user.type(input, 'Nature');

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          '/api/journals/search',
          expect.objectContaining({
            params: expect.objectContaining({
              category: 'SCI'
            })
          })
        );
      });
    });
  });

  describe('选择功能', () => {
    it('should call onChange when journal is selected', async () => {
      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Nature');

      await waitFor(() => {
        expect(screen.getByText('Nature')).toBeInTheDocument();
      });

      const journalItem = screen.getByText('Nature').closest('.journal-picker-item');
      expect(journalItem).toBeInTheDocument();

      await user.click(journalItem!);

      expect(mockOnChange).toHaveBeenCalledWith(mockJournals[0]);
    });

    it('should close dropdown after selection', async () => {
      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Nature');

      await waitFor(() => {
        expect(screen.getByText('Nature')).toBeInTheDocument();
      });

      const journalItem = screen.getByText('Nature').closest('.journal-picker-item');
      await user.click(journalItem!);

      await waitFor(() => {
        expect(screen.queryByText('Science')).not.toBeInTheDocument();
      });
    });

    it('should clear selection when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<JournalPicker value={mockJournals[0]} onChange={mockOnChange} />);

      const clearButton = screen.getByRole('button', { name: /清除/i });
      await user.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });
  });

  describe('维度显示', () => {
    it('should persist dimension preferences to localStorage', async () => {
      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText(/显示维度/i)).toBeInTheDocument();
      });

      // Find dimension checkbox (e.g., reviewSpeed)
      const checkbox = screen.getByRole('checkbox', { name: /审稿速度/i });
      await user.click(checkbox);

      // Check localStorage
      const saved = localStorage.getItem('journalPickerDimensions');
      expect(saved).toBeTruthy();
    });
  });

  describe('错误处理', () => {
    it('should show error message when search fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Nature');

      await waitFor(() => {
        expect(screen.getByText(/搜索失败/i)).toBeInTheDocument();
      });
    });

    it('should show no results message when no journals found', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url === '/api/journals/search') {
          return Promise.resolve({
            data: {
              data: {
                journals: [],
                hasMore: false
              }
            }
          });
        }
        return Promise.resolve({ data: { data: mockCategories } });
      });

      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'NonExistentJournal');

      await waitFor(() => {
        expect(screen.getByText(/未找到相关期刊/i)).toBeInTheDocument();
      });
    });
  });

  describe('加载状态', () => {
    it('should show loading state while searching', async () => {
      // Delay the response
      mockedAxios.get.mockImplementation((url) => {
        if (url === '/api/journals/search') {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                data: {
                  data: {
                    journals: mockJournals,
                    hasMore: false
                  }
                }
              });
            }, 100);
          });
        }
        return Promise.resolve({ data: { data: mockCategories } });
      });

      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Nature');

      // Should show loading indicator
      expect(screen.getByText(/搜索中/i)).toBeInTheDocument();

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('Nature')).toBeInTheDocument();
      });
    });
  });

  describe('滚动加载', () => {
    it('should load more results when scrolling to bottom', async () => {
      mockedAxios.get.mockImplementation((url, config) => {
        if (url === '/api/journals/search') {
          const page = config?.params?.page || 1;
          return Promise.resolve({
            data: {
              data: {
                journals: mockJournals,
                hasMore: page < 2
              }
            }
          });
        }
        return Promise.resolve({ data: { data: mockCategories } });
      });

      const user = userEvent.setup();
      render(<JournalPicker value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Nature');

      await waitFor(() => {
        expect(screen.getByText('Nature')).toBeInTheDocument();
      });

      // Find the dropdown container and scroll to bottom
      const dropdown = screen.getByText('Nature').closest('.journal-picker-dropdown');
      expect(dropdown).toBeInTheDocument();

      // Simulate scroll to bottom
      const scrollObserver = dropdown!.querySelector('.scroll-observer');
      if (scrollObserver) {
        // Trigger intersection observer
        const intersectionCallback = (scrollObserver as any)._intersectionCallback;
        if (intersectionCallback) {
          intersectionCallback([{ isIntersecting: true }]);
        }
      }

      // Should call with page 2
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          '/api/journals/search',
          expect.objectContaining({
            params: expect.objectContaining({
              page: 2
            })
          })
        );
      });
    });
  });
});
