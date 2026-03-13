import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import UserManagement from '@/features/admin/components/UserManagement';

// Mock PageContext
vi.mock('@/contexts/PageContext', () => ({
  usePageTitle: vi.fn(),
}));

// Mock admin service
vi.mock('@/services/adminService', () => ({
  adminService: {
    getUsers: vi.fn(),
    updateUserStatus: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

import { adminService } from '@/services/adminService';

const mockUsers = [
  {
    id: 1,
    email: 'user1@test.com',
    name: 'User One',
    role: 'user',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    commentCount: 10,
  },
  {
    id: 2,
    email: 'user2@test.com',
    name: 'User Two',
    role: 'user',
    status: 'disabled',
    createdAt: '2024-01-16T14:20:00Z',
    commentCount: 5,
  },
  {
    id: 3,
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    commentCount: 25,
  },
];

const mockPagination = {
  currentPage: 1,
  totalPages: 2,
  totalItems: 15,
  itemsPerPage: 10,
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <UserManagement />
    </BrowserRouter>
  );
};

describe('UserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (adminService.getUsers as Mock).mockResolvedValue({
      users: mockUsers,
      pagination: mockPagination,
    });
  });

  it('renders loading state initially', () => {
    renderComponent();
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders users table after loading', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    expect(screen.getByText('user2@test.com')).toBeInTheDocument();
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
  });

  it('displays user information correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    // Check comment counts
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('displays role badges correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    // Check role badges
    const userBadges = screen.getAllByText('普通用户');
    expect(userBadges.length).toBe(2);
    expect(screen.getByText('管理员')).toBeInTheDocument();
  });

  it('displays status badges correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    // Check status badges
    const activeStatuses = screen.getAllByText('正常');
    expect(activeStatuses.length).toBe(2);
    expect(screen.getByText('已禁用')).toBeInTheDocument();
  });

  it('displays search input and button', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索用户邮箱...')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: '搜索' })).toBeInTheDocument();
  });

  it('handles search submission', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索用户邮箱...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('搜索用户邮箱...');
    const searchButton = screen.getByRole('button', { name: '搜索' });

    await user.type(searchInput, 'user1');
    await user.click(searchButton);

    await waitFor(() => {
      expect(adminService.getUsers).toHaveBeenCalledWith('user1', 1);
    });
  });

  it('toggles user status from active to disabled', async () => {
    const user = userEvent.setup();
    (adminService.updateUserStatus as Mock).mockResolvedValue(undefined);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    // Find the "禁用" button for the first active user
    const disableButtons = screen.getAllByRole('button', { name: '禁用' });
    await user.click(disableButtons[0]);

    await waitFor(() => {
      expect(adminService.updateUserStatus).toHaveBeenCalledWith(1, 'disabled');
    });
  });

  it('toggles user status from disabled to active', async () => {
    const user = userEvent.setup();
    (adminService.updateUserStatus as Mock).mockResolvedValue(undefined);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('user2@test.com')).toBeInTheDocument();
    });

    // Find the "启用" button for the disabled user
    const enableButton = screen.getByRole('button', { name: '启用' });
    await user.click(enableButton);

    await waitFor(() => {
      expect(adminService.updateUserStatus).toHaveBeenCalledWith(2, 'active');
    });
  });

  it('does not show action buttons for admin users', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    });

    // Admin row should not have action buttons
    const adminRow = screen.getByText('admin@test.com').closest('tr');
    const actionsCell = adminRow?.querySelector('.actions-cell');

    // The actions cell for admin should be empty (no buttons)
    expect(actionsCell?.children.length).toBe(0);
  });

  it('handles user deletion with confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    (adminService.deleteUser as Mock).mockResolvedValue(undefined);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: '删除' });
    await user.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('user1@test.com'));
    expect(adminService.deleteUser).toHaveBeenCalledWith(1);

    confirmSpy.mockRestore();
  });

  it('does not delete when user cancels confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: '删除' });
    await user.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(adminService.deleteUser).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('displays error on status update failure', async () => {
    const user = userEvent.setup();
    (adminService.updateUserStatus as Mock).mockRejectedValue(new Error('更新用户状态失败'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    const disableButtons = screen.getAllByRole('button', { name: '禁用' });
    await user.click(disableButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('更新用户状态失败')).toBeInTheDocument();
    });
  });

  it('displays error on delete failure', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    (adminService.deleteUser as Mock).mockRejectedValue(new Error('删除用户失败'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: '删除' });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('删除用户失败')).toBeInTheDocument();
    });
  });

  it('displays pagination controls when multiple pages', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('第 1 / 2 页')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: '上一页' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一页' })).toBeInTheDocument();
  });

  it('disables previous button on first page', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('第 1 / 2 页')).toBeInTheDocument();
    });

    const prevButton = screen.getByRole('button', { name: '上一页' });
    expect(prevButton).toBeDisabled();
  });

  it('handles page navigation', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('第 1 / 2 页')).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: '下一页' });
    await user.click(nextButton);

    await waitFor(() => {
      expect(adminService.getUsers).toHaveBeenCalledWith('', 2);
    });
  });

  it('disables next button on last page', async () => {
    const user = userEvent.setup();

    // First load
    (adminService.getUsers as Mock).mockResolvedValue({
      users: mockUsers,
      pagination: { currentPage: 1, totalPages: 2, totalItems: 15, itemsPerPage: 10 },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('第 1 / 2 页')).toBeInTheDocument();
    });

    // Navigate to page 2
    (adminService.getUsers as Mock).mockResolvedValue({
      users: mockUsers,
      pagination: { currentPage: 2, totalPages: 2, totalItems: 15, itemsPerPage: 10 },
    });

    const nextButton = screen.getByRole('button', { name: '下一页' });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('第 2 / 2 页')).toBeInTheDocument();
    });

    // Now the next button should be disabled
    const nextButtonAfter = screen.getByRole('button', { name: '下一页' });
    expect(nextButtonAfter).toBeDisabled();
  });

  it('displays empty message when no users', async () => {
    (adminService.getUsers as Mock).mockResolvedValue({
      users: [],
      pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('暂无用户数据')).toBeInTheDocument();
    });
  });

  it('does not show pagination when only one page', async () => {
    (adminService.getUsers as Mock).mockResolvedValue({
      users: mockUsers,
      pagination: { currentPage: 1, totalPages: 1, totalItems: 3, itemsPerPage: 10 },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    expect(screen.queryByText(/第 \d+ \/ \d+ 页/)).not.toBeInTheDocument();
  });

  it('displays error message on fetch failure', async () => {
    (adminService.getUsers as Mock).mockRejectedValue(new Error('获取用户列表失败'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('获取用户列表失败')).toBeInTheDocument();
    });
  });

  it('resets to page 1 when searching', async () => {
    const user = userEvent.setup();

    // Start on page 2
    (adminService.getUsers as Mock).mockResolvedValue({
      users: mockUsers,
      pagination: { currentPage: 2, totalPages: 3, totalItems: 25, itemsPerPage: 10 },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    // Reset mock to check search call
    (adminService.getUsers as Mock).mockClear();
    (adminService.getUsers as Mock).mockResolvedValue({
      users: mockUsers,
      pagination: mockPagination,
    });

    const searchInput = screen.getByPlaceholderText('搜索用户邮箱...');
    const searchButton = screen.getByRole('button', { name: '搜索' });

    await user.type(searchInput, 'test');
    await user.click(searchButton);

    await waitFor(() => {
      expect(adminService.getUsers).toHaveBeenCalledWith('test', 1);
    });
  });

  it('formats date correctly in Chinese locale', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    // Check that dates are formatted (format: YYYY/MM/DD)
    const dateElements = screen.getAllByText(/2024/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('displays table headers correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('邮箱')).toBeInTheDocument();
    });

    expect(screen.getByText('角色')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
    expect(screen.getByText('评论数')).toBeInTheDocument();
    expect(screen.getByText('注册时间')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
  });

  it('refreshes user list after successful status toggle', async () => {
    const user = userEvent.setup();
    (adminService.updateUserStatus as Mock).mockResolvedValue(undefined);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    // Clear the mock to track the refresh call
    (adminService.getUsers as Mock).mockClear();
    (adminService.getUsers as Mock).mockResolvedValue({
      users: mockUsers,
      pagination: mockPagination,
    });

    const disableButtons = screen.getAllByRole('button', { name: '禁用' });
    await user.click(disableButtons[0]);

    await waitFor(() => {
      expect(adminService.getUsers).toHaveBeenCalled();
    });
  });

  it('refreshes user list after successful deletion', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    (adminService.deleteUser as Mock).mockResolvedValue(undefined);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    // Clear the mock to track the refresh call
    (adminService.getUsers as Mock).mockClear();
    (adminService.getUsers as Mock).mockResolvedValue({
      users: mockUsers,
      pagination: mockPagination,
    });

    const deleteButtons = screen.getAllByRole('button', { name: '删除' });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(adminService.getUsers).toHaveBeenCalled();
    });
  });
});
