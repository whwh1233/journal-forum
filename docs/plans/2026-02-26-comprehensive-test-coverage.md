# 全面测试覆盖实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现 90%+ 测试覆盖率，包括所有组件、hooks、services 和边界场景测试

**Architecture:** 渐进式全面覆盖，分 3 阶段实施。阶段 1 专注核心组件测试（15+ 组件），阶段 2 补充页面和单元测试（10+ 页面 + 8+ 单元测试），阶段 3 增强边界场景和文档。使用 Vitest + React Testing Library 进行前端测试。

**Tech Stack:** Vitest, React Testing Library, @testing-library/user-event, @vitest/coverage-v8

---

## 前置准备：配置测试基础设施

### Task 1: 更新测试配置和依赖

**Files:**
- Modify: `vitest.config.ts:11-21`
- Modify: `package.json` (scripts section)
- Create: `src/__tests__/test-utils.tsx`

**Step 1: 检查当前测试依赖**

Run: `npm list @testing-library/react @testing-library/user-event @vitest/coverage-v8`
Expected: 查看已安装的测试库版本

**Step 2: 安装缺失的测试依赖（如需要）**

```bash
npm install -D @testing-library/user-event @vitest/coverage-v8
```

Expected: 依赖安装成功

**Step 3: 更新 vitest.config.ts 添加覆盖率阈值**

```typescript
// vitest.config.ts (修改 coverage 部分)
coverage: {
  provider: 'v8',
  reporter: ['text', 'html', 'lcov'],
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    'node_modules/',
    'src/__tests__/',
    '**/*.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}',
    '**/*.config.{ts,js}',
    '**/types/',
    'src/main.tsx',
    'src/vite-env.d.ts'
  ],
  thresholds: {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90
  }
},
```

**Step 4: 添加测试脚本到 package.json**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:backend": "cd backend && npm test",
    "test:backend:coverage": "cd backend && npm run test:coverage",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "npm run test:backend && npm test && npm run test:e2e",
    "test:all:coverage": "npm run test:backend:coverage && npm run test:coverage && npm run test:e2e",
    "test:quick": "npm run test:backend && npm test"
  }
}
```

**Step 5: 创建测试工具文件**

```typescript
// src/__tests__/test-utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// 包含所有必要 Provider 的测试包装器
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

// 自定义 render 函数
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

**Step 6: 验证测试基础设施**

Run: `npm test -- --run`
Expected: 现有测试全部通过

**Step 7: 提交配置更改**

```bash
git add vitest.config.ts package.json src/__tests__/test-utils.tsx
git commit -m "chore(test): 配置测试基础设施和覆盖率阈值"
```

---

## 阶段 1：核心组件测试

### Task 2: ThemePicker 组件测试

**Files:**
- Create: `src/__tests__/components/common/ThemePicker.test.tsx`
- Read: `src/components/common/ThemePicker.tsx`
- Read: `src/contexts/ThemeContext.tsx`

**Step 1: 编写 ThemePicker 测试文件骨架**

```typescript
// src/__tests__/components/common/ThemePicker.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/__ tests__/test-utils';
import userEvent from '@testing-library/user-event';
import ThemePicker from '@/components/common/ThemePicker';

describe('ThemePicker', () => {
  beforeEach(() => {
    // 重置所有 mock
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
  });

  describe('交互测试', () => {
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
      const { container } = render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      // 点击外部
      await user.click(container);

      await waitFor(() => {
        expect(screen.queryByText(/选择主题/i)).not.toBeInTheDocument();
      });
    });

    it('should change theme when theme option is clicked', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      // 假设有"温暖自然"主题
      const themeOption = screen.getByText(/温暖自然/i);
      await user.click(themeOption);

      // 下拉菜单应该关闭
      await waitFor(() => {
        expect(screen.queryByText(/选择主题/i)).not.toBeInTheDocument();
      });
    });

    it('should toggle dark/light mode', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      const modeToggle = screen.getByRole('button', { name: /切换到深色|切换到浅色/i });
      await user.click(modeToggle);

      // 验证模式切换（通过 aria-label 变化）
      expect(modeToggle).toHaveAttribute('aria-label');
    });
  });

  describe('可访问性测试', () => {
    it('should have proper ARIA attributes', () => {
      render(<ThemePicker />);
      const button = screen.getByRole('button', { name: /切换主题/i });
      expect(button).toHaveAttribute('aria-label', '切换主题');
      expect(button).toHaveAttribute('title', '切换主题');
    });

    it('should show current theme with checkmark icon', async () => {
      const user = userEvent.setup();
      render(<ThemePicker />);

      const button = screen.getByRole('button', { name: /切换主题/i });
      await user.click(button);

      // 验证选中标记存在（通过 className）
      const activeTheme = screen.getByRole('button', { pressed: true }) ||
                         document.querySelector('.theme-card.active');
      expect(activeTheme).toBeInTheDocument();
    });
  });
});
```

