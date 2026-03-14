import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../helpers/testUtils';
import PostDetailPage from '@/features/posts/pages/PostDetailPage';
import { postService } from '@/features/posts/services/postService';

vi.mock('@/features/posts/services/postService', () => ({
  postService: {
    getPostById: vi.fn(), incrementView: vi.fn(),
    toggleLike: vi.fn(), toggleFavorite: vi.fn(),
    toggleFollow: vi.fn(), reportPost: vi.fn(),
  },
}));
vi.mock('@/contexts/PageContext', () => ({ usePageTitle: vi.fn() }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: '1' }) };
});
vi.mock('@/features/posts/components/PostDetail', () => ({
  default: ({ post, onLike, onFavorite, onFollow, onReport }: any) => (
    <div data-testid="post-detail">
      <h1>{post.title}</h1>
      <button onClick={onLike}>点赞</button>
      <button onClick={onFavorite}>收藏</button>
      <button onClick={onFollow}>关注</button>
      <button onClick={onReport}>举报</button>
    </div>
  ),
}));
vi.mock('@/features/posts/components/PostCommentList', () => ({
  default: ({ postId }: { postId: number }) => (
    <div data-testid="comment-list">Comments for post {postId}</div>
  ),
}));

const mockPost = {
  id: 1, userId: '1', title: '测试帖子标题', content: 'test',
  category: 'discussion', tags: ['test'], viewCount: 100, likeCount: 10,
  commentCount: 5, favoriteCount: 3, followCount: 2, hotScore: 50,
  userLiked: false, userFavorited: false, userFollowed: false,
  createdAt: '2024-01-01', updatedAt: '2024-01-01',
};

describe('PostDetailPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should show loading state', () => {
    vi.mocked(postService.getPostById).mockImplementation(() => new Promise(() => {}));
    render(<PostDetailPage />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('should render post detail', async () => {
    vi.mocked(postService.getPostById).mockResolvedValue(mockPost);
    render(<PostDetailPage />);
    await waitFor(() => { expect(screen.getByText('测试帖子标题')).toBeInTheDocument(); });
    expect(screen.getByTestId('post-detail')).toBeInTheDocument();
    expect(screen.getByTestId('comment-list')).toBeInTheDocument();
  });

  it('should show error on failure', async () => {
    vi.mocked(postService.getPostById).mockRejectedValue(new Error('加载失败'));
    render(<PostDetailPage />);
    await waitFor(() => { expect(screen.getByText('加载失败')).toBeInTheDocument(); });
    expect(screen.getByText('返回社区')).toBeInTheDocument();
  });

  it('should navigate back', async () => {
    vi.mocked(postService.getPostById).mockResolvedValue(mockPost);
    render(<PostDetailPage />);
    await waitFor(() => { expect(screen.getByText('测试帖子标题')).toBeInTheDocument(); });
    screen.getByText('返回社区').click();
    expect(mockNavigate).toHaveBeenCalledWith('/community');
  });

  it('should increment view count', async () => {
    vi.mocked(postService.getPostById).mockResolvedValue(mockPost);
    render(<PostDetailPage />);
    await waitFor(() => { expect(postService.incrementView).toHaveBeenCalledWith(1); });
  });

  it('should handle like action', async () => {
    vi.mocked(postService.getPostById).mockResolvedValue(mockPost);
    vi.mocked(postService.toggleLike).mockResolvedValue({ liked: true, likeCount: 11 });
    render(<PostDetailPage />);
    await waitFor(() => { expect(screen.getByText('测试帖子标题')).toBeInTheDocument(); });
    screen.getByText('点赞').click();
    await waitFor(() => { expect(postService.toggleLike).toHaveBeenCalledWith(1); });
  });
});
