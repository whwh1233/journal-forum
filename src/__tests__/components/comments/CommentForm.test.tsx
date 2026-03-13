import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../helpers/testUtils';
import userEvent from '@testing-library/user-event';
import CommentForm from '@/features/comments/components/CommentForm';

// Create mock functions
const mockCreateComment = vi.fn().mockResolvedValue({ id: 'new-comment-id' });

// Mock the commentService - the component uses dynamic import
vi.mock('@/services/commentService', () => ({
  createComment: (...args: any[]) => mockCreateComment(...args),
}));

// Mock the useAuth hook with module-level variable for flexibility
let mockUserValue: any = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  role: 'user' as const,
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUserValue,
    isAuthenticated: !!mockUserValue,
    loading: false,
  }),
}));

// Mock DimensionRatingInput component
vi.mock('@/features/comments/components/DimensionRatingInput', () => ({
  default: ({ value, onChange }: { value: any; onChange: (v: any) => void }) => (
    <div data-testid="dimension-rating-input">
      <button
        data-testid="set-overall-rating"
        onClick={() => onChange({ ...value, overallExperience: 5 })}
      >
        Set Rating
      </button>
    </div>
  ),
}));

describe('CommentForm', () => {
  const mockOnCommentAdded = vi.fn();
  const mockOnCancel = vi.fn();
  const journalId = 'journal-1';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock user
    mockUserValue = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
    };
    // Reset mock alert
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders form with textarea and submit button when user is logged in', () => {
      render(
        <CommentForm journalId={journalId} onCommentAdded={mockOnCommentAdded} />
      );

      expect(screen.getByPlaceholderText(/写下你的评论/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /发表评论/ })).toBeInTheDocument();
    });

    it('renders DimensionRatingInput for top-level comments', () => {
      render(
        <CommentForm journalId={journalId} onCommentAdded={mockOnCommentAdded} />
      );

      expect(screen.getByTestId('dimension-rating-input')).toBeInTheDocument();
    });

    it('does not render DimensionRatingInput for replies', () => {
      render(
        <CommentForm
          journalId={journalId}
          parentId="parent-1"
          onCommentAdded={mockOnCommentAdded}
          isReply={true}
        />
      );

      expect(screen.queryByTestId('dimension-rating-input')).not.toBeInTheDocument();
    });

    it('shows "reply" placeholder for reply form', () => {
      render(
        <CommentForm
          journalId={journalId}
          parentId="parent-1"
          onCommentAdded={mockOnCommentAdded}
          isReply={true}
        />
      );

      expect(screen.getByPlaceholderText(/写下你的回复/)).toBeInTheDocument();
    });

    it('shows cancel button when onCancel is provided', () => {
      render(
        <CommentForm
          journalId={journalId}
          onCommentAdded={mockOnCommentAdded}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /取消/ })).toBeInTheDocument();
    });

    it('does not show cancel button when onCancel is not provided', () => {
      render(
        <CommentForm journalId={journalId} onCommentAdded={mockOnCommentAdded} />
      );

      expect(screen.queryByRole('button', { name: /取消/ })).not.toBeInTheDocument();
    });

    it('shows login prompt when user is not logged in', () => {
      mockUserValue = null;

      render(
        <CommentForm journalId={journalId} onCommentAdded={mockOnCommentAdded} />
      );

      expect(screen.getByText(/请先登录后发表评论/)).toBeInTheDocument();
    });

    it('shows login prompt with "reply" text for reply form when not logged in', () => {
      mockUserValue = null;

      render(
        <CommentForm
          journalId={journalId}
          parentId="parent-1"
          onCommentAdded={mockOnCommentAdded}
          isReply={true}
        />
      );

      expect(screen.getByText(/请先登录后发表回复/)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows alert when submitting empty content', async () => {
      render(
        <CommentForm journalId={journalId} onCommentAdded={mockOnCommentAdded} />
      );

      await userEvent.click(screen.getByRole('button', { name: /发表评论/ }));

      expect(window.alert).toHaveBeenCalledWith('请输入评论内容');
    });

    it('shows alert when submitting top-level comment without overall rating', async () => {
      render(
        <CommentForm journalId={journalId} onCommentAdded={mockOnCommentAdded} />
      );

      await userEvent.type(screen.getByPlaceholderText(/写下你的评论/), 'Test comment');
      await userEvent.click(screen.getByRole('button', { name: /发表评论/ }));

      expect(window.alert).toHaveBeenCalledWith('请至少填写综合体验评分');
    });
  });

  describe('Form Submission', () => {
    it('submits comment when form is valid for top-level comment', async () => {
      render(
        <CommentForm journalId={journalId} onCommentAdded={mockOnCommentAdded} />
      );

      // Fill in the comment content
      await userEvent.type(screen.getByPlaceholderText(/写下你的评论/), 'Test comment');

      // Set the rating
      await userEvent.click(screen.getByTestId('set-overall-rating'));

      // Submit the form
      await userEvent.click(screen.getByRole('button', { name: /发表评论/ }));

      await waitFor(() => {
        expect(mockCreateComment).toHaveBeenCalledWith({
          journalId: journalId,
          parentId: null,
          content: 'Test comment',
          dimensionRatings: { overallExperience: 5 },
        });
      });

      expect(mockOnCommentAdded).toHaveBeenCalled();
    });

    it('submits reply without dimension ratings', async () => {
      render(
        <CommentForm
          journalId={journalId}
          parentId="parent-1"
          onCommentAdded={mockOnCommentAdded}
          isReply={true}
        />
      );

      await userEvent.type(screen.getByPlaceholderText(/写下你的回复/), 'Test reply');
      await userEvent.click(screen.getByRole('button', { name: /回复/ }));

      await waitFor(() => {
        expect(mockCreateComment).toHaveBeenCalledWith({
          journalId: journalId,
          parentId: 'parent-1',
          content: 'Test reply',
          dimensionRatings: undefined,
        });
      });

      expect(mockOnCommentAdded).toHaveBeenCalled();
    });

    it('clears form after successful submission', async () => {
      render(
        <CommentForm journalId={journalId} onCommentAdded={mockOnCommentAdded} />
      );

      const textarea = screen.getByPlaceholderText(/写下你的评论/);
      await userEvent.type(textarea, 'Test comment');
      await userEvent.click(screen.getByTestId('set-overall-rating'));
      await userEvent.click(screen.getByRole('button', { name: /发表评论/ }));

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });

    it('calls onCancel after successful submission when provided', async () => {
      render(
        <CommentForm
          journalId={journalId}
          parentId="parent-1"
          onCommentAdded={mockOnCommentAdded}
          onCancel={mockOnCancel}
          isReply={true}
        />
      );

      await userEvent.type(screen.getByPlaceholderText(/写下你的回复/), 'Test reply');
      await userEvent.click(screen.getByRole('button', { name: /回复/ }));

      await waitFor(() => {
        expect(mockOnCancel).toHaveBeenCalled();
      });
    });

    it('shows error alert when submission fails', async () => {
      mockCreateComment.mockRejectedValueOnce({
        response: { data: { message: 'Submission failed' } },
      });

      render(
        <CommentForm
          journalId={journalId}
          parentId="parent-1"
          onCommentAdded={mockOnCommentAdded}
          isReply={true}
        />
      );

      await userEvent.type(screen.getByPlaceholderText(/写下你的回复/), 'Test reply');
      await userEvent.click(screen.getByRole('button', { name: /回复/ }));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Submission failed');
      });
    });
  });

  describe('Button States', () => {
    it('disables submit button during submission', async () => {
      mockCreateComment.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ id: 'new-id' }), 100))
      );

      render(
        <CommentForm
          journalId={journalId}
          parentId="parent-1"
          onCommentAdded={mockOnCommentAdded}
          isReply={true}
        />
      );

      await userEvent.type(screen.getByPlaceholderText(/写下你的回复/), 'Test reply');
      const submitButton = screen.getByRole('button', { name: /回复/ });
      fireEvent.click(submitButton);

      expect(await screen.findByRole('button', { name: /发布中/ })).toBeDisabled();
    });

    it('disables textarea during submission', async () => {
      mockCreateComment.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ id: 'new-id' }), 100))
      );

      render(
        <CommentForm
          journalId={journalId}
          parentId="parent-1"
          onCommentAdded={mockOnCommentAdded}
          isReply={true}
        />
      );

      const textarea = screen.getByPlaceholderText(/写下你的回复/);
      await userEvent.type(textarea, 'Test reply');
      fireEvent.click(screen.getByRole('button', { name: /回复/ }));

      await waitFor(() => {
        expect(textarea).toBeDisabled();
      });
    });

    it('calls onCancel when cancel button is clicked', async () => {
      render(
        <CommentForm
          journalId={journalId}
          onCommentAdded={mockOnCommentAdded}
          onCancel={mockOnCancel}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /取消/ }));

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Textarea rows', () => {
    it('has 4 rows for top-level comment', () => {
      render(
        <CommentForm journalId={journalId} onCommentAdded={mockOnCommentAdded} />
      );

      const textarea = screen.getByPlaceholderText(/写下你的评论/);
      expect(textarea).toHaveAttribute('rows', '4');
    });

    it('has 3 rows for reply', () => {
      render(
        <CommentForm
          journalId={journalId}
          parentId="parent-1"
          onCommentAdded={mockOnCommentAdded}
          isReply={true}
        />
      );

      const textarea = screen.getByPlaceholderText(/写下你的回复/);
      expect(textarea).toHaveAttribute('rows', '3');
    });
  });
});
