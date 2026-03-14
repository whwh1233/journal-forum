import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { postService } from '@/features/posts/services/postService';
import PostCommentList from '@/features/posts/components/PostCommentList';
import { PostComment } from '@/features/posts/types/post';

// Mock the postService
vi.mock('@/features/posts/services/postService', () => ({
  postService: {
    getComments: vi.fn()
  }
}));

// Mock PostCommentForm
vi.mock('@/features/posts/components/PostCommentForm', () => ({
  default: ({ postId, onCommentAdded }: { postId: number; onCommentAdded: () => void }) => (
    <div data-testid="post-comment-form">
      <span>Comment Form for post {postId}</span>
      <button onClick={onCommentAdded}>Add Comment</button>
    </div>
  )
}));

// Mock PostCommentItem
vi.mock('@/features/posts/components/PostCommentItem', () => ({
  default: ({ comment, onCommentUpdated }: { comment: PostComment; onCommentUpdated: () => void }) => (
    <div data-testid={`comment-item-${comment.id}`}>
      <span>{comment.content}</span>
      <button onClick={onCommentUpdated}>Update</button>
    </div>
  )
}));

const mockComments: PostComment[] = [
  {
    id: 1,
    postId: 100,
    userId: 'user-123',
    userName: 'User One',
    content: 'First comment',
    likeCount: 10,
    isDeleted: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    postId: 100,
    userId: 'user-456',
    userName: 'User Two',
    content: 'Second comment',
    likeCount: 5,
    isDeleted: false,
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z'
  },
  {
    id: 3,
    postId: 100,
    userId: 'user-789',
    userName: 'User Three',
    content: 'Third comment',
    likeCount: 2,
    isDeleted: false,
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z'
  }
];

