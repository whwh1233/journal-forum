import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../../features/auth/components/LoginForm';

const mockLogin = vi.fn();
const mockClearError = vi.fn();
let mockError: string | null = null;

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    error: mockError,
    clearError: mockClearError,
    user: null,
    isAuthenticated: false,
    loading: false,
  }),
}));

const renderComponent = (overrides: any = {}) => {
  const props = { onSuccess: vi.fn(), onSwitchToRegister: vi.fn(), ...overrides };
  return { ...render(<BrowserRouter><LoginForm {...props} /></BrowserRouter>), props };
};

describe('LoginForm', () => {
  beforeEach(() => { vi.clearAllMocks(); mockError = null; mockLogin.mockResolvedValue(undefined); });

  it('renders login form fields', () => {
    renderComponent();
    expect(screen.getByLabelText('邮箱地址')).toBeInTheDocument();
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
  });

  it('renders form title', () => {
    renderComponent();
    expect(screen.getByText('用户登录')).toBeInTheDocument();
  });

  it('submits form with valid credentials', async () => {
    const user = userEvent.setup();
    const { props } = renderComponent();
    await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '登录' }));
    await waitFor(() => { expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123'); });
    await waitFor(() => { expect(props.onSuccess).toHaveBeenCalled(); });
  });

  it('displays error message from useAuth', () => {
    mockError = '邮箱或密码错误';
    renderComponent();
    expect(screen.getByText('邮箱或密码错误')).toBeInTheDocument();
  });

  it('does not call onSuccess on login failure', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('fail'));
    const { props } = renderComponent();
    await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'wrong');
    await user.click(screen.getByRole('button', { name: '登录' }));
    await waitFor(() => { expect(props.onSuccess).not.toHaveBeenCalled(); });
  });

  it('calls onSwitchToRegister', async () => {
    const user = userEvent.setup();
    const { props } = renderComponent();
    await user.click(screen.getByText('立即注册'));
    expect(props.onSwitchToRegister).toHaveBeenCalled();
  });

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup();
    mockLogin.mockReturnValue(new Promise(() => {}));
    renderComponent();
    await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '登录' }));
    await waitFor(() => { expect(screen.getByRole('button', { name: /登录中/ })).toBeDisabled(); });
  });

  it('clears error when typing in email', async () => {
    const user = userEvent.setup();
    mockError = '登录失败';
    renderComponent();
    expect(screen.getByText('登录失败')).toBeInTheDocument();
    await user.type(screen.getByLabelText('邮箱地址'), 'a');
    expect(mockClearError).toHaveBeenCalled();
  });

  it('disables inputs while submitting', async () => {
    const user = userEvent.setup();
    mockLogin.mockReturnValue(new Promise(() => {}));
    renderComponent();
    const emailInput = screen.getByLabelText('邮箱地址');
    const passwordInput = screen.getByLabelText('密码');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: '登录' }));
    await waitFor(() => { expect(emailInput).toBeDisabled(); expect(passwordInput).toBeDisabled(); });
  });
});