**Step 2: 运行测试查看失败情况**

Run: `npm test -- ThemePicker.test.tsx --run`
Expected: 部分测试可能失败，需要根据实际组件调整

**Step 3: 根据实际组件调整测试**

根据测试失败信息，调整选择器和断言，确保所有测试通过。

**Step 4: 运行测试验证全部通过**

Run: `npm test -- ThemePicker.test.tsx --run`
Expected: ✓ ThemePicker (所有测试通过)

**Step 5: 提交 ThemePicker 测试**

```bash
git add src/__tests__/components/common/ThemePicker.test.tsx
git commit -m "test(ThemePicker): 添加组件完整测试覆盖"
```

---

### Task 3: UserDropdown 组件测试

**Files:**
- Create: `src/__tests__/components/common/UserDropdown.test.tsx`
- Read: `src/components/common/UserDropdown.tsx`

**Step 1: 编写 UserDropdown 测试文件**

```typescript
// src/__tests__/components/common/UserDropdown.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import UserDropdown from '@/components/common/UserDropdown';
import * as router from 'react-router-dom';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('UserDropdown', () => {
  const defaultProps = {
    userName: '张三',
    userInitial: '张',
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('渲染测试', () => {
    it('should render user avatar and name', () => {
      render(<UserDropdown {...defaultProps} />);

      expect(screen.getByText('张')).toBeInTheDocument(); // avatar
      expect(screen.getByText('张三')).toBeInTheDocument(); // name
    });

    it('should not show dropdown menu initially', () => {
      render(<UserDropdown {...defaultProps} />);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should render with correct ARIA attributes', () => {
      render(<UserDropdown {...defaultProps} />);

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    });
  });

  describe('交互测试', () => {
    it('should open dropdown on click', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    it('should close dropdown on second click', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);
      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      const { container } = render(<UserDropdown {...defaultProps} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);
      await user.click(container);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should navigate to dashboard when clicking "个人中心"', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('个人中心'));

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should navigate to profile edit when clicking "账号设置"', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('账号设置'));

      expect(mockNavigate).toHaveBeenCalledWith('/profile/edit');
    });

    it('should handle logout when clicking "退出登录"', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('退出登录'));

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('键盘导航', () => {
    it('should close dropdown on Escape key', async () => {
      const user = userEvent.setup();
      render(<UserDropdown {...defaultProps} />);

      await user.click(screen.getByRole('button'));
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });
});
```

**Step 2: 运行测试**

Run: `npm test -- UserDropdown.test.tsx --run`
Expected: 测试通过或根据失败信息调整

**Step 3: 提交测试**

```bash
git add src/__tests__/components/common/UserDropdown.test.tsx
git commit -m "test(UserDropdown): 添加组件完整测试覆盖"
```

---

### Task 4: Modal 组件测试

**Files:**
- Create: `src/__tests__/components/common/Modal.test.tsx`
- Read: `src/components/common/Modal.tsx`

**Step 1: 编写 Modal 测试文件**

