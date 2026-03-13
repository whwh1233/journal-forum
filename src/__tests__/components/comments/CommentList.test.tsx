import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../helpers/testUtils';
import userEvent from '@testing-library/user-event';
import CommentList from '@/features/comments/components/CommentList';
import type { Comment } from '@/types';

// Mock data
const mockComments: Comment[] = [
  {
    id: 'comment-1',
    userId: 1,
    userName: 'User One',
    journalId: 'journal-1',
    parentId: null,
    content: 'First test comment',
    rating: 5,
    dimensionRatings: {
      reviewSpeed: 4,
      editorAttitude: 5,
      acceptDifficulty: 3,
      reviewQuality: 4,
      overallExperience: 5,
    },
    likeCount: 3,
    isLikedByMe: false,
    createdAt: new Date().toISOString(),
    isDeleted: false,
    replies: [],
  },
  {
    id: 'comment-2',
    userId: 2,
    userName: 'User Two',
    journalId: 'journal-1',
    parentId: null,
    content: 'Second test comment',
    rating: 4,
    likeCount: 1,
    isLikedByMe: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    isDeleted: false,
    replies: [
      {
        id: 'reply-1',
        userId: 3,
        userName: 'User Three',
        journalId: 'journal-1',
        parentId: 'comment-2',
        content: 'This is a reply',
        createdAt: new Date().toISOString(),
        isDeleted: false,
      },
    ],
  },
];

// Mock the commentService
vi.mock('@/services/commentService', () => ({
  getCommentsByJournalId: vi.fn().mockResolvedValue([]),
}));

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'user' },
    isAuthenticated: true,
    loading: false,
  })),
}));

// Mock CommentForm component
vi.mock('@/features/comments/components/CommentForm', () => ({
  default: vi.fn(({ onCommentAdded }) => (
    <div data-testid="comment-form">
      <button onClick={onCommentAdded} data-testid="mock-submit-comment">
        Submit Comment
      </button>
    </div>
  )),
}));

// Mock CommentItem component
vi.mock('@/features/comments/components/CommentItem', () => ({
  default: vi.fn(({ comment, onCommentUpdated }) => (
    <div data-testid={`comment-item-${comment.id}`}>
      <p>{comment.content}</p>
      <span>{comment.userName}</span>
      <button onClick={onCommentUpdated} data-testid={`update-${comment.id}`}>
        Update
      </button>
    </div>
  )),
}));

