import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PostDetail from '@/features/posts/components/PostDetail';
import { Post } from '@/features/posts/types/post';

// Mock markdown packages
vi.mock('react-markdown', () => ({
  default: ({ children, components }: any) => {
    const content = children as string;
    const CustomA = components?.a;
    const CustomImg = components?.img;
    return (
      <div data-testid="markdown-content">
        {content}
        {CustomA && (
          <CustomA href="https://external.com" data-testid="custom-link">
            External Link
          </CustomA>
        )}
        {CustomImg && (
          <CustomImg
            src="https://example.com/img.png"
            alt="test image"
            data-testid="custom-img"
          />
        )}
      </div>
    );
  },
}));
vi.mock('remark-gfm', () => ({ default: () => {} }));
vi.mock('rehype-highlight', () => ({ default: () => {} }));
vi.mock('dompurify', () => ({
  default: { sanitize: (html: string) => html }
}));
vi.mock('highlight.js/styles/github-dark.css', () => ({}));

// Mock postService
vi.mock('@/features/posts/services/postService', () => ({
  postService: {
    getPostById: vi.fn(),
    incrementView: vi.fn(),
  }
}));

const mockPost: Post = {
  id: 1,
  userId: 'user-123',
  userName: 'Test Author',
  userAvatar: 'https://example.com/avatar.jpg',
  title: 'Test Post with Markdown',
  content: '# Heading\n\nThis is **bold** and *italic*.',
  category: 'discussion',
  tags: ['test', 'markdown'],
  viewCount: 100,
  likeCount: 10,
  commentCount: 5,
  favoriteCount: 3,
  followCount: 2,
  hotScore: 50,
  isPinned: false,
  isDeleted: false,
  status: 'published',
  userLiked: false,
  userFavorited: false,
  userFollowed: false,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z'
};

describe('PostDetail', () => {
  const mockOnLike = vi.fn();
  const mockOnFavorite = vi.fn();
  const mockOnFollow = vi.fn();
  const mockOnReport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render post title and author', () => {
    render(
      <PostDetail
        post={mockPost}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    expect(screen.getByText('Test Post with Markdown')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('should render markdown content correctly', () => {
    render(
      <PostDetail
        post={mockPost}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    // The mock ReactMarkdown renders content as-is
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
  });

  it('should display all tags', () => {
    render(
      <PostDetail
        post={mockPost}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('markdown')).toBeInTheDocument();
  });

  it('should display category badge', () => {
    render(
      <PostDetail
        post={mockPost}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    expect(screen.getByText('学术讨论')).toBeInTheDocument();
  });

  it('should display statistics', () => {
    render(
      <PostDetail
        post={mockPost}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    // Component renders "100 浏览", "10 点赞", "5 评论"
    expect(screen.getByText(/100 浏览/)).toBeInTheDocument();
    expect(screen.getByText(/10 点赞/)).toBeInTheDocument();
    expect(screen.getByText(/5 评论/)).toBeInTheDocument();
  });

  it('should call onLike when like button is clicked', () => {
    const { container } = render(
      <PostDetail
        post={mockPost}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    // Find the like button by its text content "点赞"
    const likeButton = screen.getByText('点赞').closest('button');
    expect(likeButton).toBeTruthy();
    fireEvent.click(likeButton!);
    expect(mockOnLike).toHaveBeenCalled();
  });

  it('should call onFavorite when favorite button is clicked', () => {
    render(
      <PostDetail
        post={mockPost}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    const favoriteButton = screen.getByText('收藏').closest('button');
    expect(favoriteButton).toBeTruthy();
    fireEvent.click(favoriteButton!);
    expect(mockOnFavorite).toHaveBeenCalled();
  });

  it('should call onFollow when follow button is clicked', () => {
    render(
      <PostDetail
        post={mockPost}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    const followButton = screen.getByText('关注').closest('button');
    expect(followButton).toBeTruthy();
    fireEvent.click(followButton!);
    expect(mockOnFollow).toHaveBeenCalled();
  });

  it('should show active state for liked post', () => {
    const likedPost: Post = { ...mockPost, userLiked: true };

    const { container } = render(
      <PostDetail
        post={likedPost}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    // When liked, text changes to "已点赞"
    expect(screen.getByText('已点赞')).toBeInTheDocument();
    // Button should have active class
    const likeButton = screen.getByText('已点赞').closest('button');
    expect(likeButton).toHaveClass('post-detail-action--active');
  });

  it('should show active state for favorited post', () => {
    const favoritedPost: Post = { ...mockPost, userFavorited: true };

    render(
      <PostDetail
        post={favoritedPost}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    expect(screen.getByText('已收藏')).toBeInTheDocument();
    const favButton = screen.getByText('已收藏').closest('button');
    expect(favButton).toHaveClass('post-detail-action--active');
  });

  it('should show active state for followed post', () => {
    const followedPost: Post = { ...mockPost, userFollowed: true };

    render(
      <PostDetail
        post={followedPost}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    expect(screen.getByText('已关注')).toBeInTheDocument();
    const followButton = screen.getByText('已关注').closest('button');
    expect(followButton).toHaveClass('post-detail-action--active');
  });

  it('should show report button', () => {
    render(
      <PostDetail
        post={mockPost}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    expect(screen.getByText('举报')).toBeInTheDocument();
  });

  it('should call onReport when report button is clicked', () => {
    render(
      <PostDetail
        post={mockPost}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    const reportButton = screen.getByText('举报').closest('button');
    expect(reportButton).toBeTruthy();
    fireEvent.click(reportButton!);
    expect(mockOnReport).toHaveBeenCalled();
  });

  it('should show journal badge when journalId and journalTitle exist', () => {
    const postWithJournal: Post = {
      ...mockPost,
      journalId: 1,
      journalTitle: 'Nature'
    };

    render(
      <PostDetail
        post={postWithJournal}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    expect(screen.getByText('关联期刊')).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();
  });

  it('should not show journal section when journalId is missing', () => {
    render(
      <PostDetail
        post={mockPost}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    expect(screen.queryByText('关联期刊')).not.toBeInTheDocument();
  });

  it('should display formatted timestamp', () => {
    render(
      <PostDetail
        post={mockPost}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    // The component formats dates with zh-CN locale
    const timeElement = screen.getByText(/2024/);
    expect(timeElement).toBeInTheDocument();
  });

  it('should handle loading state via postId', () => {
    render(
      <PostDetail
        postId={999}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    // When postId is provided without post, loading state shows skeleton
    const { container } = render(
      <PostDetail postId={999} />
    );

    // Should show skeleton loader
    expect(container.querySelector('.post-detail-skeleton')).toBeInTheDocument();
  });

  it('should show "帖子不存在" when no post and not loading', () => {
    render(
      <PostDetail
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    expect(screen.getByText('帖子不存在')).toBeInTheDocument();
  });

  it('should show user avatar when provided', () => {
    render(
      <PostDetail
        post={mockPost}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );

    const avatar = screen.getByAltText('Test Author');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('renders external links with target _blank and rel noopener', () => {
    render(
      <PostDetail
        post={mockPost}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );
    const link = screen.getByTestId('custom-link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders images with lazy loading', () => {
    render(
      <PostDetail
        post={mockPost}
        onLike={mockOnLike}
        onFavorite={mockOnFavorite}
        onFollow={mockOnFollow}
        onReport={mockOnReport}
      />
    );
    const img = screen.getByTestId('custom-img');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('alt', 'test image');
  });
});
