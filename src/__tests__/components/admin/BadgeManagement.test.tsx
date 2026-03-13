import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import BadgeManagement from '@/features/admin/components/BadgeManagement';

// Mock PageContext
vi.mock('@/contexts/PageContext', () => ({
  usePageTitle: vi.fn(),
}));

// Mock badge service
vi.mock('@/services/badgeService', () => ({
  adminGetAllBadges: vi.fn(),
  grantBadge: vi.fn(),
}));

// Mock admin service
vi.mock('@/services/adminService', () => ({
  adminService: {
    getUsers: vi.fn(),
  },
}));

import { adminGetAllBadges, grantBadge } from '@/services/badgeService';
import { adminService } from '@/services/adminService';

const mockBadges = [
  {
    id: 1,
    code: 'pioneer',
    name: '先驱者',
    description: '平台早期用户',
    icon: '🌟',
    color: '#FFD700',
    category: 'honor',
    type: 'manual',
    triggerCondition: null,
    priority: 100,
    isActive: true,
    createdAt: '2024-01-01',
    holderCount: 5,
  },
  {
    id: 2,
    code: 'commenter',
    name: '评论达人',
    description: '发表10条评论',
    icon: '💬',
    color: '#4CAF50',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'commentCount', threshold: 10 },
    priority: 50,
    isActive: true,
    createdAt: '2024-01-01',
    holderCount: 20,
  },
];

const mockUsers = [
  { id: 1, email: 'user1@test.com', name: 'User One', role: 'user', status: 'active', createdAt: '2024-01-01', commentCount: 5 },
  { id: 2, email: 'user2@test.com', name: 'User Two', role: 'user', status: 'active', createdAt: '2024-01-02', commentCount: 3 },
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <BadgeManagement />
    </BrowserRouter>
  );
};

describe('BadgeManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (adminGetAllBadges as Mock).mockResolvedValue(mockBadges);
    (adminService.getUsers as Mock).mockResolvedValue({
      users: mockUsers,
      pagination: { currentPage: 1, totalPages: 1, totalItems: 2, itemsPerPage: 100 },
    });
  });

  it('renders loading state initially', () => {
    renderComponent();
    expect(screen.getByText('正在载入全局荣誉数据...')).toBeInTheDocument();
  });

  it('renders badge management page after loading', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('徽章与荣誉总控台')).toBeInTheDocument();
    });

    expect(screen.getByText('签发特别荣誉')).toBeInTheDocument();
    expect(screen.getByText('全站体系数据总览')).toBeInTheDocument();
  });

  it('displays badges table with correct data', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('先驱者')).toBeInTheDocument();
    });

    expect(screen.getByText('评论达人')).toBeInTheDocument();
    expect(screen.getByText('5 位')).toBeInTheDocument();
    expect(screen.getByText('20 位')).toBeInTheDocument();
  });

  it('filters manual badges in the grant dropdown', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('徽章与荣誉总控台')).toBeInTheDocument();
    });

    const badgeSelect = screen.getByRole('combobox', { name: /授予荣誉徽章/i });
    expect(badgeSelect).toBeInTheDocument();

    // Should contain manual badge (先驱者) as option
    const options = badgeSelect.querySelectorAll('option');
    const manualBadgeOption = Array.from(options).find(opt => opt.textContent?.includes('先驱者'));
    expect(manualBadgeOption).toBeTruthy();
  });

  it('displays user selection dropdown', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('徽章与荣誉总控台')).toBeInTheDocument();
    });

    const userSelect = screen.getByRole('combobox', { name: /接受荣誉的用户/i });
    expect(userSelect).toBeInTheDocument();

    // Should contain users as options
    const options = userSelect.querySelectorAll('option');
    const userOption = Array.from(options).find(opt => opt.textContent?.includes('User One'));
    expect(userOption).toBeTruthy();
  });

  it('disables submit button when no selection made', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('徽章与荣誉总控台')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /立即签发/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when both badge and user selected', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('徽章与荣誉总控台')).toBeInTheDocument();
    });

    const badgeSelect = screen.getByRole('combobox', { name: /授予荣誉徽章/i });
    const userSelect = screen.getByRole('combobox', { name: /接受荣誉的用户/i });

    await user.selectOptions(badgeSelect, '1');
    await user.selectOptions(userSelect, '1');

    const submitButton = screen.getByRole('button', { name: /立即签发/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('grants badge successfully', async () => {
    const user = userEvent.setup();
    (grantBadge as Mock).mockResolvedValue(undefined);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('徽章与荣誉总控台')).toBeInTheDocument();
    });

    const badgeSelect = screen.getByRole('combobox', { name: /授予荣誉徽章/i });
    const userSelect = screen.getByRole('combobox', { name: /接受荣誉的用户/i });

    await user.selectOptions(badgeSelect, '1');
    await user.selectOptions(userSelect, '1');

    const submitButton = screen.getByRole('button', { name: /立即签发/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(grantBadge).toHaveBeenCalledWith(1, 1);
    });

    await waitFor(() => {
      expect(screen.getByText('荣誉徽章颁发成功！')).toBeInTheDocument();
    });
  });

  it('displays error message on grant failure', async () => {
    const user = userEvent.setup();
    (grantBadge as Mock).mockRejectedValue({
      response: { data: { message: '用户已拥有该徽章' } },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('徽章与荣誉总控台')).toBeInTheDocument();
    });

    const badgeSelect = screen.getByRole('combobox', { name: /授予荣誉徽章/i });
    const userSelect = screen.getByRole('combobox', { name: /接受荣誉的用户/i });

    await user.selectOptions(badgeSelect, '1');
    await user.selectOptions(userSelect, '1');

    const submitButton = screen.getByRole('button', { name: /立即签发/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('用户已拥有该徽章')).toBeInTheDocument();
    });
  });

  it('displays error when fetch fails', async () => {
    (adminGetAllBadges as Mock).mockRejectedValue(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('获取数据失败')).toBeInTheDocument();
    });
  });

  it('shows auto vs manual badge type correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('先驱者')).toBeInTheDocument();
    });

    // Check for type badges
    expect(screen.getByText('手动颁发')).toBeInTheDocument();
    expect(screen.getByText('自动触发')).toBeInTheDocument();
  });

  it('displays trigger conditions for auto badges', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('先驱者')).toBeInTheDocument();
    });

    // Auto badge should show condition
    expect(screen.getByText(/commentCount.*10/)).toBeInTheDocument();

    // Manual badge should show no condition
    expect(screen.getByText('无条件限制')).toBeInTheDocument();
  });

  it('displays badge status correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('先驱者')).toBeInTheDocument();
    });

    // Both badges are active
    const activeStatuses = screen.getAllByText('启用中');
    expect(activeStatuses.length).toBeGreaterThanOrEqual(2);
  });
});
