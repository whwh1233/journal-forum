import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../helpers/testUtils';
import NewPostPage from '@/features/posts/pages/NewPostPage';
import { postService } from '@/features/posts/services/postService';

vi.mock('@/features/posts/services/postService', () => ({
  postService: { createPost: vi.fn() },
}));
vi.mock('@/contexts/PageContext', () => ({ usePageTitle: vi.fn() }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock('@/features/posts/components/PostForm', () => ({
  default: ({ mode, onSubmit, onCancel }: any) => (
    <div data-testid="post-form">
      <span>mode: {mode}</span>
      <button onClick={() => onSubmit({ title: 'Test', content: 'Content', category: 'discussion', tags: [] })}>提交</button>
      <button onClick={onCancel}>取消</button>
    </div>
  ),
}));

describe('NewPostPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should render PostForm in create mode', () => {
    render(<NewPostPage />);
    expect(screen.getByTestId('post-form')).toBeInTheDocument();
    expect(screen.getByText('mode: create')).toBeInTheDocument();
  });

  it('should navigate after successful submission', async () => {
    vi.mocked(postService.createPost).mockResolvedValue({ id: 42 });
    render(<NewPostPage />);
    screen.getByText('提交').click();
    await waitFor(() => { expect(mockNavigate).toHaveBeenCalledWith('/posts/42'); });
  });

  it('should display error on failure', async () => {
    vi.mocked(postService.createPost).mockRejectedValue(new Error('发布失败'));
    render(<NewPostPage />);
    screen.getByText('提交').click();
    await waitFor(() => { expect(screen.getByText('发布失败')).toBeInTheDocument(); });
  });

  it('shows inline cancel confirmation instead of window.confirm', () => {
    // Ensure window.confirm is NOT called
    const confirmSpy = vi.spyOn(window, 'confirm');

    render(<NewPostPage />);

    // Trigger cancel (PostForm mock renders a "取消" button)
    const cancelBtn = screen.getByRole('button', { name: /取消/i });
    fireEvent.click(cancelBtn);

    // window.confirm should NOT have been called
    expect(confirmSpy).not.toHaveBeenCalled();

    // Inline confirmation panel should appear
    expect(screen.getByText(/确定放弃发布/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /继续编辑/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /放弃并离开/ })).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it('dismisses cancel confirmation when user clicks 继续编辑', () => {
    render(<NewPostPage />);

    const cancelBtn = screen.getByRole('button', { name: /取消/i });
    fireEvent.click(cancelBtn);

    const continueBtn = screen.getByRole('button', { name: /继续编辑/ });
    fireEvent.click(continueBtn);

    expect(screen.queryByText(/确定放弃发布/)).not.toBeInTheDocument();
  });
});
