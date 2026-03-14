import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../helpers/testUtils';
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

  it('should confirm before cancelling', () => {
    global.confirm = vi.fn(() => true);
    render(<NewPostPage />);
    screen.getByText('取消').click();
    expect(global.confirm).toHaveBeenCalledWith('确定要放弃发布吗？未保存的内容将会丢失。');
    expect(mockNavigate).toHaveBeenCalledWith('/community');
  });

  it('should not navigate when cancel declined', () => {
    global.confirm = vi.fn(() => false);
    render(<NewPostPage />);
    screen.getByText('取消').click();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
