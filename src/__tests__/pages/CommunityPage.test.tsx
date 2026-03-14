import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '../helpers/testUtils';
import CommunityPage from '@/features/posts/pages/CommunityPage';
import { postService } from '@/features/posts/services/postService';
import * as authHook from '@/hooks/useAuth';

// Create mock functions at module level so they can be accessed in tests
const mockToastWarning = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockToastInfo = vi.fn();

vi.mock('@/features/posts/services/postService', () => ({
  postService: { getPosts: vi.fn() },
}));
vi.mock('@/hooks/useAuth');
vi.mock('@/contexts/PageContext', () => ({ usePageTitle: vi.fn() }));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    warning: mockToastWarning,
    info: mockToastInfo,
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
        <div key={p.id} data-testid={`post-${p.id}`} onClick={() => onPostClick(p.id)}>{p.title}</div>
      ))}
      <button onClick={onCreatePost}>Create</button>
    </div>
  ),
}));

const mockPosts = [{
  id: 1, userId: '1', title: '投稿经验分享', content: 'Content',
  category: 'experience', tags: ['SCI'], viewCount: 100, likeCount: 10,
  commentCount: 5, favoriteCount: 3, followCount: 2, hotScore: 50,
  createdAt: '2024-01-01', updatedAt: '2024-01-01',
}];
const mockAuthReturn = {
  user: { id: '1', email: 'test@example.com', name: 'Test User' },
  login: vi.fn(), logout: vi.fn(), register: vi.fn(),
  loading: false, isAuthenticated: true, error: null,
  clearError: vi.fn(), checkAuthStatus: vi.fn(),
};

describe('CommunityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authHook.useAuth).mockReturnValue(mockAuthReturn);
  });

  it('should render page title and create button', () => {
    vi.mocked(postService.getPosts).mockResolvedValue({
      posts: mockPosts, pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    render(<CommunityPage />);
    expect(screen.getByText('社区讨论')).toBeInTheDocument();
    expect(screen.getByText('发布帖子')).toBeInTheDocument();
  });

  it('should display posts after loading', async () => {
    vi.mocked(postService.getPosts).mockResolvedValue({
      posts: mockPosts, pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    render(<CommunityPage />);
    await waitFor(() => { expect(screen.getByText('投稿经验分享')).toBeInTheDocument(); });
  });

  it('should show category filter tabs', async () => {
    vi.mocked(postService.getPosts).mockResolvedValue({
      posts: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });
    render(<CommunityPage />);
    await waitFor(() => { expect(screen.getAllByText('全部').length).toBeGreaterThanOrEqual(1); });
    expect(screen.getAllByText('投稿经验').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('学术讨论').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('求助问答').length).toBeGreaterThanOrEqual(1);
  });

  it('should show hot tags in sidebar', () => {
    vi.mocked(postService.getPosts).mockResolvedValue({
      posts: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });
    render(<CommunityPage />);
    expect(screen.getByText('热门标签')).toBeInTheDocument();
    expect(screen.getByText('期刊推荐')).toBeInTheDocument();
  });

  it('should call getPosts on load', async () => {
    vi.mocked(postService.getPosts).mockResolvedValue({
      posts: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });
    render(<CommunityPage />);
    await waitFor(() => { expect(postService.getPosts).toHaveBeenCalledTimes(1); });
  });

  it('should show filter controls', () => {
    vi.mocked(postService.getPosts).mockResolvedValue({
      posts: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });
    render(<CommunityPage />);
    expect(screen.getByText('筛选')).toBeInTheDocument();
  });

  it('shows toast warning instead of alert when unauthenticated user tries to post', () => {
    // Mock unauthenticated state
    vi.mocked(authHook.useAuth).mockReturnValue({
      ...mockAuthReturn,
      user: null,
      isAuthenticated: false,
    });

    vi.mocked(postService.getPosts).mockResolvedValue({
      posts: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });

    render(<CommunityPage />);

    const createBtn = screen.getByRole('button', { name: /发布帖子/ });
    fireEvent.click(createBtn);

    // toast.warning should be called with the message
    expect(mockToastWarning).toHaveBeenCalledWith('请先登录后再发布帖子');
  });

  it('debounces search input — only fires fetch after 300ms of no typing', async () => {
    vi.mocked(postService.getPosts).mockResolvedValue({
      posts: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });

    render(<CommunityPage />);

    // Wait for initial mount fetch to settle
    await waitFor(() => {
      expect(vi.mocked(postService.getPosts)).toHaveBeenCalled();
    });

    // Clear mock calls after initial mount
    vi.mocked(postService.getPosts).mockClear();

    // Find search input and type rapidly
    const searchInput = screen.getByPlaceholderText(/搜索帖子/);
    fireEvent.change(searchInput, { target: { value: 'S' } });
    fireEvent.change(searchInput, { target: { value: 'SC' } });
    fireEvent.change(searchInput, { target: { value: 'SCI' } });

    // Immediately after typing, no fetch should have fired (still debouncing)
    expect(vi.mocked(postService.getPosts)).not.toHaveBeenCalled();

    // After debounce delay (300ms), exactly one fetch should fire
    await waitFor(() => {
      expect(vi.mocked(postService.getPosts)).toHaveBeenCalledTimes(1);
    }, { timeout: 500 });
  });
});
