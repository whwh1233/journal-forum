import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { postService } from '@/features/posts/services/postService';
import PostCommentItem from '@/features/posts/components/PostCommentItem';
import { PostComment } from '@/features/posts/types/post';

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

// Mock the postService
vi.mock('@/features/posts/services/postService', () => ({
  postService: {
    deleteComment: vi.fn(),
    toggleCommentLike: vi.fn()
  }
}));

// Mock child components
vi.mock('@/features/posts/components/PostCommentForm', () => ({
  default: ({ postId, parentId, onCommentAdded, onCancel, isReply }: any) => (
    <div data-testid="post-comment-form">
      <span>Reply Form for post {postId}, parent {parentId}</span>
      <button onClick={onCommentAdded}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

vi.mock('@/features/follow/components/FollowButton', () => ({
  default: ({ userId }: { userId: string }) => (
    <button data-testid={`follow-btn-${userId}`}>Follow</button>
  )
}));

vi.mock('@/features/badges', () => ({
  BadgeList: () => <div data-testid="badge-list">Badges</div>
}));

const mockComment: PostComment = {
  id: 1,
  postId: 100,
  userId: 'user-123',
  userName: 'Test User',
  userAvatar: 'https://example.com/avatar.jpg',
  content: 'This is a test comment',
  likeCount: 5,
  isDeleted: false,
  userLiked: false,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z'
};

const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user'
};

const mockAdminUser = {
  id: 'admin-456',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin'
};

describe('PostCommentItem', () => {
  const mockOnCommentUpdated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
  });

  describe('Basic Rendering', () => {
    it('should render comment content', () => {
      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    });

    it('should render user name with link to profile', () => {
      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      const userLink = screen.getByText('Test User');
      expect(userLink).toBeInTheDocument();
      expect(userLink.closest('a')).toHaveAttribute('href', '/profile/user-123');
    });

    it('should render formatted date', () => {
      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      // Should show either relative or absolute date format
      const dateElement = screen.getByText(/2024|前|刚刚/);
      expect(dateElement).toBeInTheDocument();
    });

    it('should show edited indicator when updatedAt differs from createdAt', () => {
      const editedComment: PostComment = {
        ...mockComment,
        updatedAt: '2024-01-16T10:30:00Z'
      };

      render(
        <BrowserRouter>
          <PostCommentItem
            comment={editedComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('(已编辑)')).toBeInTheDocument();
    });

    it('should render like count', () => {
      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should apply correct level class', () => {
      const { container } = render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            level={1}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      expect(container.querySelector('.level-1')).toBeInTheDocument();
    });
  });

  describe('Deleted Comments', () => {
    it('should show deleted message for deleted comments', () => {
      const deletedComment: PostComment = {
        ...mockComment,
        isDeleted: true,
        content: '[This comment has been deleted]'
      };

      render(
        <BrowserRouter>
          <PostCommentItem
            comment={deletedComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      const content = screen.getByText('[This comment has been deleted]');
      expect(content).toHaveClass('post-comment-deleted');
    });

    it('should not show action buttons for deleted comments', () => {
      const deletedComment: PostComment = {
        ...mockComment,
        isDeleted: true
      };

      render(
        <BrowserRouter>
          <PostCommentItem
            comment={deletedComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      expect(screen.queryByText('回复')).not.toBeInTheDocument();
      expect(screen.queryByText('删除')).not.toBeInTheDocument();
    });
  });

  describe('Like Functionality', () => {
    it('should render like button', () => {
      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      const likeButton = screen.getByTitle('标记为有用');
      expect(likeButton).toBeInTheDocument();
    });

    it('should show liked state when userLiked is true', () => {
      const likedComment: PostComment = {
        ...mockComment,
        userLiked: true
      };

      const { container } = render(
        <BrowserRouter>
          <PostCommentItem
            comment={likedComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      const likeButton = container.querySelector('.post-comment-helpful-btn.liked');
      expect(likeButton).toBeInTheDocument();
    });

    it('should call toggleCommentLike when like button is clicked', async () => {
      vi.mocked(postService.toggleCommentLike).mockResolvedValue({ liked: true, likeCount: 6 });

      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      const likeButton = screen.getByTitle('标记为有用');
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(postService.toggleCommentLike).toHaveBeenCalledWith(1);
      });
    });

    it('should update like count after successful like toggle', async () => {
      vi.mocked(postService.toggleCommentLike).mockResolvedValue({ liked: true, likeCount: 6 });

      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      const likeButton = screen.getByTitle('标记为有用');
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument();
      });
    });

    it('should disable like button when user is not logged in', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null } as any);

      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      const likeButton = screen.getByTitle('标记为有用');
      expect(likeButton).toBeDisabled();
    });
  });

  describe('Reply Functionality', () => {
    it('should show reply button when level < 2', () => {
      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            level={0}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('回复')).toBeInTheDocument();
    });

    it('should not show reply button when level >= 2', () => {
      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            level={2}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      expect(screen.queryByText('回复')).not.toBeInTheDocument();
    });

    it('should show reply form when reply button is clicked', () => {
      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            level={0}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      const replyButton = screen.getByText('回复');
      fireEvent.click(replyButton);

      expect(screen.getByTestId('post-comment-form')).toBeInTheDocument();
    });

    it('should hide reply form when cancel is clicked', () => {
      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            level={0}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      // Open reply form
      fireEvent.click(screen.getByText('回复'));
      expect(screen.getByTestId('post-comment-form')).toBeInTheDocument();

      // Close reply form
      fireEvent.click(screen.getAllByText('Cancel')[0]);
      expect(screen.queryByTestId('post-comment-form')).not.toBeInTheDocument();
    });

    it('should toggle reply form visibility', () => {
      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            level={0}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      const replyButton = screen.getByText('回复');

      // Open
      fireEvent.click(replyButton);
      expect(screen.getByTestId('post-comment-form')).toBeInTheDocument();

      // Close by clicking reply again
      fireEvent.click(replyButton);
      expect(screen.queryByTestId('post-comment-form')).not.toBeInTheDocument();
    });
  });

  describe('Delete Functionality', () => {
    it('should show delete button for comment author', () => {
      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('删除')).toBeInTheDocument();
    });

    it('should show delete button for admin user', () => {
      vi.mocked(useAuth).mockReturnValue({ user: mockAdminUser } as any);

      const otherUserComment: PostComment = {
        ...mockComment,
        userId: 'other-user-789'
      };

      render(
        <BrowserRouter>
          <PostCommentItem
            comment={otherUserComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('删除')).toBeInTheDocument();
    });

    it('should not show delete button for other users', () => {
      const otherUserComment: PostComment = {
        ...mockComment,
        userId: 'other-user-789'
      };

      render(
        <BrowserRouter>
          <PostCommentItem
            comment={otherUserComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      expect(screen.queryByText('删除')).not.toBeInTheDocument();
    });

    it('should call deleteComment when delete is confirmed', async () => {
      vi.mocked(postService.deleteComment).mockResolvedValue({});
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      const deleteButton = screen.getByText('删除');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(postService.deleteComment).toHaveBeenCalledWith(1);
      });
    });

    it('should call onCommentUpdated after successful delete', async () => {
      vi.mocked(postService.deleteComment).mockResolvedValue({});
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      const deleteButton = screen.getByText('删除');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnCommentUpdated).toHaveBeenCalled();
      });
    });

    it('should not delete when user cancels confirmation', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      const deleteButton = screen.getByText('删除');
      fireEvent.click(deleteButton);

      expect(postService.deleteComment).not.toHaveBeenCalled();
    });
  });

  describe('Nested Replies', () => {
    it('should render nested replies', () => {
      const commentWithReplies: PostComment = {
        ...mockComment,
        replies: [
          {
            id: 2,
            postId: 100,
            userId: 'user-456',
            userName: 'Reply User',
            content: 'This is a reply',
            likeCount: 2,
            isDeleted: false,
            createdAt: '2024-01-15T11:00:00Z',
            updatedAt: '2024-01-15T11:00:00Z'
          }
        ]
      };

      render(
        <BrowserRouter>
          <PostCommentItem
            comment={commentWithReplies}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('This is a reply')).toBeInTheDocument();
      expect(screen.getByText('Reply User')).toBeInTheDocument();
    });

    it('should render multiple nested replies', () => {
      const commentWithReplies: PostComment = {
        ...mockComment,
        replies: [
          {
            id: 2,
            postId: 100,
            userId: 'user-456',
            userName: 'Reply User 1',
            content: 'First reply',
            likeCount: 2,
            isDeleted: false,
            createdAt: '2024-01-15T11:00:00Z',
            updatedAt: '2024-01-15T11:00:00Z'
          },
          {
            id: 3,
            postId: 100,
            userId: 'user-789',
            userName: 'Reply User 2',
            content: 'Second reply',
            likeCount: 1,
            isDeleted: false,
            createdAt: '2024-01-15T12:00:00Z',
            updatedAt: '2024-01-15T12:00:00Z'
          }
        ]
      };

      render(
        <BrowserRouter>
          <PostCommentItem
            comment={commentWithReplies}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('First reply')).toBeInTheDocument();
      expect(screen.getByText('Second reply')).toBeInTheDocument();
    });
  });

  describe('Follow Button', () => {
    it('should show follow button for other users', () => {
      const otherUserComment: PostComment = {
        ...mockComment,
        userId: 'other-user-789'
      };

      render(
        <BrowserRouter>
          <PostCommentItem
            comment={otherUserComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      expect(screen.getByTestId('follow-btn-other-user-789')).toBeInTheDocument();
    });

    it('should not show follow button for own comment', () => {
      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      expect(screen.queryByTestId('follow-btn-user-123')).not.toBeInTheDocument();
    });

    it('should not show follow button when user is not logged in', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null } as any);

      render(
        <BrowserRouter>
          <PostCommentItem
            comment={mockComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      expect(screen.queryByTestId(/follow-btn/)).not.toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should show "just now" for recent comments', () => {
      const recentComment: PostComment = {
        ...mockComment,
        createdAt: new Date().toISOString()
      };

      render(
        <BrowserRouter>
          <PostCommentItem
            comment={recentComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('刚刚')).toBeInTheDocument();
    });

    it('should show minutes ago for comments within an hour', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const recentComment: PostComment = {
        ...mockComment,
        createdAt: tenMinutesAgo
      };

      render(
        <BrowserRouter>
          <PostCommentItem
            comment={recentComment}
            onCommentUpdated={mockOnCommentUpdated}
          />
        </BrowserRouter>
      );

      expect(screen.getByText(/10分钟前/)).toBeInTheDocument();
    });
  });
});
