import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostList from '@/features/posts/components/PostList';
import { Post } from '@/features/posts/types/post';

vi.mock('@/features/posts/components/PostCard', () => ({
  default: ({ post, onClick }: { post: Post; onClick?: (id: number) => void }) => (
    <div data-testid={`post-card-${post.id}`} onClick={() => onClick?.(post.id)}>
      {post.title}
    </div>
  ),
}));

const mockObserve = vi.fn();
const mockUnobserve = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
    takeRecords: () => [],
  }));
});
const createMockPost = (overrides: Partial<Post> = {}): Post => ({
  id: 1,
  userId: 'user-1',
  userName: 'Test User',
  title: 'Test Post',
  content: 'Test content',
  category: 'discussion',
  tags: ['test'],
  viewCount: 10,
  likeCount: 5,
  commentCount: 2,
  favoriteCount: 1,
  followCount: 0,
  hotScore: 50,
  isPinned: false,
  isDeleted: false,
  status: 'published',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

const mockPosts: Post[] = [
  createMockPost({ id: 1, title: 'First Post' }),
  createMockPost({ id: 2, title: 'Second Post' }),
  createMockPost({ id: 3, title: 'Third Post' }),
];

const defaultProps = {
  posts: mockPosts,
  loading: false,
  error: null,
  hasMore: false,
  onLoadMore: vi.fn(),
  onRetry: vi.fn(),
};

const renderPostList = (props = {}) =>
  render(
    <BrowserRouter>
      <PostList {...defaultProps} {...props} />
    </BrowserRouter>
  );
describe('PostList', () => {
  describe('Rendering posts', () => {
    it('should render all posts in the list', () => {
      renderPostList();
      expect(screen.getByTestId('post-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('post-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('post-card-3')).toBeInTheDocument();
    });

    it('should display post titles through PostCard components', () => {
      renderPostList();
      expect(screen.getByText('First Post')).toBeInTheDocument();
      expect(screen.getByText('Second Post')).toBeInTheDocument();
      expect(screen.getByText('Third Post')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should show skeleton loading when loading with no posts', () => {
      const { container } = renderPostList({ loading: true, posts: [] });
      const skeletons = container.querySelectorAll('.post-skeleton');
      expect(skeletons.length).toBe(4);
    });

    it('should show loading more indicator when loading with existing posts', () => {
      renderPostList({ loading: true, posts: mockPosts });
      expect(screen.getByText('加载更多...')).toBeInTheDocument();
    });
  });
  describe('Error state', () => {
    it('should show error state with retry button when error with no posts', () => {
      renderPostList({ error: '网络错误', posts: [] });
      expect(screen.getByText('加载失败')).toBeInTheDocument();
      expect(screen.getByText('网络错误')).toBeInTheDocument();
      expect(screen.getByText('重试')).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked in error state', () => {
      const onRetry = vi.fn();
      renderPostList({ error: '网络错误', posts: [], onRetry });
      fireEvent.click(screen.getByText('重试'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should show inline error with retry when error with existing posts', () => {
      const onRetry = vi.fn();
      renderPostList({ error: '加载失败', posts: mockPosts, onRetry });
      expect(screen.getByText('加载失败')).toBeInTheDocument();
      fireEvent.click(screen.getByText('重试'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
  describe('Empty state', () => {
    it('should show empty state when no posts and not loading', () => {
      renderPostList({ posts: [], loading: false });
      expect(screen.getByText('暂无帖子')).toBeInTheDocument();
      expect(screen.getByText('这里还没有任何帖子，成为第一个发帖的人吧！')).toBeInTheDocument();
    });

    it('should show create post button when onCreatePost is provided', () => {
      const onCreatePost = vi.fn();
      renderPostList({ posts: [], loading: false, onCreatePost });
      const createButton = screen.getByText('发布第一篇帖子');
      expect(createButton).toBeInTheDocument();
      fireEvent.click(createButton);
      expect(onCreatePost).toHaveBeenCalledTimes(1);
    });

    it('should not show create post button when onCreatePost is not provided', () => {
      renderPostList({ posts: [], loading: false });
      expect(screen.queryByText('发布第一篇帖子')).not.toBeInTheDocument();
    });
  });

  describe('End of list', () => {
    it('should show end indicator when hasMore is false and posts exist', () => {
      renderPostList({ hasMore: false, posts: mockPosts });
      expect(screen.getByText('已加载全部帖子')).toBeInTheDocument();
    });
  });
});