describe('PostCommentList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading state initially', async () => {
      vi.mocked(postService).getComments.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)));

      render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when loading fails', async () => {
      vi.mocked(postService).getComments.mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('加载评论失败')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no comments', async () => {
      vi.mocked(postService).getComments.mockResolvedValue([]);

      render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/还没有评论/)).toBeInTheDocument();
      });
    });
  });

  describe('Comments Display', () => {
    it('should display comments after loading', async () => {
      vi.mocked(postService).getComments.mockResolvedValue(mockComments);

      render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('First comment')).toBeInTheDocument();
        expect(screen.getByText('Second comment')).toBeInTheDocument();
        expect(screen.getByText('Third comment')).toBeInTheDocument();
      });
    });

    it('should display comment count in header', async () => {
      vi.mocked(postService).getComments.mockResolvedValue(mockComments);

      render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('评论 (3)')).toBeInTheDocument();
      });
    });

    it('should render correct number of comment items', async () => {
      vi.mocked(postService).getComments.mockResolvedValue(mockComments);

      render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('comment-item-1')).toBeInTheDocument();
        expect(screen.getByTestId('comment-item-2')).toBeInTheDocument();
        expect(screen.getByTestId('comment-item-3')).toBeInTheDocument();
      });
    });
  });

  describe('Comment Form', () => {
    it('should render PostCommentForm component', async () => {
      vi.mocked(postService).getComments.mockResolvedValue(mockComments);

      render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('post-comment-form')).toBeInTheDocument();
        expect(screen.getByText('Comment Form for post 100')).toBeInTheDocument();
      });
    });

    it('should reload comments when new comment is added', async () => {
      vi.mocked(postService).getComments.mockResolvedValue(mockComments);

      render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('post-comment-form')).toBeInTheDocument();
      });

      // Initial load
      expect(postService.getComments).toHaveBeenCalledTimes(1);

      // Trigger comment added
      const addButton = screen.getByText('Add Comment');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(postService.getComments).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Sorting', () => {
    it('should render sort selector', async () => {
      vi.mocked(postService).getComments.mockResolvedValue(mockComments);

      render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/排序/)).toBeInTheDocument();
      });
    });

    it('should have three sort options', async () => {
      vi.mocked(postService).getComments.mockResolvedValue(mockComments);

      render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
      });

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('最新');
      expect(options[1]).toHaveTextContent('最早');
      expect(options[2]).toHaveTextContent('最有用');
    });

    it('should sort by newest by default', async () => {
      vi.mocked(postService).getComments.mockResolvedValue(mockComments);

      render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toHaveValue('newest');
      });
    });

    it('should reload comments when sort changes', async () => {
      vi.mocked(postService).getComments.mockResolvedValue(mockComments);

      render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'oldest' } });

      await waitFor(() => {
        expect(postService.getComments).toHaveBeenCalledTimes(2);
      });
    });

    it('should sort comments by newest first', async () => {
      vi.mocked(postService).getComments.mockResolvedValue(mockComments);

      const { container } = render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        const commentItems = container.querySelectorAll('[data-testid^="comment-item-"]');
        expect(commentItems.length).toBe(3);
      });

      // With 'newest' sort, comment 2 (11:00) should come before comment 1 (10:00)
      const commentItems = container.querySelectorAll('[data-testid^="comment-item-"]');
      expect(commentItems[0]).toHaveAttribute('data-testid', 'comment-item-2');
    });

    it('should sort comments by oldest first when selected', async () => {
      vi.mocked(postService).getComments.mockResolvedValue(mockComments);

      const { container } = render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'oldest' } });

      await waitFor(() => {
        const commentItems = container.querySelectorAll('[data-testid^="comment-item-"]');
        // With 'oldest' sort, comment 3 (09:00) should be first
        expect(commentItems[0]).toHaveAttribute('data-testid', 'comment-item-3');
      });
    });

    it('should sort comments by most helpful when selected', async () => {
      vi.mocked(postService).getComments.mockResolvedValue(mockComments);

      const { container } = render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'helpful' } });

      await waitFor(() => {
        const commentItems = container.querySelectorAll('[data-testid^="comment-item-"]');
        // With 'helpful' sort, comment 1 (10 likes) should be first
        expect(commentItems[0]).toHaveAttribute('data-testid', 'comment-item-1');
      });
    });
  });

  describe('Comment Updates', () => {
    it('should reload comments when onCommentUpdated is called', async () => {
      vi.mocked(postService).getComments.mockResolvedValue(mockComments);

      render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('comment-item-1')).toBeInTheDocument();
      });

      // Initial load
      expect(postService.getComments).toHaveBeenCalledTimes(1);

      // Trigger update on a comment
      const updateButton = screen.getAllByText('Update')[0];
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(postService.getComments).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Post ID Changes', () => {
    it('should reload comments when postId changes', async () => {
      vi.mocked(postService).getComments.mockResolvedValue(mockComments);

      const { rerender } = render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(postService.getComments).toHaveBeenCalledWith(100);
      });

      rerender(
        <BrowserRouter>
          <PostCommentList postId={200} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(postService.getComments).toHaveBeenCalledWith(200);
      });
    });
  });

  describe('CSS Classes', () => {
    it('should have correct container class', async () => {
      vi.mocked(postService).getComments.mockResolvedValue(mockComments);

      const { container } = render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(container.querySelector('.post-comment-list')).toBeInTheDocument();
      });
    });

    it('should have header with title and sort', async () => {
      vi.mocked(postService).getComments.mockResolvedValue(mockComments);

      const { container } = render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(container.querySelector('.post-comment-list-header')).toBeInTheDocument();
        expect(container.querySelector('.post-comment-list-title')).toBeInTheDocument();
        expect(container.querySelector('.post-comment-list-sort')).toBeInTheDocument();
      });
    });

    it('should have loading class during loading', () => {
      vi.mocked(postService).getComments.mockImplementation(() => new Promise(() => {}));

      const { container } = render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      expect(container.querySelector('.post-comment-list-loading')).toBeInTheDocument();
    });

    it('should have error class on error', async () => {
      vi.mocked(postService).getComments.mockRejectedValue(new Error('Error'));

      const { container } = render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(container.querySelector('.post-comment-list-error')).toBeInTheDocument();
      });
    });

    it('should have empty class when no comments', async () => {
      vi.mocked(postService).getComments.mockResolvedValue([]);

      const { container } = render(
        <BrowserRouter>
          <PostCommentList postId={100} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(container.querySelector('.post-comment-list-empty')).toBeInTheDocument();
      });
    });
  });
});
