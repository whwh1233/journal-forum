import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '@/features/admin/components/Dashboard';

// Mock PageContext
vi.mock('@/contexts/PageContext', () => ({
  usePageTitle: vi.fn(),
}));

// Mock admin service
vi.mock('@/services/adminService', () => ({
  adminService: {
    getStats: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { adminService } from '@/services/adminService';

const mockStats = {
  userCount: 150,
  journalCount: 45,
  commentCount: 320,
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (adminService.getStats as Mock).mockResolvedValue(mockStats);
  });

  it('renders loading state initially', () => {
    renderComponent();
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders dashboard with stats after loading', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('320')).toBeInTheDocument();
  });

  it('displays stat labels correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('用户总数')).toBeInTheDocument();
    });

    expect(screen.getByText('期刊总数')).toBeInTheDocument();
    expect(screen.getByText('评论总数')).toBeInTheDocument();
  });

  it('displays quick actions section', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('快捷操作')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /用户管理/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /期刊管理/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /评论管理/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /徽章与荣誉/i })).toBeInTheDocument();
  });

  it('navigates to users page when user stat card clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    const userStatCard = screen.getByText('用户总数').closest('.stat-card');
    if (userStatCard) {
      await user.click(userStatCard);
    }

    expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
  });

  it('navigates to journals page when journal stat card clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    const journalStatCard = screen.getByText('期刊总数').closest('.stat-card');
    if (journalStatCard) {
      await user.click(journalStatCard);
    }

    expect(mockNavigate).toHaveBeenCalledWith('/admin/journals');
  });

  it('navigates to comments page when comment stat card clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('320')).toBeInTheDocument();
    });

    const commentStatCard = screen.getByText('评论总数').closest('.stat-card');
    if (commentStatCard) {
      await user.click(commentStatCard);
    }

    expect(mockNavigate).toHaveBeenCalledWith('/admin/comments');
  });

  it('navigates to badges page when badge stat card clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('荣誉系统')).toBeInTheDocument();
    });

    const badgeStatCard = screen.getByText('荣誉系统').closest('.stat-card');
    if (badgeStatCard) {
      await user.click(badgeStatCard);
    }

    expect(mockNavigate).toHaveBeenCalledWith('/admin/badges');
  });

  it('navigates via quick action buttons', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /用户管理/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /用户管理/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/users');

    await user.click(screen.getByRole('button', { name: /期刊管理/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/journals');

    await user.click(screen.getByRole('button', { name: /评论管理/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/comments');

    await user.click(screen.getByRole('button', { name: /徽章与荣誉/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/badges');
  });

  it('displays error message on fetch failure', async () => {
    (adminService.getStats as Mock).mockRejectedValue(new Error('获取统计数据失败'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('获取统计数据失败')).toBeInTheDocument();
    });
  });

  it('handles zero counts gracefully', async () => {
    (adminService.getStats as Mock).mockResolvedValue({
      userCount: 0,
      journalCount: 0,
      commentCount: 0,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(3);
    });
  });

  it('handles null stats gracefully', async () => {
    (adminService.getStats as Mock).mockResolvedValue(null);

    renderComponent();

    await waitFor(() => {
      // Should show 0 for all counts when stats is null
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('displays icons for each stat card', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('用户总数')).toBeInTheDocument();
    });

    // Verify the stat-icon elements exist
    const statIcons = document.querySelectorAll('.stat-icon');
    expect(statIcons.length).toBeGreaterThanOrEqual(4);
  });

  it('displays icons for quick action buttons', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /用户管理/i })).toBeInTheDocument();
    });

    // Verify the action-icon elements exist
    const actionIcons = document.querySelectorAll('.action-icon');
    expect(actionIcons.length).toBeGreaterThanOrEqual(4);
  });
});
