import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostDetail from '@/features/posts/components/PostDetail';
import { Post } from '@/features/posts/types/post';

const mockPost: Post = {
  id: 1,
  userId: 'user-123',
  title: 'Test Post with Markdown',
  content: '# Heading\n\nThis is **bold** and this is *italic*.\n\n```javascript\nconst test = "code block";\n```\n\n[Link](https://example.com)',
  category: 'discussion',
  tags: ['test', 'markdown'],
  viewCount: 100,
  likeCount: 10,
  commentCount: 5,
  favoriteCount: 3,
  followCount: 2,
  hotScore: 50,
  userLiked: false,
  userFavorited: false,
  userFollowed: false,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z'
};

const mockAuthor = {
  id: 'user-123',
  name: 'Test Author',
  avatar: 'https://example.com/avatar.jpg',
  email: 'test@example.com'
};

describe('PostDetail', () => {
  const mockOnLike = vi.fn();
  const mockOnFavorite = vi.fn();
  const mockOnFollow = vi.fn();
  const mockOnReport = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render post title and author', () => {
    render(
      <BrowserRouter>
        <PostDetail
          post={mockPost}
          author={mockAuthor}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Post with Markdown')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('should render markdown content correctly', () => {
    render(
      <BrowserRouter>
        <PostDetail
          post={mockPost}
          author={mockAuthor}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    // Check if markdown is rendered as HTML
    expect(screen.getByText('Heading')).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getByText('italic')).toBeInTheDocument();

    // Check for code block
    const codeElement = screen.getByText(/const test/);
    expect(codeElement).toBeInTheDocument();
  });

  it('should display all tags', () => {
    render(
      <BrowserRouter>
        <PostDetail
          post={mockPost}
          author={mockAuthor}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('markdown')).toBeInTheDocument();
  });

  it('should display category badge', () => {
    render(
      <BrowserRouter>
        <PostDetail
          post={mockPost}
          author={mockAuthor}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('学术讨论')).toBeInTheDocument();
  });

  it('should display statistics', () => {
    render(
      <BrowserRouter>
        <PostDetail
          post={mockPost}
          author={mockAuthor}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('100')).toBeInTheDocument(); // views
    expect(screen.getByText('10')).toBeInTheDocument(); // likes
    expect(screen.getByText('5')).toBeInTheDocument(); // comments
  });

  it('should call onLike when like button is clicked', async () => {
    const { container } = render(
      <BrowserRouter>
        <PostDetail
          post={mockPost}
          author={mockAuthor}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    const likeButton = container.querySelector('[title*="点赞"]') || screen.getByText(/点赞/);
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(mockOnLike).toHaveBeenCalled();
    });
  });

  it('should call onFavorite when favorite button is clicked', async () => {
    const { container } = render(
      <BrowserRouter>
        <PostDetail
          post={mockPost}
          author={mockAuthor}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    const favoriteButton = container.querySelector('[title*="收藏"]') || screen.getByText(/收藏/);
    fireEvent.click(favoriteButton);

    await waitFor(() => {
      expect(mockOnFavorite).toHaveBeenCalled();
    });
  });

  it('should call onFollow when follow button is clicked', async () => {
    const { container } = render(
      <BrowserRouter>
        <PostDetail
          post={mockPost}
          author={mockAuthor}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    const followButton = container.querySelector('[title*="关注"]') || screen.getByText(/关注/);
    fireEvent.click(followButton);

    await waitFor(() => {
      expect(mockOnFollow).toHaveBeenCalled();
    });
  });

  it('should show active state for liked post', () => {
    const likedPost: Post = { ...mockPost, userLiked: true };

    const { container } = render(
      <BrowserRouter>
        <PostDetail
          post={likedPost}
          author={mockAuthor}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    const likeButton = container.querySelector('[title*="点赞"]');
    expect(likeButton).toHaveClass('active');
  });

  it('should show active state for favorited post', () => {
    const favoritedPost: Post = { ...mockPost, userFavorited: true };

    const { container } = render(
      <BrowserRouter>
        <PostDetail
          post={favoritedPost}
          author={mockAuthor}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    const favoriteButton = container.querySelector('[title*="收藏"]');
    expect(favoriteButton).toHaveClass('active');
  });

  it('should show active state for followed post', () => {
    const followedPost: Post = { ...mockPost, userFollowed: true };

    const { container } = render(
      <BrowserRouter>
        <PostDetail
          post={followedPost}
          author={mockAuthor}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    const followButton = container.querySelector('[title*="关注"]');
    expect(followButton).toHaveClass('active');
  });

  it('should show edit and delete buttons for author', () => {
    render(
      <BrowserRouter>
        <PostDetail
          post={mockPost}
          author={mockAuthor}
          isAuthor={true}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('编辑')).toBeInTheDocument();
    expect(screen.getByText('删除')).toBeInTheDocument();
  });

  it('should not show edit and delete buttons for non-author', () => {
    render(
      <BrowserRouter>
        <PostDetail
          post={mockPost}
          author={mockAuthor}
          isAuthor={false}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    expect(screen.queryByText('编辑')).not.toBeInTheDocument();
    expect(screen.queryByText('删除')).not.toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    render(
      <BrowserRouter>
        <PostDetail
          post={mockPost}
          author={mockAuthor}
          isAuthor={true}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      </BrowserRouter>
    );

    const editButton = screen.getByText('编辑');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(mockOnEdit).toHaveBeenCalled();
    });
  });

  it('should call onDelete when delete button is clicked', async () => {
    render(
      <BrowserRouter>
        <PostDetail
          post={mockPost}
          author={mockAuthor}
          isAuthor={true}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      </BrowserRouter>
    );

    const deleteButton = screen.getByText('删除');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalled();
    });
  });

  it('should show report button for non-author', () => {
    render(
      <BrowserRouter>
        <PostDetail
          post={mockPost}
          author={mockAuthor}
          isAuthor={false}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('举报')).toBeInTheDocument();
  });

  it('should call onReport when report button is clicked', async () => {
    render(
      <BrowserRouter>
        <PostDetail
          post={mockPost}
          author={mockAuthor}
          isAuthor={false}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    const reportButton = screen.getByText('举报');
    fireEvent.click(reportButton);

    // May show a modal or confirmation dialog
    await waitFor(() => {
      expect(mockOnReport).toHaveBeenCalled();
    });
  });

  it('should sanitize dangerous HTML/XSS in markdown', () => {
    const xssPost: Post = {
      ...mockPost,
      content: '<script>alert("XSS")</script>\n\n<img src=x onerror="alert(\'XSS\')">'
    };

    render(
      <BrowserRouter>
        <PostDetail
          post={xssPost}
          author={mockAuthor}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    // Script tags should be sanitized
    const scripts = document.querySelectorAll('script');
    expect(scripts.length).toBe(0);
  });

  it('should render external links with target="_blank"', () => {
    render(
      <BrowserRouter>
        <PostDetail
          post={mockPost}
          author={mockAuthor}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    const link = screen.getByText('Link') as HTMLAnchorElement;
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
  });

  it('should show journal badge when journalId exists', () => {
    const postWithJournal: Post = {
      ...mockPost,
      journalId: 1
    };

    render(
      <BrowserRouter>
        <PostDetail
          post={postWithJournal}
          author={mockAuthor}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    expect(screen.getByText(/关联期刊/)).toBeInTheDocument();
  });

  it('should display formatted timestamp', () => {
    render(
      <BrowserRouter>
        <PostDetail
          post={mockPost}
          author={mockAuthor}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    // Should show some time display
    const timeElement = screen.getByText(/2024|前/);
    expect(timeElement).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    render(
      <BrowserRouter>
        <PostDetail
          post={mockPost}
          author={mockAuthor}
          loading={true}
          onLike={mockOnLike}
          onFavorite={mockOnFavorite}
          onFollow={mockOnFollow}
          onReport={mockOnReport}
        />
      </BrowserRouter>
    );

    // May show skeleton or spinner
    const loadingElement = screen.queryByText(/加载中|Loading/);
    expect(loadingElement).toBeInTheDocument();
  });
});
