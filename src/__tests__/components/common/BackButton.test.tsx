import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import BackButton from '@/components/common/BackButton';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BackButton', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('渲染测试', () => {
    it('should render with default label', () => {
      render(<BackButton />);
      expect(screen.getByText('返回')).toBeInTheDocument();
    });

    it('should render with custom label', () => {
      render(<BackButton label="回到首页" />);
      expect(screen.getByText('回到首页')).toBeInTheDocument();
    });

    it('should render back icon', () => {
      const { container } = render(<BackButton />);
      const icon = container.querySelector('.back-button-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<BackButton className="custom-class" />);
      const button = container.querySelector('.back-button.custom-class');
      expect(button).toBeInTheDocument();
    });
  });

  describe('导航行为', () => {
    it('should navigate back when clicked (default behavior)', async () => {
      const user = userEvent.setup();
      render(<BackButton />);

      await user.click(screen.getByRole('button'));
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('should navigate to specified path when "to" prop is provided', async () => {
      const user = userEvent.setup();
      render(<BackButton to="/home" />);

      await user.click(screen.getByRole('button'));
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    it('should call custom onClick handler when provided', async () => {
      const mockOnClick = vi.fn();
      const user = userEvent.setup();
      render(<BackButton onClick={mockOnClick} />);

      await user.click(screen.getByRole('button'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should prefer custom onClick over to prop', async () => {
      const mockOnClick = vi.fn();
      const user = userEvent.setup();
      render(<BackButton to="/home" onClick={mockOnClick} />);

      await user.click(screen.getByRole('button'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should prefer to prop over default back navigation', async () => {
      const user = userEvent.setup();
      render(<BackButton to="/home" />);

      await user.click(screen.getByRole('button'));
      expect(mockNavigate).toHaveBeenCalledWith('/home');
      expect(mockNavigate).not.toHaveBeenCalledWith(-1);
    });
  });

  describe('可访问性测试', () => {
    it('should have correct accessibility attributes with default label', () => {
      render(<BackButton />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', '返回');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should have correct accessibility attributes with custom label', () => {
      render(<BackButton label="返回上一页" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', '返回上一页');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<BackButton />);

      const button = screen.getByRole('button');
      button.focus();

      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('should be activatable with Space key', async () => {
      const user = userEvent.setup();
      render(<BackButton />);

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard(' ');
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('边界场景', () => {
    it('should handle multiple clicks without errors', async () => {
      const user = userEvent.setup();
      render(<BackButton />);

      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(mockNavigate).toHaveBeenCalledTimes(3);
    });

    it('should handle empty string label', () => {
      render(<BackButton label="" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', '');
    });

    it('should handle special characters in label', () => {
      const specialLabel = '返回 & 重试 <>';
      render(<BackButton label={specialLabel} />);
      expect(screen.getByText(specialLabel)).toBeInTheDocument();
    });
  });
});
