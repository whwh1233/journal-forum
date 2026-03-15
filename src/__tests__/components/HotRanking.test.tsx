import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../helpers/testUtils';
import CommunityPage from '@/features/posts/pages/CommunityPage';
import SearchAndFilter from '@/features/journals/components/SearchAndFilter';
import { postService } from '@/features/posts/services/postService';
import * as authHook from '@/hooks/useAuth';
import { useJournals } from '@/hooks/useJournals';

// ─── Module-level mocks ───────────────────────────────────────────────────────

vi.mock('@/features/posts/services/postService', () => ({
  postService: { getPosts: vi.fn() },
}));

vi.mock('@/hooks/useAuth');

vi.mock('@/contexts/PageContext', () => ({ usePageTitle: vi.fn() }));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    addToast: vi.fn(),
    removeToast: vi.fn(),
    notify: vi.fn(),
  }),
}));

vi.mock('@/features/posts/components/PostList', () => ({
  default: ({ posts, loading, error, onCreatePost, onPostClick }: any) => (
    <div data-testid="post-list">
      {loading && <div>Loading...</div>}
      {error && <div>{error}</div>}
      {posts && posts.map((p: any) => (
        <div key={p.id} data-testid={`post-${p.id}`} onClick={() => onPostClick(p.id)}>
          {p.title}
        </div>
      ))}
      <button onClick={onCreatePost}>Create</button>
    </div>
  ),
}));

vi.mock('@/hooks/useJournals', () => ({
  useJournals: vi.fn(),
}));

vi.mock('@/contexts/JournalContext', async () => {
  const actual = await vi.importActual('@/contexts/JournalContext');
  return {
    ...actual,
    SORT_FIELD_PRIORITY: ['commentCount', 'impactFactor', 'rating', 'overallExperience', 'reviewSpeed', 'editorAttitude', 'acceptDifficulty', 'reviewQuality'],
    SORT_FIELD_LABELS: {
      commentCount: '评论数',
      impactFactor: '影响因子',
      rating: '综合评分',
      overallExperience: '综合体验',
      reviewSpeed: '审稿速度',
      editorAttitude: '编辑态度',
      acceptDifficulty: '录用难度',
      reviewQuality: '审稿质量',
    },
  };
});

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockHotPosts = [
  {
    id: 1,
    title: 'Hot First',
    hotScore: 100,
    allTimeScore: 10,
    category: 'discussion',
    tags: [],
    createdAt: '2026-03-15',
    updatedAt: '2026-03-15',
    userId: '1',
    content: '',
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    favoriteCount: 0,
    followCount: 0,
  },
  {
    id: 2,
    title: 'Hot Second',
    hotScore: 50,
    allTimeScore: 80,
    category: 'discussion',
    tags: [],
    createdAt: '2026-03-15',
    updatedAt: '2026-03-15',
    userId: '1',
    content: '',
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    favoriteCount: 0,
    followCount: 0,
  },
];

const mockPagination = { total: 2, page: 1, limit: 20, totalPages: 1 };

const mockAuthReturn = {
  user: { id: '1', email: 'test@example.com', name: 'Test User' },
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  loading: false,
  isAuthenticated: true,
  error: null,
  clearError: vi.fn(),
  checkAuthStatus: vi.fn(),
};

const mockSetHotSortMode = vi.fn();

const defaultUseJournalsReturn = {
  journals: [],
  loading: false,
  error: null,
  filters: {},
  setFilters: vi.fn(),
  pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
  setCurrentPage: vi.fn(),
  hotSortMode: null,
  setHotSortMode: mockSetHotSortMode,
  sortFields: {},
  setSortFields: vi.fn(),
  levels: [],
  categories: [],
  searchQuery: '',
  selectedCategory: '',
  selectedCategoryId: null,
  minRating: 0,
  sortExpanded: false,
  hasActiveSorts: false,
  setSearchQuery: vi.fn(),
  setSelectedCategory: vi.fn(),
  setSelectedCategoryId: vi.fn(),
  setMinRating: vi.fn(),
  toggleSortField: vi.fn(),
  setSortExpanded: vi.fn(),
  clearFilters: vi.fn(),
};

// ─── Part 1: CommunityPage sorting tests ─────────────────────────────────────

describe('CommunityPage hot ranking sort', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authHook.useAuth).mockReturnValue(mockAuthReturn);
    vi.mocked(postService.getPosts).mockResolvedValue({
      posts: mockHotPosts,
      pagination: mockPagination,
    });
  });

  it('calls getPosts with sortBy=hot by default on load', async () => {
    render(<CommunityPage />);
    await waitFor(() => {
      expect(postService.getPosts).toHaveBeenCalled();
    });
    const callArgs = vi.mocked(postService.getPosts).mock.calls[0][0];
    expect(callArgs.sortBy).toBe('hot');
  });

  it('select defaults to hot value', async () => {
    render(<CommunityPage />);
    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('hot');
    });
  });

  it('switches to allTime sort when select changes', async () => {
    render(<CommunityPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(postService.getPosts).toHaveBeenCalledTimes(1);
    });

    // Clear mock before changing sort
    vi.mocked(postService.getPosts).mockClear();

    // Change select to allTime
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'allTime' } });

    await waitFor(() => {
      expect(postService.getPosts).toHaveBeenCalled();
    });

    const callArgs = vi.mocked(postService.getPosts).mock.calls[0][0];
    expect(callArgs.sortBy).toBe('allTime');
  });

  it('re-renders post list after sort change', async () => {
    render(<CommunityPage />);

    // Wait for initial posts to render
    await waitFor(() => {
      expect(screen.getByTestId('post-1')).toBeInTheDocument();
    });

    // Provide new resolved value for allTime sort
    vi.mocked(postService.getPosts).mockResolvedValueOnce({
      posts: [mockHotPosts[1], mockHotPosts[0]], // reversed order for allTime
      pagination: mockPagination,
    });

    // Change sort
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'allTime' } });

    // Posts list should still be rendered after the change
    await waitFor(() => {
      expect(screen.getByTestId('post-list')).toBeInTheDocument();
    });
  });
});

// ─── Part 2: SearchAndFilter hot sort buttons ─────────────────────────────────

describe('SearchAndFilter hot sort buttons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useJournals).mockReturnValue(defaultUseJournalsReturn);
  });

  it('renders hot sort buttons with correct labels', () => {
    render(<SearchAndFilter />);
    expect(screen.getByText('近期热门')).toBeInTheDocument();
    expect(screen.getByText('历史最热')).toBeInTheDocument();
  });

  it('calls setHotSortMode with "hot" when 近期热门 is clicked', () => {
    render(<SearchAndFilter />);
    const hotButton = screen.getByText('近期热门');
    fireEvent.click(hotButton);
    expect(mockSetHotSortMode).toHaveBeenCalledWith('hot');
  });

  it('active button has has-value class when hotSortMode is "hot"', () => {
    vi.mocked(useJournals).mockReturnValue({
      ...defaultUseJournalsReturn,
      hotSortMode: 'hot',
    });

    render(<SearchAndFilter />);
    const hotButton = screen.getByText('近期热门').closest('button');
    expect(hotButton).toHaveClass('has-value');
  });
});
