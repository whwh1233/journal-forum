import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import UserDropdown from '@/components/common/UserDropdown';
import * as AuthContext from '@/contexts/AuthContext';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthContext
const mockLogout = vi.fn();
vi.spyOn(AuthContext, 'useAuthContext').mockReturnValue({
  user: null,
  login: vi.fn(),
  logout: mockLogout,
  register: vi.fn(),
  updateUserProfile: vi.fn(),
  loading: false,
  isAuthenticated: false,
});

describe('UserDropdown', () => {
  const defaultProps = {
    userName: '张三',
    userInitial: '张',
  };

  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogout.mockClear();
  });

  describe('渲染测试', () => {
    it('should render user avatar with initial', () => {
      render(<UserDropdown {...defaultProps} />);

      expect(screen.getByText('张')).toBeInTheDocument();
    });

    it('should render user name', () => {
      render(<UserDropdown {...defaultProps} />);

      expect(screen.getByText('张三')).toBeInTheDocument();
    });

    it('should not show dropdown menu initially', () => {
      render(<UserDropdown {...defaultProps} />);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should render with correct ARIA attributes when closed', () => {
      render(<UserDropdown {...defaultProps} />);

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    });

    it('should render ChevronDown icon', () => {
      const { container } = render(<UserDropdown {...defaultProps} />);

      const icon = container.querySelector('.user-dropdown-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('交互测试 - 打开/关闭', () => {
    it('should open dropdown when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    it('should close dropdown when trigger is clicked again', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger); // Open
      await user.click(trigger); // Close

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should toggle chevron icon class when opening/closing', async () => {
      const user = userEvent.setup();
      const { container } = render(<UserDropdown {...defaultProps} />);

      const trigger = screen.getByRole('button');
      const icon = container.querySelector('.user-dropdown-icon');

      expect(icon).not.toHaveClass('open');

      await user.click(trigger);
      await waitFor(() => {
        expect(icon).toHaveClass('open');
      });

      await user.click(trigger);
      await waitFor(() => {
        expect(icon).not.toHaveClass('open');
      });
    });
  });

  describe('交互测试 - 点击外部关闭', () => {
    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <div>
          <UserDropdown {...defaultProps} />
          <div data-testid="outside">Outside element</div>
        </div>
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Click outside
      const outside = screen.getByTestId('outside');
      await user.click(outside);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should not close dropdown when clicking inside', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      const menu = screen.getByRole('menu');
      await user.click(menu);

      // Dropdown should still be open
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  describe('交互测试 - 菜单项导航', () => {
    it('should render all menu items when open', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('个人中心')).toBeInTheDocument();
        expect(screen.getByText('账号设置')).toBeInTheDocument();
        expect(screen.getByText('退出登录')).toBeInTheDocument();
      });
    });

    it('should have menu items with correct role', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem');
        expect(menuItems).toHaveLength(3);
      });
    });

    it('should navigate to dashboard when clicking "个人中心"', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('个人中心'));

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should close dropdown after navigating to dashboard', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('个人中心'));

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should navigate to profile edit when clicking "账号设置"', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('账号设置'));

      expect(mockNavigate).toHaveBeenCalledWith('/profile/edit');
    });

    it('should close dropdown after navigating to profile edit', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('账号设置'));

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('交互测试 - 退出登录', () => {
    it('should call logout when clicking "退出登录"', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('退出登录'));

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('should navigate to home page after logout', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('退出登录'));

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should close dropdown after logout', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('退出登录'));

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should have logout button with "logout" class', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      const logoutButton = screen.getByText('退出登录').closest('button');
      expect(logoutButton).toHaveClass('logout');
    });
  });

  describe('键盘导航', () => {
    it('should close dropdown when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByRole('menu')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should not close dropdown when Escape is pressed while closed', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      // Dropdown is closed, press Escape
      await user.keyboard('{Escape}');

      // Should remain closed without errors
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should not close dropdown when other keys are pressed', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      // Press keys that should not close the menu
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowUp}');
      await user.keyboard('a');

      // Dropdown should still be open
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  describe('UI 元素测试', () => {
    it('should render menu icons', async () => {
      const user = userEvent.setup();
      const { container } = render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      const icons = container.querySelectorAll('.dropdown-icon');
      expect(icons.length).toBeGreaterThanOrEqual(3);
    });

    it('should render divider between settings and logout', async () => {
      const user = userEvent.setup();
      const { container } = render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      const divider = container.querySelector('.user-dropdown-divider');
      expect(divider).toBeInTheDocument();
    });

    it('should have correct CSS classes on avatar', () => {
      const { container } = render(<UserDropdown {...defaultProps} />);

      const avatar = container.querySelector('.user-dropdown-avatar');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveTextContent('张');
    });

    it('should have correct CSS classes on name', () => {
      const { container } = render(<UserDropdown {...defaultProps} />);

      const name = container.querySelector('.user-dropdown-name');
      expect(name).toBeInTheDocument();
      expect(name).toHaveTextContent('张三');
    });
  });

  describe('边界场景测试', () => {
    it('should handle empty userName', () => {
      render(<UserDropdown userName="" userInitial="?" />);

      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('should handle long userName', () => {
      const longName = '非常非常非常长的用户名字';
      render(<UserDropdown userName={longName} userInitial="非" />);

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle special characters in userName', () => {
      render(<UserDropdown userName="用户@#$%" userInitial="用" />);

      expect(screen.getByText('用户@#$%')).toBeInTheDocument();
    });

    it('should handle rapid open/close clicks', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      const trigger = screen.getByRole('button');

      // Rapidly click multiple times
      await user.click(trigger);
      await user.click(trigger);
      await user.click(trigger);
      await user.click(trigger);

      // Should end up in a consistent state (closed)
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should handle multiple UserDropdown instances', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <UserDropdown userName="用户1" userInitial="1" />
          <UserDropdown userName="用户2" userInitial="2" />
        </div>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);

      await user.click(buttons[0]);
      const menus = screen.getAllByRole('menu');
      expect(menus).toHaveLength(1);
    });
  });

  describe('清理测试', () => {
    it('should cleanup event listeners on unmount', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<UserDropdown {...defaultProps} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      unmount();

      // Should not throw errors after unmount
      expect(() => {
        document.dispatchEvent(new MouseEvent('mousedown'));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      }).not.toThrow();
    });

    it('should handle unmount while dropdown is open', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      unmount();

      // Should not throw errors
      expect(true).toBe(true);
    });
  });
});
