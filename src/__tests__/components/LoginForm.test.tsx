import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/testUtils';
import userEvent from '@testing-library/user-event';
import LoginForm from '../../features/auth/components/LoginForm';

describe('LoginForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnSwitchToRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form fields', () => {
    render(
      <LoginForm
        onSuccess={mockOnSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    expect(screen.getByLabelText(/邮箱|Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/密码|Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登录|Login/i })).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();

    render(
      <LoginForm
        onSuccess={mockOnSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const emailInput = screen.getByLabelText(/邮箱|Email/i);
    const submitButton = screen.getByRole('button', { name: /登录|Login/i });

    // 输入无效邮箱
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    // 应该显示错误信息
    await waitFor(() => {
      expect(screen.getByText(/邮箱格式不正确|Invalid email/i)).toBeInTheDocument();
    });
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();

    render(
      <LoginForm
        onSuccess={mockOnSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const submitButton = screen.getByRole('button', { name: /登录|Login/i });
    await user.click(submitButton);

    // 应该显示必填字段错误
    await waitFor(() => {
      expect(screen.getByText(/请输入邮箱|Email is required/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid credentials', async () => {
    const user = userEvent.setup();

    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              token: 'test-token',
              user: { id: 1, email: 'test@example.com', name: 'Test User' },
            },
          }),
      })
    ) as any;

    render(
      <LoginForm
        onSuccess={mockOnSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const emailInput = screen.getByLabelText(/邮箱|Email/i);
    const passwordInput = screen.getByLabelText(/密码|Password/i);
    const submitButton = screen.getByRole('button', { name: /登录|Login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should display error message on login failure', async () => {
    const user = userEvent.setup();

    // Mock failed fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            message: '邮箱或密码错误',
          }),
      })
    ) as any;

    render(
      <LoginForm
        onSuccess={mockOnSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const emailInput = screen.getByLabelText(/邮箱|Email/i);
    const passwordInput = screen.getByLabelText(/密码|Password/i);
    const submitButton = screen.getByRole('button', { name: /登录|Login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/邮箱或密码错误/)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should call onSwitchToRegister when register link is clicked', async () => {
    const user = userEvent.setup();

    render(
      <LoginForm
        onSuccess={mockOnSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const registerLink = screen.getByText(/注册|Register/i);
    await user.click(registerLink);

    expect(mockOnSwitchToRegister).toHaveBeenCalled();
  });

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup();

    // Mock slow fetch
    global.fetch = vi.fn(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ success: true, data: {} }),
              } as any),
            1000
          )
        )
    );

    render(
      <LoginForm
        onSuccess={mockOnSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const emailInput = screen.getByLabelText(/邮箱|Email/i);
    const passwordInput = screen.getByLabelText(/密码|Password/i);
    const submitButton = screen.getByRole('button', { name: /登录|Login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // 按钮应该被禁用
    expect(submitButton).toBeDisabled();
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();

    render(
      <LoginForm
        onSuccess={mockOnSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const passwordInput = screen.getByLabelText(/密码|Password/i) as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: /显示|隐藏|Show|Hide/i });

    // 初始状态应该是password类型
    expect(passwordInput.type).toBe('password');

    // 点击切换
    await user.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    // 再次点击切换回来
    await user.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('should clear error message when user starts typing', async () => {
    const user = userEvent.setup();

    // Mock failed fetch first
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ success: false, message: '登录失败' }),
      })
    ) as any;

    render(
      <LoginForm
        onSuccess={mockOnSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const emailInput = screen.getByLabelText(/邮箱|Email/i);
    const passwordInput = screen.getByLabelText(/密码|Password/i);
    const submitButton = screen.getByRole('button', { name: /登录|Login/i });

    // 先触发错误
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrong');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/登录失败/)).toBeInTheDocument();
    });

    // 开始输入时应该清除错误
    await user.type(emailInput, 'a');

    await waitFor(() => {
      expect(screen.queryByText(/登录失败/)).not.toBeInTheDocument();
    });
  });
});