describe('CommentList', () => {
  const journalId = 'journal-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders comment list header with title and sort selector', async () => {
      const { getCommentsByJournalId } = await import('@/services/commentService');
      vi.mocked(getCommentsByJournalId).mockResolvedValue(mockComments);

      render(<CommentList journalId={journalId} />);

      await waitFor(() => {
        expect(screen.getByText(/评论/)).toBeInTheDocument();
        expect(screen.getByText(/排序/)).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('renders CommentForm for adding new comments', async () => {
      const { getCommentsByJournalId } = await import('@/services/commentService');
      vi.mocked(getCommentsByJournalId).mockResolvedValue([]);

      render(<CommentList journalId={journalId} />);

      await waitFor(() => {
        expect(screen.getByTestId('comment-form')).toBeInTheDocument();
      });
    });

    it('displays comment count in header', async () => {
      const { getCommentsByJournalId } = await import('@/services/commentService');
      vi.mocked(getCommentsByJournalId).mockResolvedValue(mockComments);

      render(<CommentList journalId={journalId} />);

      await waitFor(() => {
        expect(screen.getByText(/评论 \(2\)/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator while fetching comments', async () => {
      const { getCommentsByJournalId } = await import('@/services/commentService');
      vi.mocked(getCommentsByJournalId).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 1000))
      );

      render(<CommentList journalId={journalId} />);

      expect(screen.getByText(/加载中/)).toBeInTheDocument();
    });

    it('hides loading indicator after comments are loaded', async () => {
      const { getCommentsByJournalId } = await import('@/services/commentService');
      vi.mocked(getCommentsByJournalId).mockResolvedValue(mockComments);

      render(<CommentList journalId={journalId} />);

      await waitFor(() => {
        expect(screen.queryByText(/加载中/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('displays error message when loading fails', async () => {
      const { getCommentsByJournalId } = await import('@/services/commentService');
      vi.mocked(getCommentsByJournalId).mockRejectedValue(new Error('Network error'));

      render(<CommentList journalId={journalId} />);

      await waitFor(() => {
        expect(screen.getByText(/加载评论失败/)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('displays empty message when there are no comments', async () => {
      const { getCommentsByJournalId } = await import('@/services/commentService');
      vi.mocked(getCommentsByJournalId).mockResolvedValue([]);

      render(<CommentList journalId={journalId} />);

      await waitFor(() => {
        expect(screen.getByText(/还没有评论/)).toBeInTheDocument();
      });
    });
  });

  describe('Comments Display', () => {
    it('renders all comments', async () => {
      const { getCommentsByJournalId } = await import('@/services/commentService');
      vi.mocked(getCommentsByJournalId).mockResolvedValue(mockComments);

      render(<CommentList journalId={journalId} />);

      await waitFor(() => {
        expect(screen.getByTestId('comment-item-comment-1')).toBeInTheDocument();
        expect(screen.getByTestId('comment-item-comment-2')).toBeInTheDocument();
      });
    });

    it('displays comment content and author name', async () => {
      const { getCommentsByJournalId } = await import('@/services/commentService');
      vi.mocked(getCommentsByJournalId).mockResolvedValue(mockComments);

      render(<CommentList journalId={journalId} />);

      await waitFor(() => {
        expect(screen.getByText('First test comment')).toBeInTheDocument();
        expect(screen.getByText('User One')).toBeInTheDocument();
      });
    });
  });

  describe('Sort Functionality', () => {
    it('has default sort option as "newest"', async () => {
      const { getCommentsByJournalId } = await import('@/services/commentService');
      vi.mocked(getCommentsByJournalId).mockResolvedValue([]);

      render(<CommentList journalId={journalId} />);

      await waitFor(() => {
        const sortSelect = screen.getByRole('combobox');
        expect(sortSelect).toHaveValue('newest');
      });
    });

    it('provides all sort options', async () => {
      const { getCommentsByJournalId } = await import('@/services/commentService');
      vi.mocked(getCommentsByJournalId).mockResolvedValue([]);

      render(<CommentList journalId={journalId} />);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: '最新' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '最早' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '评分' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '最有用' })).toBeInTheDocument();
      });
    });

    it('reloads comments when sort option changes', async () => {
      const { getCommentsByJournalId } = await import('@/services/commentService');
      vi.mocked(getCommentsByJournalId).mockResolvedValue([]);

      render(<CommentList journalId={journalId} />);

      await waitFor(() => {
        expect(getCommentsByJournalId).toHaveBeenCalledWith(journalId, 'newest');
      });

      // Change sort to oldest
      const sortSelect = screen.getByRole('combobox');
      await userEvent.selectOptions(sortSelect, 'oldest');

      await waitFor(() => {
        expect(getCommentsByJournalId).toHaveBeenCalledWith(journalId, 'oldest');
      });
    });

    it('reloads comments when sort changes to rating', async () => {
      const { getCommentsByJournalId } = await import('@/services/commentService');
      vi.mocked(getCommentsByJournalId).mockResolvedValue([]);

      render(<CommentList journalId={journalId} />);

      await waitFor(() => {
        expect(getCommentsByJournalId).toHaveBeenCalled();
      });

      const sortSelect = screen.getByRole('combobox');
      await userEvent.selectOptions(sortSelect, 'rating');

      await waitFor(() => {
        expect(getCommentsByJournalId).toHaveBeenCalledWith(journalId, 'rating');
      });
    });

    it('reloads comments when sort changes to helpful', async () => {
      const { getCommentsByJournalId } = await import('@/services/commentService');
      vi.mocked(getCommentsByJournalId).mockResolvedValue([]);

      render(<CommentList journalId={journalId} />);

      await waitFor(() => {
        expect(getCommentsByJournalId).toHaveBeenCalled();
      });

      const sortSelect = screen.getByRole('combobox');
      await userEvent.selectOptions(sortSelect, 'helpful');

      await waitFor(() => {
        expect(getCommentsByJournalId).toHaveBeenCalledWith(journalId, 'helpful');
      });
    });
  });

  describe('Comment Refresh', () => {
    it('reloads comments when a new comment is added', async () => {
      const { getCommentsByJournalId } = await import('@/services/commentService');
      vi.mocked(getCommentsByJournalId).mockResolvedValue([]);

      render(<CommentList journalId={journalId} />);

      await waitFor(() => {
        expect(getCommentsByJournalId).toHaveBeenCalledTimes(1);
      });

      // Simulate adding a new comment
      await userEvent.click(screen.getByTestId('mock-submit-comment'));

      await waitFor(() => {
        expect(getCommentsByJournalId).toHaveBeenCalledTimes(2);
      });
    });

    it('reloads comments when a comment is updated', async () => {
      const { getCommentsByJournalId } = await import('@/services/commentService');
      vi.mocked(getCommentsByJournalId).mockResolvedValue(mockComments);

      render(<CommentList journalId={journalId} />);

      await waitFor(() => {
        expect(getCommentsByJournalId).toHaveBeenCalledTimes(1);
      });

      // Simulate updating a comment
      await userEvent.click(screen.getByTestId('update-comment-1'));

      await waitFor(() => {
        expect(getCommentsByJournalId).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Journal ID Changes', () => {
    it('reloads comments when journalId prop changes', async () => {
      const { getCommentsByJournalId } = await import('@/services/commentService');
      vi.mocked(getCommentsByJournalId).mockResolvedValue([]);

      const { rerender } = render(<CommentList journalId="journal-1" />);

      await waitFor(() => {
        expect(getCommentsByJournalId).toHaveBeenCalledWith('journal-1', 'newest');
      });

      rerender(<CommentList journalId="journal-2" />);

      await waitFor(() => {
        expect(getCommentsByJournalId).toHaveBeenCalledWith('journal-2', 'newest');
      });
    });
  });
});
