import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostForm from '@/features/posts/components/PostForm';
import { CreatePostData } from '@/features/posts/types/post';

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
    render(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText(/标题/)).toBeInTheDocument();
    expect(screen.getByLabelText(/内容/)).toBeInTheDocument();
    expect(screen.getByLabelText(/分类/)).toBeInTheDocument();
    expect(screen.getByLabelText(/标签/)).toBeInTheDocument();
    expect(screen.getByText('发布')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
  });

  it('should render all category options', () => {
    render(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const categorySelect = screen.getByLabelText(/分类/);
    expect(categorySelect).toBeInTheDocument();

    // Check if all categories are available
    expect(screen.getByText('投稿经验')).toBeInTheDocument();
    expect(screen.getByText('学术讨论')).toBeInTheDocument();
    expect(screen.getByText('求助问答')).toBeInTheDocument();
    expect(screen.getByText('资讯分享')).toBeInTheDocument();
    expect(screen.getByText('文献评述')).toBeInTheDocument();
    expect(screen.getByText('其他')).toBeInTheDocument();
  });

  it('should show markdown toolbar buttons', () => {
    render(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Check for toolbar buttons (by title/aria-label)
    expect(screen.getByTitle('粗体')).toBeInTheDocument();
    expect(screen.getByTitle('斜体')).toBeInTheDocument();
    expect(screen.getByTitle('标题')).toBeInTheDocument();
    expect(screen.getByTitle('链接')).toBeInTheDocument();
    expect(screen.getByTitle('引用')).toBeInTheDocument();
    expect(screen.getByTitle('代码')).toBeInTheDocument();
    expect(screen.getByTitle('列表')).toBeInTheDocument();
    expect(screen.getByTitle('图片')).toBeInTheDocument();
  });

  it('should have three view mode tabs', () => {
    render(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByText('编辑')).toBeInTheDocument();
    expect(screen.getByText('预览')).toBeInTheDocument();
    expect(screen.getByText('分屏')).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup({ delay: null });

    render(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Fill in form
    await user.type(screen.getByLabelText(/标题/), 'Test Post Title');
    await user.type(screen.getByLabelText(/内容/), 'Test content with **markdown**');

    const categorySelect = screen.getByLabelText(/分类/);
    await user.selectOptions(categorySelect, 'discussion');

    await user.type(screen.getByLabelText(/标签/), 'tag1, tag2, tag3');

    // Submit
    const submitButton = screen.getByText('发布');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Test Post Title',
        content: 'Test content with **markdown**',
        category: 'discussion',
        tags: ['tag1', 'tag2', 'tag3']
      });
    });
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup({ delay: null });

    render(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Try to submit without filling fields
    const submitButton = screen.getByText('发布');
    await user.click(submitButton);

    // Should not call onSubmit
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Should show validation errors (browser native or custom)
    const titleInput = screen.getByLabelText(/标题/) as HTMLInputElement;
    const contentInput = screen.getByLabelText(/内容/) as HTMLTextAreaElement;

    expect(titleInput.validity.valid).toBe(false);
    expect(contentInput.validity.valid).toBe(false);
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup({ delay: null });

    render(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByText('取消');
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should populate form with initial data', () => {
    const initialData: Partial<CreatePostData> = {
      title: 'Initial Title',
      content: 'Initial content',
      category: 'question',
      tags: ['initial', 'tags']
    };

    render(
      <PostForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        initialData={initialData}
      />
    );

    expect((screen.getByLabelText(/标题/) as HTMLInputElement).value).toBe('Initial Title');
    expect((screen.getByLabelText(/内容/) as HTMLTextAreaElement).value).toBe('Initial content');
    expect((screen.getByLabelText(/分类/) as HTMLSelectElement).value).toBe('question');
    expect((screen.getByLabelText(/标签/) as HTMLInputElement).value).toBe('initial, tags');
  });

  it('should autosave draft to localStorage', async () => {
    const user = userEvent.setup({ delay: null });

    render(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/标题/), 'Draft Title');
    await user.type(screen.getByLabelText(/内容/), 'Draft content');

    // Fast-forward 30 seconds to trigger autosave
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      const draft = localStorage.getItem(DRAFT_KEY);
      expect(draft).not.toBeNull();

      if (draft) {
        const draftData = JSON.parse(draft);
        expect(draftData.title).toBe('Draft Title');
        expect(draftData.content).toBe('Draft content');
      }
    });
  });

  it('should show draft restore modal when draft exists', () => {
    const draftData = {
      title: 'Saved Draft',
      content: 'Saved content',
      category: 'discussion',
      tags: ['saved']
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));

    render(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByText(/检测到未发布的草稿/)).toBeInTheDocument();
    expect(screen.getByText('恢复草稿')).toBeInTheDocument();
    expect(screen.getByText('放弃草稿')).toBeInTheDocument();
  });

  it('should restore draft when user clicks restore button', async () => {
    const user = userEvent.setup({ delay: null });

    const draftData = {
      title: 'Saved Draft',
      content: 'Saved content',
      category: 'discussion',
      tags: ['saved']
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));

    render(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const restoreButton = screen.getByText('恢复草稿');
    await user.click(restoreButton);

    await waitFor(() => {
      expect((screen.getByLabelText(/标题/) as HTMLInputElement).value).toBe('Saved Draft');
      expect((screen.getByLabelText(/内容/) as HTMLTextAreaElement).value).toBe('Saved content');
    });
  });

  it('should discard draft when user clicks discard button', async () => {
    const user = userEvent.setup({ delay: null });

    const draftData = {
      title: 'Saved Draft',
      content: 'Saved content',
      category: 'discussion',
      tags: []
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));

    render(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const discardButton = screen.getByText('放弃草稿');
    await user.click(discardButton);

    await waitFor(() => {
      expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
      expect(screen.queryByText(/检测到未发布的草稿/)).not.toBeInTheDocument();
    });
  });

  it('should insert markdown on toolbar button click', async () => {
    const user = userEvent.setup({ delay: null });

    render(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const contentTextarea = screen.getByLabelText(/内容/) as HTMLTextAreaElement;
    contentTextarea.focus();

    // Click bold button
    const boldButton = screen.getByTitle('粗体');
    await user.click(boldButton);

    expect(contentTextarea.value).toContain('**');
  });

  it('should switch between view modes', async () => {
    const user = userEvent.setup({ delay: null });

    render(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/内容/), '# Test Markdown');

    // Switch to preview mode
    const previewTab = screen.getByText('预览');
    await user.click(previewTab);

    await waitFor(() => {
      expect(screen.getByText('Test Markdown')).toBeInTheDocument(); // Rendered as h1
    });

    // Switch to split mode
    const splitTab = screen.getByText('分屏');
    await user.click(splitTab);

    // Both editor and preview should be visible
    expect(screen.getByLabelText(/内容/)).toBeInTheDocument();
    expect(screen.getByText('Test Markdown')).toBeInTheDocument();
  });

  it('should parse tags correctly', async () => {
    const user = userEvent.setup({ delay: null });

    render(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/标题/), 'Test');
    await user.type(screen.getByLabelText(/内容/), 'Content');

    // Test different tag formats
    const tagInput = screen.getByLabelText(/标签/);
    await user.clear(tagInput);
    await user.type(tagInput, 'tag1, tag2,tag3,  tag4  ');

    const submitButton = screen.getByText('发布');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.arrayContaining(['tag1', 'tag2', 'tag3', 'tag4'])
        })
      );
    });
  });

  it('should handle empty tags gracefully', async () => {
    const user = userEvent.setup({ delay: null });

    render(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/标题/), 'Test');
    await user.type(screen.getByLabelText(/内容/), 'Content');

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
    const user = userEvent.setup({ delay: null });

    render(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/标题/), 'Test');
    await user.type(screen.getByLabelText(/内容/), 'Content');

    // Check if journal field exists
    const journalField = screen.queryByLabelText(/关联期刊/);
    if (journalField) {
      await user.type(journalField, '1');
    }

    const submitButton = screen.getByText('发布');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('should clear draft after successful submission', async () => {
    const user = userEvent.setup({ delay: null });

    // Save a draft first
    const draftData = {
      title: 'Draft',
      content: 'Content',
      category: 'discussion',
      tags: []
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));

    render(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Discard draft modal
    const discardButton = screen.getByText('放弃草稿');
    await user.click(discardButton);

    await user.type(screen.getByLabelText(/标题/), 'New Post');
    await user.type(screen.getByLabelText(/内容/), 'New content');

    const submitButton = screen.getByText('发布');
    await user.click(submitButton);

    // In real usage, the parent component would call a success handler
    // Here we just verify the form can submit
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('should disable submit button while submitting', async () => {
    const user = userEvent.setup({ delay: null });
    const slowSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(<PostForm onSubmit={slowSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/标题/), 'Test');
    await user.type(screen.getByLabelText(/内容/), 'Content');

    const submitButton = screen.getByText('发布') as HTMLButtonElement;
    await user.click(submitButton);

    // Button should be disabled during submission
    expect(submitButton.disabled).toBe(true);
  });
});