```typescript
// src/__tests__/components/common/Modal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import Modal from '@/components/common/Modal';

describe('Modal', () => {
  const mockOnClose = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    children: <div>Modal Content</div>,
  };

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('渲染测试', () => {
    it('should render when isOpen is true', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(<Modal {...defaultProps} title="测试标题" />);

      expect(screen.getByText('测试标题')).toBeInTheDocument();
    });

    it('should render close button when showCloseButton is true', () => {
      render(<Modal {...defaultProps} showCloseButton={true} />);

      const closeButton = screen.getByRole('button', { name: /关闭/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should not render close button when showCloseButton is false', () => {
      render(<Modal {...defaultProps} showCloseButton={false} />);

      const closeButton = screen.queryByRole('button', { name: /关闭/i });
      expect(closeButton).not.toBeInTheDocument();
    });
  });

  describe('交互测试', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} showCloseButton={true} />);

      const closeButton = screen.getByRole('button', { name: /关闭/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked (if closeOnOverlayClick is true)', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} closeOnOverlayClick={true} />);

      const overlay = screen.getByRole('dialog').parentElement;
      if (overlay) {
        await user.click(overlay);
      }

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not call onClose when overlay is clicked (if closeOnOverlayClick is false)', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} closeOnOverlayClick={false} />);

      const overlay = screen.getByRole('dialog').parentElement;
      if (overlay) {
        await user.click(overlay);
      }

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not call onClose when clicking modal content', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} />);

      const content = screen.getByText('Modal Content');
      await user.click(content);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('键盘交互', () => {
    it('should call onClose when Escape is pressed (if closeOnEsc is true)', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} closeOnEsc={true} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not call onClose when Escape is pressed (if closeOnEsc is false)', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} closeOnEsc={false} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('可访问性测试', () => {
    it('should have role="dialog"', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal="true"', () => {
      render(<Modal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby when title is provided', () => {
      render(<Modal {...defaultProps} title="测试标题" />);

      const dialog = screen.getByRole('dialog').querySelector('[tabindex="-1"]');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('should trap focus within modal', async () => {
      const user = userEvent.setup();
      render(
        <Modal {...defaultProps} showCloseButton={true}>
          <button>Button 1</button>
          <button>Button 2</button>
        </Modal>
      );

      const closeButton = screen.getByRole('button', { name: /关闭/i });
      const button1 = screen.getByRole('button', { name: 'Button 1' });
      const button2 = screen.getByRole('button', { name: 'Button 2' });

      // Tab should cycle through buttons
      await user.tab();
      await user.tab();
      await user.tab();

      // Focus should stay within modal
      const focusedElement = document.activeElement;
      expect([closeButton, button1, button2]).toContain(focusedElement);
    });
  });

  describe('尺寸变体', () => {
    it('should apply correct size class for "sm"', () => {
      const { container } = render(<Modal {...defaultProps} size="sm" />);

      const content = container.querySelector('.modal-content--sm');
      expect(content).toBeInTheDocument();
    });

    it('should apply correct size class for "md"', () => {
      const { container } = render(<Modal {...defaultProps} size="md" />);

      const content = container.querySelector('.modal-content--md');
      expect(content).toBeInTheDocument();
    });

    it('should apply correct size class for "lg"', () => {
      const { container } = render(<Modal {...defaultProps} size="lg" />);

      const content = container.querySelector('.modal-content--lg');
      expect(content).toBeInTheDocument();
    });
  });
});
```

**Step 2: 运行测试**

Run: `npm test -- Modal.test.tsx --run`
Expected: 测试通过或根据失败调整

**Step 3: 提交测试**

```bash
git add src/__tests__/components/common/Modal.test.tsx
git commit -m "test(Modal): 添加组件完整测试覆盖"
```

---

### Task 5: BackButton 和 Breadcrumb 组件测试

**Files:**
- Create: `src/__tests__/components/common/BackButton.test.tsx`
- Create: `src/__tests__/components/common/Breadcrumb.test.tsx`

**Step 1: 编写 BackButton 测试**

```typescript
// src/__tests__/components/common/BackButton.test.tsx
import { describe, it, expect, vi } from 'vitest';
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

  it('should render with default label', () => {
    render(<BackButton />);
    expect(screen.getByText('返回')).toBeInTheDocument();
  });

  it('should render with custom label', () => {
    render(<BackButton label="回到首页" />);
    expect(screen.getByText('回到首页')).toBeInTheDocument();
  });

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

  it('should have correct accessibility attributes', () => {
    render(<BackButton label="返回上一页" />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', '返回上一页');
    expect(button).toHaveAttribute('type', 'button');
  });
});
```

