import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostForm from '@/features/posts/components/PostForm';

// Mock markdown packages
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown-preview">{children}</div>
}));

vi.mock('remark-gfm', () => ({ default: () => {} }));
vi.mock('rehype-highlight', () => ({ default: () => {} }));

const DRAFT_KEY = 'post_draft';

describe('PostForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should render form with all fields', () => {
    render(<PostForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Title field (uses htmlFor="title")
    expect(screen.getByLabelText(/标题/)).toBeInTheDocument();
    // Category field (uses htmlFor="category")
    expect(screen.getByLabelText(/分类/)).toBeInTheDocument();
    // Tags field (uses htmlFor="tags")
    expect(screen.getByLabelText(/标签/)).toBeInTheDocument();
    // The textarea doesn't have htmlFor, find by placeholder
    expect(screen.getByPlaceholderText(/在这里编写帖子内容/)).toBeInTheDocument();
    // Submit and cancel buttons
    expect(screen.getByText('发布')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
  });

  it('should render all category options', () => {
    render(<PostForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByText('投稿经验')).toBeInTheDocument();
    expect(screen.getByText('学术讨论')).toBeInTheDocument();
    expect(screen.getByText('求助问答')).toBeInTheDocument();
    expect(screen.getByText('资讯分享')).toBeInTheDocument();
    expect(screen.getByText('文献评述')).toBeInTheDocument();
    expect(screen.getByText('其他')).toBeInTheDocument();
  });

  it('should show markdown toolbar buttons', () => {
    render(<PostForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByTitle('粗体')).toBeInTheDocument();
    expect(screen.getByTitle('斜体')).toBeInTheDocument();
    expect(screen.getByTitle('标题')).toBeInTheDocument();
    expect(screen.getByTitle('链接')).toBeInTheDocument();
    expect(screen.getByTitle('引用')).toBeInTheDocument();
    expect(screen.getByTitle('代码')).toBeInTheDocument();
    expect(screen.getByTitle('无序列表')).toBeInTheDocument();
    expect(screen.getByTitle('图片')).toBeInTheDocument();
  });

  it('should have three view mode tabs', () => {
    render(<PostForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // View mode buttons are inside .post-form-view-toggle
    expect(screen.getByText('编辑')).toBeInTheDocument();
    // "预览" appears both as a tab and as a label, use getAllByText
    expect(screen.getAllByText('预览').length).toBeGreaterThanOrEqual(1);
    // Component uses "分栏" not "分屏"
    expect(screen.getByText('分栏')).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();

    render(<PostForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Fill in title
    await user.type(screen.getByLabelText(/标题/), 'Test Post Title');
    // Fill in content (textarea, found by placeholder)
    const textarea = screen.getByPlaceholderText(/在这里编写帖子内容/);
    await user.type(textarea, 'Test content');
    // Category defaults to 'other'

    // Submit
    const submitButton = screen.getByText('发布');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Post Title',
          content: 'Test content',
          status: 'published',
        })
      );
    });
  });

  it('should validate required fields', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();

    render(<PostForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Try to submit without filling fields
    const submitButton = screen.getByText('发布');
    await user.click(submitButton);

    // Should not call onSubmit
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Should show validation error messages
    await waitFor(() => {
      expect(screen.getByText('标题不能为空')).toBeInTheDocument();
      expect(screen.getByText('内容不能为空')).toBeInTheDocument();
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();

    render(<PostForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByText('取消');
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should populate form with initial data', () => {
    const initialData = {
      title: 'Initial Title',
      content: 'Initial content',
      category: 'question' as const,
      tags: ['initial', 'tags']
    };

    render(
      <PostForm
        mode="edit"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        initialData={initialData}
      />
    );

    expect((screen.getByLabelText(/标题/) as HTMLInputElement).value).toBe('Initial Title');
    expect((screen.getByPlaceholderText(/在这里编写帖子内容/) as HTMLTextAreaElement).value).toBe('Initial content');
    expect((screen.getByLabelText(/分类/) as HTMLSelectElement).value).toBe('question');
    // Tags are rendered as tag chips, not in the input
    expect(screen.getByText('initial')).toBeInTheDocument();
    expect(screen.getByText('tags')).toBeInTheDocument();
  });

  it('should autosave draft to localStorage', async () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem');

    render(<PostForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const titleInput = screen.getByLabelText(/标题/);

    // Simulate user typing
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Draft Title' } });
    });

    const textarea = screen.getByPlaceholderText(/在这里编写帖子内容/);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Draft content' } });
    });

    // Advance 30s to trigger autosave
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    expect(setItemSpy).toHaveBeenCalledWith(
      DRAFT_KEY,
      expect.stringContaining('Draft Title')
    );

    setItemSpy.mockRestore();
  });

  it('should show draft restore modal when draft exists', () => {
    const draftData = {
      title: 'Saved Draft',
      content: 'Saved content',
      category: 'discussion',
      tags: ['saved']
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));

    render(<PostForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Component shows "检测到未保存的草稿"
    expect(screen.getByText('检测到未保存的草稿')).toBeInTheDocument();
    expect(screen.getByText('恢复草稿')).toBeInTheDocument();
    // Component shows "放弃" not "放弃草稿"
    expect(screen.getByText('放弃')).toBeInTheDocument();
  });

  it('should restore draft when user clicks restore button', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();

    const draftData = {
      title: 'Saved Draft',
      content: 'Saved content',
      category: 'discussion',
      tags: ['saved']
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));

    render(<PostForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const restoreButton = screen.getByText('恢复草稿');
    await user.click(restoreButton);

    await waitFor(() => {
      expect((screen.getByLabelText(/标题/) as HTMLInputElement).value).toBe('Saved Draft');
      expect((screen.getByPlaceholderText(/在这里编写帖子内容/) as HTMLTextAreaElement).value).toBe('Saved content');
    });
  });

  it('should discard draft when user clicks discard button', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();

    const draftData = {
      title: 'Saved Draft',
      content: 'Saved content',
      category: 'discussion',
      tags: []
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));

    render(<PostForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Component button text is "放弃"
    const discardButton = screen.getByText('放弃');
    await user.click(discardButton);

    await waitFor(() => {
      expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
      expect(screen.queryByText('检测到未保存的草稿')).not.toBeInTheDocument();
    });
  });

  it('should insert markdown on toolbar button click', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();

    render(<PostForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const contentTextarea = screen.getByPlaceholderText(/在这里编写帖子内容/) as HTMLTextAreaElement;
    await user.click(contentTextarea);

    // Click bold button
    const boldButton = screen.getByTitle('粗体');
    await user.click(boldButton);

    expect(contentTextarea.value).toContain('**');
  });

  it('should switch between view modes', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();

    render(<PostForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const textarea = screen.getByPlaceholderText(/在这里编写帖子内容/);
    await user.type(textarea, '# Test Markdown');

    // Switch to preview mode — "预览" appears as both tab button and label, use the view toggle button
    const previewButtons = screen.getAllByText('预览');
    // Click the one inside the view toggle (the button element)
    const previewTab = previewButtons.find(el => el.closest('.post-form-view-button')) || previewButtons[0];
    await user.click(previewTab);

    // In preview mode, the markdown-preview should render the content
    await waitFor(() => {
      expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
    });

    // Switch to 分栏 mode
    const splitTab = screen.getByText('分栏');
    await user.click(splitTab);

    // Both editor and preview should be visible
    expect(screen.getByPlaceholderText(/在这里编写帖子内容/)).toBeInTheDocument();
    expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
  });

  it('should parse tags correctly', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();

    render(<PostForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/标题/), 'Test');
    const textarea = screen.getByPlaceholderText(/在这里编写帖子内容/);
    await user.type(textarea, 'Content');

    // Tags are added by typing and pressing Enter
    const tagInput = screen.getByLabelText(/标签/);
    await user.type(tagInput, 'tag1{enter}');
    await user.type(tagInput, 'tag2{enter}');

    // Submit
    const submitButton = screen.getByText('发布');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.arrayContaining(['tag1', 'tag2'])
        })
      );
    });
  });

  it('should handle empty tags gracefully', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();

    render(<PostForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/标题/), 'Test');
    const textarea = screen.getByPlaceholderText(/在这里编写帖子内容/);
    await user.type(textarea, 'Content');

    // Leave tags empty
    const submitButton = screen.getByText('发布');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: []
        })
      );
    });
  });

  it('should support optional journalId field', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();

    render(<PostForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/标题/), 'Test');
    const textarea = screen.getByPlaceholderText(/在这里编写帖子内容/);
    await user.type(textarea, 'Content');

    const submitButton = screen.getByText('发布');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
      // journalId should be undefined since we didn't set it
      const callArg = mockOnSubmit.mock.calls[0][0];
      expect(callArg.journalId).toBeUndefined();
    });
  });

  it('should clear draft after successful submission', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();

    // Save a draft first
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      title: 'Draft',
      content: 'Content',
      category: 'discussion',
      tags: []
    }));

    render(<PostForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Discard draft modal (button text is "放弃")
    const discardButton = screen.getByText('放弃');
    await user.click(discardButton);

    await user.type(screen.getByLabelText(/标题/), 'New Post');
    const textarea = screen.getByPlaceholderText(/在这里编写帖子内容/);
    await user.type(textarea, 'New content');

    const submitButton = screen.getByText('发布');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
      // Draft should be cleared after submit
      expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
    });
  });

  it('should not disable submit button (no isSubmitting state in component)', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();

    render(<PostForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/标题/), 'Test');
    const textarea = screen.getByPlaceholderText(/在这里编写帖子内容/);
    await user.type(textarea, 'Content');

    // The PostForm component doesn't have isSubmitting state, so buttons are never disabled
    const publishButton = screen.getByText('发布');
    expect(publishButton).not.toBeDisabled();
  });

  it('auto-saves draft after 30s even with continuous state changes', async () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem');

    render(<PostForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />);

    const titleInput = screen.getByLabelText(/标题/i);

    await act(async () => {
      fireEvent.change(titleInput, { target: { value: '测试' } });
      vi.advanceTimersByTime(5000);
    });
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: '测试标题' } });
      vi.advanceTimersByTime(5000);
    });
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: '测试标题完整' } });
    });

    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    expect(setItemSpy).toHaveBeenCalledWith(
      'post_draft',
      expect.stringContaining('测试标题完整')
    );

    setItemSpy.mockRestore();
  });
});
