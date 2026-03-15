import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CommentItem from '../../features/comments/components/CommentItem';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'test@example.com', name: 'Test User', role: 'user' },
  }),
}));

vi.mock('../../features/comments/components/CommentForm', () => ({
  default: () => <div data-testid="comment-form">CommentForm</div>,
}));

vi.mock('../../features/comments/components/DimensionRatingDisplay', () => ({
  default: () => <div data-testid="dimension-rating">DimensionRating</div>,
}));

vi.mock('../../features/follow/components/FollowButton', () => ({
  default: () => <button>Follow</button>,
}));

vi.mock('../../features/badges', () => ({
  BadgeList: () => <span data-testid="badge-list" />,
}));

vi.mock('../../../services/commentService', () => ({
  likeComment: vi.fn().mockResolvedValue({ liked: true, likeCount: 1 }),
  updateComment: vi.fn().mockResolvedValue({}),
  deleteComment: vi.fn().mockResolvedValue({}),
}));

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="md-render">{children}</div>,
}));
vi.mock('remark-gfm', () => ({ default: () => {} }));
vi.mock('rehype-highlight', () => ({ default: () => {} }));
vi.mock('rehype-sanitize', () => ({ default: () => {} }));
vi.mock('@/services/uploadService', () => ({
  uploadImage: vi.fn(),
}));

const baseComment = {
  id: '1-123-abc',
  userId: 1,
  userName: 'Test User',
  journalId: 'j1',
  parentId: null,
  content: 'This is a test comment',
  rating: 4,
  createdAt: new Date().toISOString(),
  isDeleted: false,
};

const mockOnCommentUpdated = vi.fn();

const renderComponent = (comment = baseComment, level = 0) => {
  return render(
    <BrowserRouter>
      <CommentItem comment={comment as any} level={level} onCommentUpdated={mockOnCommentUpdated} />
    </BrowserRouter>
  );
};

describe('CommentItem', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders comment content and author', () => {
    renderComponent();
    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('displays rating stars when provided', () => {
    renderComponent();
    const ratingEl = screen.getByText(/★/);
    expect(ratingEl).toBeInTheDocument();
  });

  it('does not display rating for reply without rating', () => {
    const reply = { ...baseComment, parentId: 'p1', rating: undefined };
    renderComponent(reply);
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });

  it('shows edit and delete buttons for own comments', () => {
    renderComponent();
    expect(screen.getByText('编辑')).toBeInTheDocument();
    expect(screen.getByText('删除')).toBeInTheDocument();
  });

  it('shows reply button at level 0', () => {
    renderComponent();
    expect(screen.getByText('回复')).toBeInTheDocument();
  });

  it('hides reply button at level 2', () => {
    renderComponent(baseComment, 2);
    expect(screen.queryByText('回复')).not.toBeInTheDocument();
  });

  it('toggles reply form when reply is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('回复'));
    expect(screen.getByTestId('comment-form')).toBeInTheDocument();
  });

  it('renders nested replies', () => {
    const withReplies = {
      ...baseComment,
      replies: [{
        id: 'reply-1', userId: 2, userName: 'Reply User', journalId: 'j1',
        parentId: baseComment.id, content: 'This is a reply',
        createdAt: new Date().toISOString(), isDeleted: false,
      }],
    };
    renderComponent(withReplies);
    expect(screen.getByText('This is a reply')).toBeInTheDocument();
  });

  it('hides actions for deleted comments', () => {
    const deleted = { ...baseComment, isDeleted: true };
    renderComponent(deleted);
    expect(screen.queryByText('回复')).not.toBeInTheDocument();
    expect(screen.queryByText('编辑')).not.toBeInTheDocument();
    expect(screen.queryByText('删除')).not.toBeInTheDocument();
  });

  it('shows edited indicator', () => {
    const edited = { ...baseComment, updatedAt: new Date().toISOString() };
    renderComponent(edited);
    expect(screen.getByText('(已编辑)')).toBeInTheDocument();
  });

  it('shows MarkdownEditor when edit button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('编辑'));
    // Edit mode should show a textarea with the comment content
    expect(screen.getByDisplayValue('This is a test comment')).toBeInTheDocument();
    expect(screen.getByText('保存')).toBeInTheDocument();
  });

  it('cancels edit and restores original content', () => {
    renderComponent();
    fireEvent.click(screen.getByText('编辑'));
    // Change the content
    const textarea = screen.getByDisplayValue('This is a test comment');
    fireEvent.change(textarea, { target: { value: 'Changed content' } });
    // Click cancel in the edit actions area
    const cancelButtons = screen.getAllByText('取消');
    const editCancelBtn = cancelButtons.find(
      (btn) => btn.closest('.comment-edit-actions')
    );
    fireEvent.click(editCancelBtn || cancelButtons[0]);
    // Should go back to display mode
    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    expect(screen.queryByText('保存')).not.toBeInTheDocument();
  });

  it('renders MarkdownContent for non-deleted comment display', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.markdown-content')).toBeInTheDocument();
  });
});