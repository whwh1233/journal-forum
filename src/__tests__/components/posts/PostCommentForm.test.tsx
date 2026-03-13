import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCommentForm from '@/features/posts/components/PostCommentForm';

// Mock the useAuth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

// Mock the postService
vi.mock('@/features/posts/services/postService', () => ({
  postService: {
    createComment: vi.fn()
  }
}));

const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com'
};

describe('PostCommentForm', () => {
  const mockOnCommentAdded = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: user is logged in
    const { useAuth } = require('../../../hooks/useAuth');
    useAuth.mockReturnValue({ user: mockUser });
  });

  describe('When user is not logged in', () => {
    it('should show login prompt for comment', () => {
      const { useAuth } = require('../../../hooks/useAuth');
      useAuth.mockReturnValue({ user: null });

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      expect(screen.getByText(/Please log in to post a comment/)).toBeInTheDocument();
    });

    it('should show login prompt for reply', () => {
      const { useAuth } = require('../../../hooks/useAuth');
      useAuth.mockReturnValue({ user: null });

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            parentId={10}
            onCommentAdded={mockOnCommentAdded}
            isReply={true}
          />
        </BrowserRouter>
      );

      expect(screen.getByText(/Please log in to post a reply/)).toBeInTheDocument();
    });
  });

  describe('When user is logged in', () => {
    it('should render textarea for comment', () => {
      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText('Write your comment...');
      expect(textarea).toBeInTheDocument();
    });

    it('should render textarea with reply placeholder when isReply is true', () => {
      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            parentId={10}
            onCommentAdded={mockOnCommentAdded}
            isReply={true}
          />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText('Write your reply...');
      expect(textarea).toBeInTheDocument();
    });

    it('should render submit button for comment', () => {
      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      const submitButton = screen.getByText('Post Comment');
      expect(submitButton).toBeInTheDocument();
    });

    it('should render submit button for reply when isReply is true', () => {
      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            parentId={10}
            onCommentAdded={mockOnCommentAdded}
            isReply={true}
          />
        </BrowserRouter>
      );

      const submitButton = screen.getByText('Reply');
      expect(submitButton).toBeInTheDocument();
    });

    it('should render cancel button when onCancel is provided', () => {
      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
            onCancel={mockOnCancel}
          />
        </BrowserRouter>
      );

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeInTheDocument();
    });

    it('should not render cancel button when onCancel is not provided', () => {
      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('should call onCancel when cancel button is clicked', () => {
      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
            onCancel={mockOnCancel}
          />
        </BrowserRouter>
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should update textarea value when typing', () => {
      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText('Write your comment...');
      fireEvent.change(textarea, { target: { value: 'Test comment content' } });

      expect(textarea).toHaveValue('Test comment content');
    });

    it('should show alert when submitting empty content', () => {
      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      expect(mockAlert).toHaveBeenCalledWith('Please enter comment content');
      mockAlert.mockRestore();
    });

    it('should submit comment successfully', async () => {
      const { postService } = require('@/features/posts/services/postService');
      postService.createComment.mockResolvedValue({ id: 1, content: 'Test comment' });

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText('Write your comment...');
      fireEvent.change(textarea, { target: { value: 'Test comment content' } });

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(postService.createComment).toHaveBeenCalledWith(1, {
          content: 'Test comment content',
          parentId: undefined
        });
      });

      await waitFor(() => {
        expect(mockOnCommentAdded).toHaveBeenCalled();
      });
    });

    it('should submit reply with parentId', async () => {
      const { postService } = require('@/features/posts/services/postService');
      postService.createComment.mockResolvedValue({ id: 2, content: 'Test reply' });

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            parentId={10}
            onCommentAdded={mockOnCommentAdded}
            isReply={true}
          />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText('Write your reply...');
      fireEvent.change(textarea, { target: { value: 'Test reply content' } });

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(postService.createComment).toHaveBeenCalledWith(1, {
          content: 'Test reply content',
          parentId: 10
        });
      });
    });

    it('should clear textarea after successful submission', async () => {
      const { postService } = require('@/features/posts/services/postService');
      postService.createComment.mockResolvedValue({ id: 1, content: 'Test comment' });

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText('Write your comment...');
      fireEvent.change(textarea, { target: { value: 'Test comment content' } });

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });

    it('should call onCancel after successful reply submission', async () => {
      const { postService } = require('@/features/posts/services/postService');
      postService.createComment.mockResolvedValue({ id: 1, content: 'Test reply' });

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            parentId={10}
            onCommentAdded={mockOnCommentAdded}
            onCancel={mockOnCancel}
            isReply={true}
          />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText('Write your reply...');
      fireEvent.change(textarea, { target: { value: 'Test reply content' } });

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnCancel).toHaveBeenCalled();
      });
    });

    it('should show submitting state during submission', async () => {
      const { postService } = require('@/features/posts/services/postService');
      postService.createComment.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText('Write your comment...');
      fireEvent.change(textarea, { target: { value: 'Test comment content' } });

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Posting...')).toBeInTheDocument();
      });
    });

    it('should disable textarea and buttons during submission', async () => {
      const { postService } = require('@/features/posts/services/postService');
      postService.createComment.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
            onCancel={mockOnCancel}
          />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText('Write your comment...');
      fireEvent.change(textarea, { target: { value: 'Test comment content' } });

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(textarea).toBeDisabled();
        expect(screen.getByText('Cancel')).toBeDisabled();
      });
    });

    it('should show error alert when submission fails', async () => {
      const { postService } = require('@/features/posts/services/postService');
      postService.createComment.mockRejectedValue(new Error('Network error'));

      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText('Write your comment...');
      fireEvent.change(textarea, { target: { value: 'Test comment content' } });

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Network error');
      });

      mockAlert.mockRestore();
    });

    it('should have different textarea rows for comment vs reply', () => {
      const { rerender } = render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      let textarea = screen.getByPlaceholderText('Write your comment...');
      expect(textarea).toHaveAttribute('rows', '4');

      rerender(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            parentId={10}
            onCommentAdded={mockOnCommentAdded}
            isReply={true}
          />
        </BrowserRouter>
      );

      textarea = screen.getByPlaceholderText('Write your reply...');
      expect(textarea).toHaveAttribute('rows', '3');
    });

    it('should trim whitespace from content before submission', async () => {
      const { postService } = require('@/features/posts/services/postService');
      postService.createComment.mockResolvedValue({ id: 1, content: 'Test comment' });

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText('Write your comment...');
      fireEvent.change(textarea, { target: { value: '  Test comment content  ' } });

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(postService.createComment).toHaveBeenCalledWith(1, {
          content: 'Test comment content',
          parentId: undefined
        });
      });
    });

    it('should not submit if content is only whitespace', () => {
      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText('Write your comment...');
      fireEvent.change(textarea, { target: { value: '   ' } });

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      expect(mockAlert).toHaveBeenCalledWith('Please enter comment content');
      mockAlert.mockRestore();
    });
  });
});
