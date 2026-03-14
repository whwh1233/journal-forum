import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../helpers/testUtils';
import userEvent from '@testing-library/user-event';
import RegisterForm from '../../../features/auth/components/RegisterForm';
import * as authHook from '../../../hooks/useAuth';

vi.mock('../../../hooks/useAuth');

describe('RegisterForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnSwitchToLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: mockRegister,
      error: null,
      clearError: mockClearError,
      loading: false,
    });
  });
  it('should render all form fields', () => {
    render(
      <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onSuccess={mockOnSuccess} />
    );
    expect(screen.getByLabelText('邮箱地址')).toBeInTheDocument();
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
    expect(screen.getByLabelText('确认密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /注册/ })).toBeInTheDocument();
  });

  it('should render the register title', () => {
    render(
      <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onSuccess={mockOnSuccess} />
    );
    expect(screen.getByText('用户注册')).toBeInTheDocument();
  });

  it('should display error message when error exists', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: mockRegister,
      error: '注册失败',
      clearError: mockClearError,
      loading: false,
    });
    render(
      <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onSuccess={mockOnSuccess} />
    );
    expect(screen.getByText('注册失败')).toBeInTheDocument();
  });
  it('should call register with form data on submit', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);
    render(
      <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onSuccess={mockOnSuccess} />
    );
    await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.type(screen.getByLabelText('确认密码'), 'password123');
    await user.click(screen.getByRole('button', { name: /注册/ }));
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('test@example.com', 'password123', 'password123');
    });
  });

  it('should call onSuccess after successful registration', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);
    render(
      <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onSuccess={mockOnSuccess} />
    );
    await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.type(screen.getByLabelText('确认密码'), 'password123');
    await user.click(screen.getByRole('button', { name: /注册/ }));
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });
  it('should not call onSuccess when registration fails', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValue(new Error('注册失败'));
    render(
      <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onSuccess={mockOnSuccess} />
    );
    await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.type(screen.getByLabelText('确认密码'), 'password123');
    await user.click(screen.getByRole('button', { name: /注册/ }));
    await waitFor(() => {
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('should disable submit button while submitting', async () => {
    const user = userEvent.setup();
    mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    render(
      <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onSuccess={mockOnSuccess} />
    );
    await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.type(screen.getByLabelText('确认密码'), 'password123');
    await user.click(screen.getByRole('button', { name: /注册/ }));
    expect(screen.getByRole('button', { name: /注册中/ })).toBeDisabled();
  });
  it('should show loading text while submitting', async () => {
    const user = userEvent.setup();
    mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    render(
      <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onSuccess={mockOnSuccess} />
    );
    await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.type(screen.getByLabelText('确认密码'), 'password123');
    await user.click(screen.getByRole('button', { name: /注册/ }));
    expect(screen.getByText('注册中...')).toBeInTheDocument();
  });

  it('should call onSwitchToLogin and clearError when switch link is clicked', async () => {
    const user = userEvent.setup();
    render(
      <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onSuccess={mockOnSuccess} />
    );
    await user.click(screen.getByText('立即登录'));
    expect(mockOnSwitchToLogin).toHaveBeenCalledTimes(1);
    expect(mockClearError).toHaveBeenCalled();
  });

  it('should clear error when user types in any input field', async () => {
    const user = userEvent.setup();
    render(
      <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onSuccess={mockOnSuccess} />
    );
    await user.type(screen.getByLabelText('邮箱地址'), 'a');
    expect(mockClearError).toHaveBeenCalled();
  });

  it('should disable inputs while submitting', async () => {
    const user = userEvent.setup();
    mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    render(
      <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onSuccess={mockOnSuccess} />
    );
    await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.type(screen.getByLabelText('确认密码'), 'password123');
    await user.click(screen.getByRole('button', { name: /注册/ }));
    expect(screen.getByLabelText('邮箱地址')).toBeDisabled();
    expect(screen.getByLabelText('密码')).toBeDisabled();
    expect(screen.getByLabelText('确认密码')).toBeDisabled();
  });
});
