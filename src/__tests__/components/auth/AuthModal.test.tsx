import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../helpers/testUtils';
import AuthModal from '../../../features/auth/components/AuthModal';

vi.mock('../../../features/auth/components/LoginForm', () => ({
  default: ({ onSwitchToRegister, onSuccess }: any) => (
    <div data-testid="login-form">
      <span>Login Form</span>
      <button onClick={onSwitchToRegister}>切换注册</button>
      <button onClick={onSuccess}>登录成功</button>
    </div>
  ),
}));

vi.mock('../../../features/auth/components/RegisterForm', () => ({
  default: ({ onSwitchToLogin, onSuccess }: any) => (
    <div data-testid="register-form">
      <span>Register Form</span>
      <button onClick={onSwitchToLogin}>切换登录</button>
      <button onClick={onSuccess}>注册成功</button>
    </div>
  ),
}));
describe('AuthModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onAuthSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form by default when open', () => {
    render(<AuthModal {...defaultProps} />);
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  it('should not render anything when isOpen is false', () => {
    render(<AuthModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
  });

  it('should display login title when in login mode', () => {
    render(<AuthModal {...defaultProps} />);
    expect(screen.getByText('用户登录')).toBeInTheDocument();
  });
  it('should switch to register form when switch button is clicked', async () => {
    render(<AuthModal {...defaultProps} />);
    fireEvent.click(screen.getByText('切换注册'));
    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
      expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
    });
  });

  it('should display register title when in register mode', async () => {
    render(<AuthModal {...defaultProps} />);
    fireEvent.click(screen.getByText('切换注册'));
    await waitFor(() => {
      expect(screen.getByText('用户注册')).toBeInTheDocument();
    });
  });

  it('should switch back to login form from register form', async () => {
    render(<AuthModal {...defaultProps} />);
    fireEvent.click(screen.getByText('切换注册'));
    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('切换登录'));
    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });
  it('should call onAuthSuccess and onClose on login success', async () => {
    render(<AuthModal {...defaultProps} />);
    fireEvent.click(screen.getByText('登录成功'));
    await waitFor(() => {
      expect(defaultProps.onAuthSuccess).toHaveBeenCalledTimes(1);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onAuthSuccess and onClose on register success', async () => {
    render(<AuthModal {...defaultProps} />);
    fireEvent.click(screen.getByText('切换注册'));
    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('注册成功'));
    await waitFor(() => {
      expect(defaultProps.onAuthSuccess).toHaveBeenCalledTimes(1);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should render modal with close button', () => {
    render(<AuthModal {...defaultProps} />);
    const closeButton = screen.getByLabelText('关闭');
    expect(closeButton).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<AuthModal {...defaultProps} />);
    const closeButton = screen.getByLabelText('关闭');
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