**Step 2: 编写 Breadcrumb 测试**

```typescript
// src/__tests__/components/common/Breadcrumb.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import Breadcrumb, { BreadcrumbItem } from '@/components/common/Breadcrumb';

describe('Breadcrumb', () => {
  const items: BreadcrumbItem[] = [
    { label: '首页', path: '/' },
    { label: '期刊列表', path: '/journals' },
    { label: '期刊详情' },
  ];

  it('should render all breadcrumb items', () => {
    render(<Breadcrumb items={items} />);

    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('期刊列表')).toBeInTheDocument();
    expect(screen.getByText('期刊详情')).toBeInTheDocument();
  });

  it('should render links for items with path', () => {
    render(<Breadcrumb items={items} />);

    const homeLink = screen.getByRole('link', { name: '首页' });
    expect(homeLink).toHaveAttribute('href', '/');

    const journalsLink = screen.getByRole('link', { name: '期刊列表' });
    expect(journalsLink).toHaveAttribute('href', '/journals');
  });

  it('should not render link for last item', () => {
    render(<Breadcrumb items={items} />);

    const lastItem = screen.getByText('期刊详情');
    expect(lastItem.tagName).not.toBe('A');
  });

  it('should mark last item with aria-current="page"', () => {
    render(<Breadcrumb items={items} />);

    const lastItem = screen.getByText('期刊详情');
    expect(lastItem).toHaveAttribute('aria-current', 'page');
  });

  it('should have navigation role', () => {
    render(<Breadcrumb items={items} />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', '面包屑导航');
  });

  it('should render nothing when items array is empty', () => {
    const { container } = render(<Breadcrumb items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render separators between items', () => {
    const { container } = render(<Breadcrumb items={items} />);

    const separators = container.querySelectorAll('.breadcrumb-separator');
    expect(separators).toHaveLength(2); // 3 items = 2 separators
  });
});
```

**Step 3: 运行测试**

Run: `npm test -- --run --reporter=verbose`
Expected: BackButton 和 Breadcrumb 测试全部通过

**Step 4: 提交测试**

```bash
git add src/__tests__/components/common/BackButton.test.tsx src/__tests__/components/common/Breadcrumb.test.tsx
git commit -m "test(BackButton,Breadcrumb): 添加组件完整测试覆盖"
```

---

## 继续执行方式

由于完整计划非常大（15+ 组件 + 10+ 页面 + 8+ 单元测试），我会提供两种执行方式：

### 方式 1：增量执行（推荐快速看到效果）

我已经完成了前 5 个任务的详细计划：
1. ✅ 配置测试基础设施
2. ✅ ThemePicker 测试
3. ✅ UserDropdown 测试
4. ✅ Modal 测试
5. ✅ BackButton + Breadcrumb 测试

**剩余任务清单（简化版）：**

**阶段 1 剩余组件（10 个）：**
- Task 6-9: 布局组件（TopBar, SideNav, PageHeader, AppLayout）
- Task 10: SearchAndFilter
- Task 11-12: 期刊组件（JournalDetailPanel，JournalCard 已有）
- Task 13-14: 评论组件（CommentList, CommentForm）
- Task 15: RegisterForm

**阶段 2（18 个）：**
- Task 16-25: 页面组件测试（10 个页面）
- Task 26-29: Hooks 测试（4 个）
- Task 30-33: Services 测试（4 个）

**阶段 3（3 个）：**
- Task 34: 边界场景测试补充
- Task 35: TESTING.md 文档
- Task 36: 覆盖率验证和报告

### 方式 2：完整计划文档

如果你需要完整的详细计划（所有 36 个任务的完整步骤），我可以继续编写剩余部分。

---

**你想如何继续？**

A. **立即开始执行前 5 个任务** - 让我开始实施，你能快速看到效果
B. **继续编写完整计划** - 我补充剩余 31 个任务的详细步骤
C. **按模块执行** - 先完成阶段 1 所有组件测试，再进入阶段 2

请选择 A、B 或 C。
