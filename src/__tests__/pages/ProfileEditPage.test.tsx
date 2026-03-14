import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../helpers/testUtils';
import ProfileEditPage from '@/features/profile/pages/ProfileEditPage';
import * as userService from '@/services/userService';
import * as authHook from '@/hooks/useAuth';

vi.mock('@/services/userService');
vi.mock('@/hooks/useAuth');
vi.mock('@/contexts/PageContext', () => ({ usePageTitle: vi.fn() }));
vi.mock('@/features/badges', () => ({
  BadgePicker: ({ onSave }: { onSave: () => void }) => (
    <div data-testid="badge-picker"><button onClick={onSave}>Save</button></div>
  ),
}));
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUser = { id: '1', email: 'test@example.com', name: 'Test User', bio: 'Hello world', avatar: null };
const mockAuthReturn = {
  user: mockUser, login: vi.fn(), logout: vi.fn(), register: vi.fn(),
  loading: false, isAuthenticated: true, error: null,
  clearError: vi.fn(), checkAuthStatus: vi.fn(),
};

describe('ProfileEditPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should show login prompt when not authenticated', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({ ...mockAuthReturn, user: null, isAuthenticated: false });
    render(<ProfileEditPage />);
    expect(screen.getByText('请先登录')).toBeInTheDocument();
  });

  it('should render profile edit form', () => {
    vi.mocked(authHook.useAuth).mockReturnValue(mockAuthReturn);
    render(<ProfileEditPage />);
    expect(screen.getByText('头像')).toBeInTheDocument();
    expect(screen.getByText('基本信息')).toBeInTheDocument();
    expect(screen.getAllByText('修改密码').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText('昵称')).toBeInTheDocument();
    expect(screen.getByLabelText('个人简介')).toBeInTheDocument();
  });

  it('should pre-populate form', () => {
    vi.mocked(authHook.useAuth).mockReturnValue(mockAuthReturn);
    render(<ProfileEditPage />);
    const nameInput = screen.getByLabelText('昵称') as HTMLInputElement;
    const bioInput = screen.getByLabelText('个人简介') as HTMLTextAreaElement;
    expect(nameInput.value).toBe('Test User');
    expect(bioInput.value).toBe('Hello world');
  });

  it('should render password fields', () => {
    vi.mocked(authHook.useAuth).mockReturnValue(mockAuthReturn);
    render(<ProfileEditPage />);
    expect(screen.getByLabelText('当前密码')).toBeInTheDocument();
    expect(screen.getByLabelText('新密码')).toBeInTheDocument();
    expect(screen.getByLabelText('确认新密码')).toBeInTheDocument();
  });

  it('should render badge picker', () => {
    vi.mocked(authHook.useAuth).mockReturnValue(mockAuthReturn);
    render(<ProfileEditPage />);
    expect(screen.getByText('置顶徽章')).toBeInTheDocument();
    expect(screen.getByTestId('badge-picker')).toBeInTheDocument();
  });

  it('should show upload hint', () => {
    vi.mocked(authHook.useAuth).mockReturnValue(mockAuthReturn);
    render(<ProfileEditPage />);
    expect(screen.getByText(/支持 JPG、PNG 格式/)).toBeInTheDocument();
  });
});
