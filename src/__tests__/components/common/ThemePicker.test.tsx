import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@/__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import ThemePicker from '@/components/common/ThemePicker';

describe('ThemePicker', () => {
  beforeEach(() => {
    // 清理 localStorage
    localStorage.clear();
  });

  afterEach(() => {
    // 清理 DOM
    document.documentElement.removeAttribute('data-theme');
  });

  describe('渲染测试', () => {
    it('should render theme picker button', () => {
      render(<ThemePicker />);
      const button = screen.getByRole('button', { name: /切换主题/i });
      expect(button).toBeInTheDocument();
    });

    it('should not render dropdown initially', () => {
      render(<ThemePicker />);
      const panel = screen.queryByText(/选择主题/i);
      expect(panel).not.toBeInTheDocument();
    });

    it('should have correct ARIA attributes on trigger button', () => {
      render(<ThemePicker />);
      const button = screen.getByRole('button', { name: /切换主题/i });
      expect(button).toHaveAttribute('aria-label', '切换主题');
      expect(button).toHaveAttribute('title', '切换主题');
    });
  });

  describe('交互测试 - 下拉菜单', () => {
    it('should open dropdown when button is clicked', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/选择主题/i)).toBeInTheDocument();
      });
    });

    it('should close dropdown when button is clicked again', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button); // 打开
      await user.click(button); // 关闭

      await waitFor(() => {
        expect(screen.queryByText(/选择主题/i)).not.toBeInTheDocument();
      });
    });

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <div>
          <ThemePicker />
          <div data-testid="outside">Outside</div>
        </div>
      );

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      // 确认下拉菜单已打开
      await waitFor(() => {
        expect(screen.getByText(/选择主题/i)).toBeInTheDocument();
      });

      // 点击外部
      const outsideElement = screen.getByTestId('outside');
      await user.click(outsideElement);

      await waitFor(() => {
        expect(screen.queryByText(/选择主题/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('交互测试 - 主题选择', () => {
    it('should display all available themes', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('默认蓝')).toBeInTheDocument();
        expect(screen.getByText('温暖自然')).toBeInTheDocument();
        expect(screen.getByText('日落辉光')).toBeInTheDocument();
        expect(screen.getByText('复古橄榄')).toBeInTheDocument();
        expect(screen.getByText('柔和大地')).toBeInTheDocument();
        expect(screen.getByText('暖秋大地')).toBeInTheDocument();
      });
    });

    it('should show theme descriptions', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('经典学术蓝')).toBeInTheDocument();
        expect(screen.getByText('柔和米黄色系')).toBeInTheDocument();
        expect(screen.getByText('橙黄渐变色系')).toBeInTheDocument();
      });
    });

    it('should change theme when theme option is clicked', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      // 点击"温暖自然"主题
      const warmNatureTheme = screen.getByText('温暖自然');
      await user.click(warmNatureTheme);

      // 验证主题已应用到 DOM
      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute('data-theme', 'warm-nature');
      });

      // 验证下拉菜单已关闭
      await waitFor(() => {
        expect(screen.queryByText(/选择主题/i)).not.toBeInTheDocument();
      });
    });

    it('should persist theme selection to localStorage', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      const sunsetTheme = screen.getByText('日落辉光');
      await user.click(sunsetTheme);

      // 等待 DOM 更新
      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute('data-theme', 'sunset-glow');
      });

      // 验证 localStorage
      expect(localStorage.getItem('app-theme')).toBe('sunset-glow');
    });

    it('should show checkmark on currently selected theme', async () => {
      const user = userEvent.setup();
      const { container } = render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      // 默认主题应该显示选中状态
      await waitFor(() => {
        const activeThemeCard = container.querySelector('.theme-card.active');
        expect(activeThemeCard).toBeInTheDocument();
        expect(activeThemeCard?.querySelector('.check-icon')).toBeInTheDocument();
      });
    });

    it('should update checkmark when switching themes', async () => {
      const user = userEvent.setup();
      const { container } = render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      // 切换到"复古橄榄"主题
      const vintageTheme = screen.getByText('复古橄榄');
      await user.click(vintageTheme);

      // 重新打开下拉菜单
      await user.click(button);

      // 验证"复古橄榄"现在有选中标记
      await waitFor(() => {
        const activeCards = container.querySelectorAll('.theme-card.active');
        expect(activeCards).toHaveLength(1);

        // 验证选中的是"复古橄榄"
        const vintageCard = screen.getByText('复古橄榄').closest('.theme-card');
        expect(vintageCard).toHaveClass('active');
        expect(vintageCard?.querySelector('.check-icon')).toBeInTheDocument();
      });
    });
  });

  describe('交互测试 - 深浅模式切换', () => {
    it('should display mode toggle button', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      await waitFor(() => {
        const modeToggle = screen.getByRole('button', { name: /切换到深色模式|切换到浅色模式/i });
        expect(modeToggle).toBeInTheDocument();
      });
    });

    it('should start in light mode by default', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      await waitFor(() => {
        const modeToggle = screen.getByRole('button', { name: /切换到深色模式/i });
        expect(modeToggle).toBeInTheDocument();
      });
    });

    it('should toggle to dark mode when clicked', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      const modeToggle = screen.getByRole('button', { name: /切换到深色模式/i });
      await user.click(modeToggle);

      await waitFor(() => {
        // 验证 DOM 更新（默认主题深色模式设置 data-theme="dark"）
        expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      });

      await waitFor(() => {
        // 验证按钮标签更新
        expect(screen.getByRole('button', { name: /切换到浅色模式/i })).toBeInTheDocument();
      });
    });

    it('should toggle back to light mode when clicked again', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      const modeToggle = screen.getByRole('button', { name: /切换到深色模式/i });
      await user.click(modeToggle); // 切换到深色
      await user.click(modeToggle); // 切换回浅色

      await waitFor(() => {
        expect(document.documentElement).not.toHaveAttribute('data-theme');
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /切换到深色模式/i })).toBeInTheDocument();
      });
    });

    it('should persist mode selection to localStorage', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      const modeToggle = screen.getByRole('button', { name: /切换到深色模式/i });
      await user.click(modeToggle);

      await waitFor(() => {
        expect(localStorage.getItem('app-theme-mode')).toBe('dark');
      });
    });

    it('should show moon icon in light mode and sun icon in dark mode', async () => {
      const user = userEvent.setup();
      const { container } = render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      // 浅色模式应该显示月亮图标（切换到深色）
      await waitFor(() => {
        const modeToggle = container.querySelector('.mode-toggle.light');
        expect(modeToggle).toBeInTheDocument();
      });

      // 点击切换到深色模式
      const modeToggle = screen.getByRole('button', { name: /切换到深色模式/i });
      await user.click(modeToggle);

      // 深色模式应该显示太阳图标（切换到浅色）
      await waitFor(() => {
        const darkModeToggle = container.querySelector('.mode-toggle.dark');
        expect(darkModeToggle).toBeInTheDocument();
      });
    });
  });

  describe('可访问性测试', () => {
    it('should have proper title attribute on trigger button', () => {
      render(<ThemePicker />);
      const button = screen.getByRole('button', { name: /切换主题/i });
      expect(button).toHaveAttribute('title', '切换主题');
    });

    it('should have proper aria-label on mode toggle button', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      await waitFor(() => {
        const modeToggle = screen.getByRole('button', { name: /切换到深色模式/i });
        expect(modeToggle).toHaveAttribute('aria-label', '切换到深色模式');
        expect(modeToggle).toHaveAttribute('title', '切换到深色');
      });
    });

    it('should update aria-label when mode changes', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      const modeToggle = screen.getByRole('button', { name: /切换到深色模式/i });
      await user.click(modeToggle);

      await waitFor(() => {
        const updatedModeToggle = screen.getByRole('button', { name: /切换到浅色模式/i });
        expect(updatedModeToggle).toHaveAttribute('aria-label', '切换到浅色模式');
        expect(updatedModeToggle).toHaveAttribute('title', '切换到浅色');
      });
    });
  });

  describe('主题预览色块', () => {
    it('should render preview color swatches for each theme', async () => {
      const user = userEvent.setup();
      const { container } = render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      await waitFor(() => {
        const previewElements = container.querySelectorAll('.theme-preview');
        expect(previewElements.length).toBeGreaterThan(0);

        // 每个主题预览应该有 3 个色块
        previewElements.forEach((preview) => {
          const swatches = preview.querySelectorAll('span');
          expect(swatches).toHaveLength(3);
        });
      });
    });

    it('should apply correct background colors to preview swatches', async () => {
      const user = userEvent.setup();
      const { container } = render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      await waitFor(() => {
        const firstThemePreview = container.querySelector('.theme-preview');
        expect(firstThemePreview).toBeInTheDocument();

        const firstSwatch = firstThemePreview?.querySelector('span:first-child') as HTMLElement;
        expect(firstSwatch).toBeInTheDocument();
        // 验证有背景色样式（不检查具体值，因为主题配置可能变化）
        expect(firstSwatch.style.background).toBeTruthy();
      });
    });
  });

  describe('边界情况', () => {
    it('should handle rapid theme switching', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });

      // 快速切换多个主题（每次都需要重新打开下拉菜单）
      await user.click(button);
      await user.click(screen.getByText('温暖自然'));

      await user.click(button);
      await user.click(screen.getByText('日落辉光'));

      await user.click(button);
      await user.click(screen.getByText('复古橄榄'));

      // 验证最后一个主题被应用
      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute('data-theme', 'vintage-olive');
      });
    });

    it('should handle rapid mode toggling', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      // 快速切换多次
      const modeToggle = screen.getByRole('button', { name: /切换到深色模式/i });
      await user.click(modeToggle);
      await user.click(modeToggle);
      await user.click(modeToggle);

      // 验证最终状态
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /切换到浅色模式/i })).toBeInTheDocument();
      });
    });

    it('should maintain theme when dropdown is closed and reopened', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });

      // 打开，选择主题，关闭
      await user.click(button);
      const warmNature = screen.getByText('温暖自然');
      await user.click(warmNature);

      // 重新打开
      await user.click(button);

      // 验证选中状态保持
      await waitFor(() => {
        const activeCard = screen.getByText('温暖自然').closest('.theme-card');
        expect(activeCard).toHaveClass('active');
      });
    });
  });
});
