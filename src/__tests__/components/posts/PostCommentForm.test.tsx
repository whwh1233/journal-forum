import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { postService } from '@/features/posts/services/postService';
import { useAuth } from '@/hooks/useAuth';
import PostCommentForm from '@/features/posts/components/PostCommentForm';

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

// Mock the postService
vi.mock('@/features/posts/services/postService', () => ({
  postService: {
    createComment: vi.fn()
  }
}));

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown-preview">{children}</div>,
}));
vi.mock('remark-gfm', () => ({ default: () => {} }));
vi.mock('rehype-highlight', () => ({ default: () => {} }));
vi.mock('rehype-sanitize', () => ({ default: () => {} }));
vi.mock('@/services/uploadService', () => ({
  uploadImage: vi.fn(),
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
    vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
  });

  describe('When user is not logged in', () => {
    it('should show login prompt for comment', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null } as any);

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      expect(screen.getByText(/请先登录后发表/)).toBeInTheDocument();
    });

    it('should show login prompt for reply', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null } as any);

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

      expect(screen.getByText(/请先登录后发表/)).toBeInTheDocument();
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

      const textarea = screen.getByPlaceholderText('写下你的评论...');
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

      const textarea = screen.getByPlaceholderText('写下你的回复...');
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

      const submitButton = screen.getByText('发表评论');
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

      const submitButton = screen.getByText('回复');
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

      const cancelButton = screen.getByText('取消');
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

      expect(screen.queryByText('取消')).not.toBeInTheDocument();
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

      const cancelButton = screen.getByText('取消');
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

      const textarea = screen.getByPlaceholderText('写下你的评论...');
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

      const form = document.querySelector('.post-comment-form') as HTMLFormElement;
      fireEvent.submit(form!);

      expect(mockAlert).toHaveBeenCalledWith('请输入评论内容');
      mockAlert.mockRestore();
    });

    it('should submit comment successfully', async () => {
      vi.mocked(postService).createComment.mockResolvedValue({ id: 1, content: 'Test comment' });

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText('写下你的评论...');
      fireEvent.change(textarea, { target: { value: 'Test comment content' } });

      const form = document.querySelector('.post-comment-form') as HTMLFormElement;
      fireEvent.submit(form!);

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
      vi.mocked(postService).createComment.mockResolvedValue({ id: 2, content: 'Test reply' });

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

      const textarea = screen.getByPlaceholderText('写下你的回复...');
      fireEvent.change(textarea, { target: { value: 'Test reply content' } });

      const form = document.querySelector('.post-comment-form') as HTMLFormElement;
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(postService.createComment).toHaveBeenCalledWith(1, {
          content: 'Test reply content',
          parentId: 10
        });
      });
    });

    it('should clear textarea after successful submission', async () => {
      vi.mocked(postService).createComment.mockResolvedValue({ id: 1, content: 'Test comment' });

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText('写下你的评论...');
      fireEvent.change(textarea, { target: { value: 'Test comment content' } });

      const form = document.querySelector('.post-comment-form') as HTMLFormElement;
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });

    it('should call onCancel after successful reply submission', async () => {
      vi.mocked(postService).createComment.mockResolvedValue({ id: 1, content: 'Test reply' });

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

      const textarea = screen.getByPlaceholderText('写下你的回复...');
      fireEvent.change(textarea, { target: { value: 'Test reply content' } });

      const form = document.querySelector('.post-comment-form') as HTMLFormElement;
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockOnCancel).toHaveBeenCalled();
      });
    });

    it('should show submitting state during submission', async () => {
      vi.mocked(postService).createComment.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText('写下你的评论...');
      fireEvent.change(textarea, { target: { value: 'Test comment content' } });

      const form = document.querySelector('.post-comment-form') as HTMLFormElement;
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('发布中...')).toBeInTheDocument();
      });
    });

    it('should disable textarea and buttons during submission', async () => {
      vi.mocked(postService).createComment.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
            onCancel={mockOnCancel}
          />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText('写下你的评论...');
      fireEvent.change(textarea, { target: { value: 'Test comment content' } });

      const form = document.querySelector('.post-comment-form') as HTMLFormElement;
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(textarea).toBeDisabled();
        expect(screen.getByText('取消')).toBeDisabled();
      });
    });

    it('should show error alert when submission fails', async () => {
      vi.mocked(postService).createComment.mockRejectedValue(new Error('Network error'));

      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText('写下你的评论...');
      fireEvent.change(textarea, { target: { value: 'Test comment content' } });

      const form = document.querySelector('.post-comment-form') as HTMLFormElement;
      fireEvent.submit(form!);

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

      let textarea = screen.getByPlaceholderText('写下你的评论...');
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

      textarea = screen.getByPlaceholderText('写下你的回复...');
      expect(textarea).toHaveAttribute('rows', '3');
    });

    it('should trim whitespace from content before submission', async () => {
      vi.mocked(postService).createComment.mockResolvedValue({ id: 1, content: 'Test comment' });

      render(
        <BrowserRouter>
          <PostCommentForm
            postId={1}
            onCommentAdded={mockOnCommentAdded}
          />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText('写下你的评论...');
      fireEvent.change(textarea, { target: { value: '  Test comment content  ' } });

      const form = document.querySelector('.post-comment-form') as HTMLFormElement;
      fireEvent.submit(form!);

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

      const textarea = screen.getByPlaceholderText('写下你的评论...');
      fireEvent.change(textarea, { target: { value: '   ' } });

      const form = document.querySelector('.post-comment-form') as HTMLFormElement;
      fireEvent.submit(form!);

      expect(mockAlert).toHaveBeenCalledWith('请输入评论内容');
      mockAlert.mockRestore();
    });

    it('renders compact markdown toolbar (bold, italic, image only)', () => {
      render(
        <BrowserRouter>
          <PostCommentForm postId={1} onCommentAdded={mockOnCommentAdded} />
        </BrowserRouter>
      );
      expect(screen.getByTitle('粗体')).toBeInTheDocument();
      expect(screen.getByTitle('斜体')).toBeInTheDocument();
      expect(screen.getByTitle('上传图片')).toBeInTheDocument();
      expect(screen.queryByTitle('标题')).not.toBeInTheDocument();
      expect(screen.queryByTitle('代码')).not.toBeInTheDocument();
      expect(screen.queryByTitle('引用')).not.toBeInTheDocument();
      expect(screen.queryByTitle('链接')).not.toBeInTheDocument();
    });

    it('does not render view toggle in compact mode', () => {
      render(
        <BrowserRouter>
          <PostCommentForm postId={1} onCommentAdded={mockOnCommentAdded} />
        </BrowserRouter>
      );
      expect(screen.queryByTitle('编辑')).not.toBeInTheDocument();
      expect(screen.queryByTitle('分屏')).not.toBeInTheDocument();
      expect(screen.queryByTitle('预览')).not.toBeInTheDocument();
    });
  });
});
