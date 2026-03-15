import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarkdownEditor from '../../components/MarkdownEditor/MarkdownEditor';

// Mock CSS import
vi.mock('../../components/MarkdownEditor/MarkdownEditor.css', () => ({}));

// Mock react-markdown and plugins
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => (
    <div data-testid="markdown-preview">{children}</div>
  ),
}));
vi.mock('remark-gfm', () => ({ default: () => {} }));
vi.mock('rehype-highlight', () => ({ default: () => {} }));
vi.mock('rehype-sanitize', () => ({ default: () => {} }));

// Mock uploadService
const mockUploadImage = vi.fn();
vi.mock('../../services/uploadService', () => ({
  uploadImage: (...args: any[]) => mockUploadImage(...args),
}));

const defaultProps = {
  value: '',
  onChange: vi.fn(),
};

const renderEditor = (props: Partial<React.ComponentProps<typeof MarkdownEditor>> = {}) => {
  return render(<MarkdownEditor {...defaultProps} {...props} />);
};

describe('MarkdownEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  describe('Rendering', () => {
    it('renders textarea with default placeholder', () => {
      renderEditor();
      expect(screen.getByPlaceholderText('输入内容...')).toBeInTheDocument();
    });

    it('renders textarea with custom placeholder', () => {
      renderEditor({ placeholder: '写点什么...' });
      expect(screen.getByPlaceholderText('写点什么...')).toBeInTheDocument();
    });

    it('renders current value in textarea', () => {
      renderEditor({ value: 'Hello world' });
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Hello world');
    });

    it('full mode renders view toggle buttons (编辑/分屏/预览)', () => {
      renderEditor({ mode: 'full' });
      expect(screen.getByTitle('编辑')).toBeInTheDocument();
      expect(screen.getByTitle('分屏')).toBeInTheDocument();
      expect(screen.getByTitle('预览')).toBeInTheDocument();
    });

    it('compact mode does not render view toggle buttons', () => {
      renderEditor({ mode: 'compact' });
      expect(screen.queryByTitle('编辑')).not.toBeInTheDocument();
      expect(screen.queryByTitle('分屏')).not.toBeInTheDocument();
      expect(screen.queryByTitle('预览')).not.toBeInTheDocument();
    });

    it('full mode shows full toolbar (9 buttons including upload)', () => {
      renderEditor({ mode: 'full' });
      expect(screen.getByTitle('粗体')).toBeInTheDocument();
      expect(screen.getByTitle('斜体')).toBeInTheDocument();
      expect(screen.getByTitle('标题')).toBeInTheDocument();
      expect(screen.getByTitle('代码')).toBeInTheDocument();
      expect(screen.getByTitle('引用')).toBeInTheDocument();
      expect(screen.getByTitle('无序列表')).toBeInTheDocument();
      expect(screen.getByTitle('有序列表')).toBeInTheDocument();
      expect(screen.getByTitle('链接')).toBeInTheDocument();
      expect(screen.getByTitle('上传图片')).toBeInTheDocument();
    });

    it('compact mode shows only compact toolbar (bold, italic, upload)', () => {
      renderEditor({ mode: 'compact' });
      expect(screen.getByTitle('粗体')).toBeInTheDocument();
      expect(screen.getByTitle('斜体')).toBeInTheDocument();
      expect(screen.getByTitle('上传图片')).toBeInTheDocument();
      expect(screen.queryByTitle('标题')).not.toBeInTheDocument();
      expect(screen.queryByTitle('链接')).not.toBeInTheDocument();
    });

    it('full mode starts in split view (textarea and preview both visible)', () => {
      renderEditor({ mode: 'full', value: 'test content' });
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
    });

    it('compact mode starts in edit view (only textarea visible)', () => {
      renderEditor({ mode: 'compact', value: 'test content' });
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.queryByTestId('markdown-preview')).not.toBeInTheDocument();
    });

    it('renders preview placeholder text when value is empty in split mode', () => {
      renderEditor({ mode: 'full', value: '' });
      expect(screen.getByText('预览区域')).toBeInTheDocument();
    });

    it('renders markdown content in preview when value is non-empty', () => {
      renderEditor({ mode: 'full', value: '# Hello' });
      expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-preview').textContent).toBe('# Hello');
    });

    it('respects minRows prop on textarea', () => {
      renderEditor({ minRows: 8 });
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '8');
    });

    it('applies maxHeight style to textarea when provided', () => {
      renderEditor({ maxHeight: '300px' });
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.style.maxHeight).toBe('300px');
    });

    it('has a hidden file input that accepts image types', () => {
      renderEditor();
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      expect(fileInput.accept).toContain('image/jpeg');
      expect(fileInput.accept).toContain('image/png');
      expect(fileInput.style.display).toBe('none');
    });
  });

  // ---------------------------------------------------------------------------
  // Disabled state
  // ---------------------------------------------------------------------------
  describe('Disabled state', () => {
    it('disables textarea when disabled prop is true', () => {
      renderEditor({ disabled: true });
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('disables all toolbar buttons when disabled', () => {
      renderEditor({ disabled: true, mode: 'full' });
      const boldBtn = screen.getByTitle('粗体');
      expect(boldBtn).toBeDisabled();
    });

    it('toolbar buttons are enabled when not disabled', () => {
      renderEditor({ disabled: false });
      expect(screen.getByTitle('粗体')).not.toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // Text input
  // ---------------------------------------------------------------------------
  describe('Text input', () => {
    it('calls onChange when user types in textarea', () => {
      const onChange = vi.fn();
      renderEditor({ onChange });
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'new content' } });
      expect(onChange).toHaveBeenCalledWith('new content');
    });

    it('displays updated value when value prop changes', () => {
      const { rerender } = renderEditor({ value: 'initial' });
      expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('initial');
      rerender(<MarkdownEditor value="updated" onChange={vi.fn()} />);
      expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('updated');
    });
  });

  // ---------------------------------------------------------------------------
  // View mode switching (full mode only)
  // ---------------------------------------------------------------------------
  describe('View mode switching', () => {
    it('switches to edit-only mode when 编辑 button is clicked', async () => {
      const user = userEvent.setup();
      renderEditor({ mode: 'full', value: 'content' });

      // Start in split mode, switch to edit
      await user.click(screen.getByTitle('编辑'));

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.queryByTestId('markdown-preview')).not.toBeInTheDocument();
    });

    it('switches to preview-only mode when 预览 button is clicked', async () => {
      const user = userEvent.setup();
      renderEditor({ mode: 'full', value: 'content' });

      await user.click(screen.getByTitle('预览'));

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
    });

    it('switches to split mode when 分屏 button is clicked', async () => {
      const user = userEvent.setup();
      renderEditor({ mode: 'full', value: 'content' });

      // First go to edit mode, then back to split
      await user.click(screen.getByTitle('编辑'));
      expect(screen.queryByTestId('markdown-preview')).not.toBeInTheDocument();

      await user.click(screen.getByTitle('分屏'));
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
    });

    it('marks the active view mode button with "active" class', async () => {
      const user = userEvent.setup();
      renderEditor({ mode: 'full' });

      const editBtn = screen.getByTitle('编辑');
      const splitBtn = screen.getByTitle('分屏');

      // Default is split
      expect(splitBtn.className).toContain('active');
      expect(editBtn.className).not.toContain('active');

      await user.click(editBtn);
      expect(editBtn.className).toContain('active');
      expect(splitBtn.className).not.toContain('active');
    });
  });

  // ---------------------------------------------------------------------------
  // Toolbar markdown insertion
  // ---------------------------------------------------------------------------
  describe('Toolbar markdown insertion', () => {
    it('inserts bold markdown when 粗体 is clicked with no selection', () => {
      const onChange = vi.fn();
      renderEditor({ value: '', onChange });

      fireEvent.click(screen.getByTitle('粗体'));
      expect(onChange).toHaveBeenCalledWith('**粗体文字**');
    });

    it('inserts italic markdown when 斜体 is clicked', () => {
      const onChange = vi.fn();
      renderEditor({ value: '', onChange });

      fireEvent.click(screen.getByTitle('斜体'));
      expect(onChange).toHaveBeenCalledWith('*斜体文字*');
    });

    it('inserts heading markdown when 标题 is clicked', () => {
      const onChange = vi.fn();
      renderEditor({ value: '', onChange, mode: 'full' });

      fireEvent.click(screen.getByTitle('标题'));
      expect(onChange).toHaveBeenCalledWith('## 标题');
    });

    it('inserts code markdown when 代码 is clicked', () => {
      const onChange = vi.fn();
      renderEditor({ value: '', onChange, mode: 'full' });

      fireEvent.click(screen.getByTitle('代码'));
      expect(onChange).toHaveBeenCalledWith('`代码`');
    });

    it('inserts blockquote markdown when 引用 is clicked', () => {
      const onChange = vi.fn();
      renderEditor({ value: '', onChange, mode: 'full' });

      fireEvent.click(screen.getByTitle('引用'));
      expect(onChange).toHaveBeenCalledWith('> 引用内容');
    });

    it('inserts unordered list markdown when 无序列表 is clicked', () => {
      const onChange = vi.fn();
      renderEditor({ value: '', onChange, mode: 'full' });

      fireEvent.click(screen.getByTitle('无序列表'));
      expect(onChange).toHaveBeenCalledWith('- 列表项');
    });

    it('inserts ordered list markdown when 有序列表 is clicked', () => {
      const onChange = vi.fn();
      renderEditor({ value: '', onChange, mode: 'full' });

      fireEvent.click(screen.getByTitle('有序列表'));
      expect(onChange).toHaveBeenCalledWith('1. 列表项');
    });

    it('inserts link markdown when 链接 is clicked', () => {
      const onChange = vi.fn();
      renderEditor({ value: '', onChange, mode: 'full' });

      fireEvent.click(screen.getByTitle('链接'));
      expect(onChange).toHaveBeenCalledWith('[链接文字](url)');
    });

    it('wraps selected text with bold markers when text is selected', () => {
      const onChange = vi.fn();
      renderEditor({ value: 'hello world', onChange });

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      // Select "hello" (positions 0-5)
      textarea.setSelectionRange(0, 5);

      fireEvent.click(screen.getByTitle('粗体'));
      expect(onChange).toHaveBeenCalledWith('**hello** world');
    });

    it('wraps selected text with italic markers', () => {
      const onChange = vi.fn();
      renderEditor({ value: 'hello world', onChange });

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      textarea.setSelectionRange(0, 5);

      fireEvent.click(screen.getByTitle('斜体'));
      expect(onChange).toHaveBeenCalledWith('*hello* world');
    });

    it('inserts bold markdown in compact mode', () => {
      const onChange = vi.fn();
      renderEditor({ value: '', onChange, mode: 'compact' });

      fireEvent.click(screen.getByTitle('粗体'));
      expect(onChange).toHaveBeenCalledWith('**粗体文字**');
    });
  });

  // ---------------------------------------------------------------------------
  // Image upload
  // ---------------------------------------------------------------------------
  describe('Image upload', () => {
    it('clicking 上传图片 button triggers file input click', () => {
      renderEditor();
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      fireEvent.click(screen.getByTitle('上传图片'));
      expect(clickSpy).toHaveBeenCalled();
    });

    it('shows uploading state while image is being uploaded', async () => {
      let resolveUpload!: (v: any) => void;
      mockUploadImage.mockReturnValue(new Promise((res) => { resolveUpload = res; }));

      renderEditor();

      const file = new File(['img'], 'photo.png', { type: 'image/png' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      // While uploading, the upload button should be disabled
      const uploadBtn = screen.getByTitle('上传图片');
      expect(uploadBtn).toBeDisabled();

      // Also the textarea should be disabled while uploading
      expect(screen.getByRole('textbox')).toBeDisabled();

      // Resolve upload to clean up
      await act(async () => {
        resolveUpload({ url: 'http://example.com/photo.png', filename: 'photo.png' });
      });
    });

    it('inserts placeholder text immediately on file selection', async () => {
      let resolveUpload!: (v: any) => void;
      mockUploadImage.mockReturnValue(new Promise((res) => { resolveUpload = res; }));

      const onChange = vi.fn();
      renderEditor({ value: '', onChange });

      const file = new File(['img'], 'photo.png', { type: 'image/png' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      // First onChange call inserts the placeholder
      expect(onChange).toHaveBeenCalledWith('![上传中...]()');

      // Resolve upload
      await act(async () => {
        resolveUpload({ url: 'http://example.com/photo.png', filename: 'photo.png' });
      });
    });

    it('replaces placeholder with final image URL on successful upload', async () => {
      // Use a deferred promise so we control when the upload resolves
      let resolveUpload!: (v: any) => void;
      mockUploadImage.mockReturnValue(
        new Promise((res) => { resolveUpload = res; })
      );

      const calls: string[] = [];
      const onChange = vi.fn((v: string) => { calls.push(v); });

      const { rerender } = render(
        <MarkdownEditor value="" onChange={onChange} />
      );

      const file = new File(['img'], 'photo.png', { type: 'image/png' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Trigger file selection — inserts placeholder immediately
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      expect(calls[0]).toBe('![上传中...]()');

      // Rerender with the placeholder so valueRef.current reflects it
      rerender(<MarkdownEditor value="![上传中...]()" onChange={onChange} />);

      // Now resolve the upload
      await act(async () => {
        resolveUpload({ url: 'http://example.com/photo.png', filename: 'photo.png' });
      });

      await waitFor(() => {
        const lastCall = calls[calls.length - 1];
        expect(lastCall).toBe('![image](http://example.com/photo.png)');
      });
    });

    it('removes placeholder and shows alert on upload failure', async () => {
      let rejectUpload!: (err: any) => void;
      mockUploadImage.mockReturnValue(
        new Promise((_, rej) => { rejectUpload = rej; })
      );

      const calls: string[] = [];
      const onChange = vi.fn((v: string) => { calls.push(v); });

      const { rerender } = render(
        <MarkdownEditor value="" onChange={onChange} />
      );

      const file = new File(['img'], 'photo.png', { type: 'image/png' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      expect(calls[0]).toBe('![上传中...]()');

      // Rerender with placeholder so valueRef.current is correct when error handler runs
      rerender(<MarkdownEditor value="![上传中...]()" onChange={onChange} />);

      // Now reject the upload
      await act(async () => {
        rejectUpload(new Error('网络错误'));
      });

      await waitFor(() => {
        const lastCall = calls[calls.length - 1];
        expect(lastCall).toBe('');
      });

      expect(window.alert).toHaveBeenCalledWith('网络错误');
    });

    it('uses error.message fallback for alert on upload failure', async () => {
      mockUploadImage.mockRejectedValue(new Error('图片上传失败'));

      const onChange = vi.fn();
      render(<MarkdownEditor value="" onChange={onChange} />);

      const file = new File(['img'], 'bad.jpg', { type: 'image/jpeg' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('图片上传失败');
      });
    });

    it('shows generic alert message when error has no message', async () => {
      mockUploadImage.mockRejectedValue({});

      const onChange = vi.fn();
      render(<MarkdownEditor value="" onChange={onChange} />);

      const file = new File(['img'], 'bad.jpg', { type: 'image/jpeg' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('图片上传失败');
      });
    });

    it('resets uploading state after successful upload', async () => {
      mockUploadImage.mockResolvedValue({ url: 'http://example.com/x.png', filename: 'x.png' });

      const { rerender } = render(<MarkdownEditor value="" onChange={vi.fn()} />);

      const file = new File(['img'], 'x.png', { type: 'image/png' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      rerender(<MarkdownEditor value="![上传中...]()" onChange={vi.fn()} />);

      await waitFor(() => {
        const uploadBtn = screen.getByTitle('上传图片');
        expect(uploadBtn).not.toBeDisabled();
      });
    });

    it('resets uploading state after failed upload', async () => {
      mockUploadImage.mockRejectedValue(new Error('fail'));

      const onChange = vi.fn();
      const { rerender } = render(<MarkdownEditor value="" onChange={onChange} />);

      const file = new File(['img'], 'fail.png', { type: 'image/png' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      rerender(<MarkdownEditor value="![上传中...]()" onChange={onChange} />);

      await waitFor(() => {
        const uploadBtn = screen.getByTitle('上传图片');
        expect(uploadBtn).not.toBeDisabled();
      });
    });

    it('does nothing when no file is selected via file input', async () => {
      const onChange = vi.fn();
      renderEditor({ onChange });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [] } });
      });

      expect(onChange).not.toHaveBeenCalled();
      expect(mockUploadImage).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------
  describe('Edge cases', () => {
    it('does not render upload spinner when not uploading', () => {
      renderEditor();
      expect(document.querySelector('.markdown-editor__spinner')).not.toBeInTheDocument();
    });

    it('has correct CSS class for full mode', () => {
      const { container } = renderEditor({ mode: 'full' });
      expect(container.firstChild).toHaveClass('markdown-editor--full');
    });

    it('has correct CSS class for compact mode', () => {
      const { container } = renderEditor({ mode: 'compact' });
      expect(container.firstChild).toHaveClass('markdown-editor--compact');
    });

    it('toolbar buttons have type="button" to avoid form submission', () => {
      renderEditor({ mode: 'full' });
      const boldBtn = screen.getByTitle('粗体');
      expect(boldBtn).toHaveAttribute('type', 'button');
    });

    it('view toggle buttons have type="button"', () => {
      renderEditor({ mode: 'full' });
      expect(screen.getByTitle('编辑')).toHaveAttribute('type', 'button');
      expect(screen.getByTitle('分屏')).toHaveAttribute('type', 'button');
      expect(screen.getByTitle('预览')).toHaveAttribute('type', 'button');
    });
  });
});
