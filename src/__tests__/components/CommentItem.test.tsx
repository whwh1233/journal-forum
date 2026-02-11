import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../helpers/testUtils';
import CommentItem from '../../features/comments/components/CommentItem';
import { mockComment, mockUser } from '../helpers/testUtils';

describe('CommentItem', () => {
  const mockOnReply = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render comment content', () => {
    render(
      <CommentItem
        comment={mockComment}
        currentUserId={1}
        onReply={mockOnReply}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(mockComment.content)).toBeInTheDocument();
    expect(screen.getByText(mockComment.userName)).toBeInTheDocument();
  });

  it('should display rating if provided', () => {
    render(
      <CommentItem
        comment={mockComment}
        currentUserId={1}
        onReply={mockOnReply}
        onDelete={mockOnDelete}
      />
    );

    // 应该显示评分
    const ratingElement = screen.getByText(/5/);
    expect(ratingElement).toBeInTheDocument();
  });

  it('should not display rating for reply comments', () => {
    const replyComment = {
      ...mockComment,
      parentId: 'some-parent-id',
      rating: undefined,
    };

    render(
      <CommentItem
        comment={replyComment}
        currentUserId={1}
        onReply={mockOnReply}
        onDelete={mockOnDelete}
      />
    );

    // 回复评论不应该有评分
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });

  it('should show delete button for own comments', () => {
    render(
      <CommentItem
        comment={mockComment}
        currentUserId={mockComment.userId}
        onReply={mockOnReply}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByText(/删除/);
    expect(deleteButton).toBeInTheDocument();
  });

  it('should not show delete button for other users comments', () => {
    render(
      <CommentItem
        comment={mockComment}
        currentUserId={999} // 不同的用户ID
        onReply={mockOnReply}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText(/删除/)).not.toBeInTheDocument();
  });

  it('should call onReply when reply button is clicked', () => {
    render(
      <CommentItem
        comment={mockComment}
        currentUserId={1}
        onReply={mockOnReply}
        onDelete={mockOnDelete}
      />
    );

    const replyButton = screen.getByText(/回复/);
    fireEvent.click(replyButton);

    expect(mockOnReply).toHaveBeenCalledWith(mockComment.id);
  });

  it('should call onDelete when delete button is clicked', () => {
    render(
      <CommentItem
        comment={mockComment}
        currentUserId={mockComment.userId}
        onReply={mockOnReply}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByText(/删除/);
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockComment.id);
  });

  it('should render nested replies', () => {
    const commentWithReplies = {
      ...mockComment,
      replies: [
        {
          id: 'reply-1',
          userId: 2,
          userName: 'Reply User',
          journalId: 1,
          parentId: mockComment.id,
          content: 'This is a reply',
          createdAt: new Date().toISOString(),
          isDeleted: false,
        },
      ],
    };

    render(
      <CommentItem
        comment={commentWithReplies}
        currentUserId={1}
        onReply={mockOnReply}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('This is a reply')).toBeInTheDocument();
  });

  it('should format date correctly', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');
    const commentWithDate = {
      ...mockComment,
      createdAt: testDate.toISOString(),
    };

    render(
      <CommentItem
        comment={commentWithDate}
        currentUserId={1}
        onReply={mockOnReply}
        onDelete={mockOnDelete}
      />
    );

    // 验证日期被渲染（具体格式可能因本地化而异）
    const dateElement = screen.getByText(/2024/);
    expect(dateElement).toBeInTheDocument();
  });

  it('should handle deleted comments gracefully', () => {
    const deletedComment = {
      ...mockComment,
      isDeleted: true,
    };

    // 删除的评论不应该被渲染
    const { container } = render(
      <CommentItem
        comment={deletedComment}
        currentUserId={1}
        onReply={mockOnReply}
        onDelete={mockOnDelete}
      />
    );

    // 可能显示"该评论已被删除"或者完全不渲染
    expect(container.textContent).toMatch(/已删除|^$/);
  });
});
