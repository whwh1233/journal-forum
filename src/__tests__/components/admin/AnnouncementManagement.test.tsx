import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnnouncementManagement from '@/features/admin/components/AnnouncementManagement';

vi.mock('@/contexts/PageContext', () => ({ usePageTitle: vi.fn() }));
vi.mock('@/features/announcements/services/announcementService', () => ({
  adminGetAnnouncements: vi.fn(),
  adminPublishAnnouncement: vi.fn(),
  adminArchiveAnnouncement: vi.fn(),
  adminDeleteAnnouncement: vi.fn(),
}));
vi.mock('@/features/admin/components/AnnouncementForm', () => ({
  default: ({ onSuccess, onCancel }: any) => (
    <div data-testid="announcement-form">
      <button onClick={onSuccess}>form-success</button>
      <button onClick={onCancel}>form-cancel</button>
    </div>
  ),
}));

import { adminGetAnnouncements, adminPublishAnnouncement, adminArchiveAnnouncement, adminDeleteAnnouncement } from '@/features/announcements/services/announcementService';

const mockAnnouncements = [
  {
    id: 'a1', title: '系统维护', content: 'c1', type: 'normal',
    status: 'draft', targetType: 'all', colorScheme: 'info', isPinned: true,
    priority: 10, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
    creatorId: 'c1', creatorName: 'Admin', isRead: false, readCount: 50, readPercentage: 75,
  },
  {
    id: 'a2', title: '新功能上线', content: 'c2', type: 'urgent',
    status: 'active', targetType: 'all', colorScheme: 'warning', isPinned: false,
    priority: 5, createdAt: '2024-01-02T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z',
    creatorId: 'c1', creatorName: 'Admin', isRead: false, readCount: 100, readPercentage: 50,
  },
  {
    id: 'a3', title: '归档公告', content: 'c3', type: 'banner',
    status: 'archived', targetType: 'all', colorScheme: 'info', isPinned: false,
    priority: 0, createdAt: '2024-01-03T00:00:00Z', updatedAt: '2024-01-03T00:00:00Z',
    creatorId: 'c1', isRead: false, readCount: 0, readPercentage: 0,
  },
];

describe('AnnouncementManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (adminGetAnnouncements as Mock).mockResolvedValue({
      announcements: mockAnnouncements,
      pagination: { total: 3, pages: 1, page: 1, limit: 20 },
    });
  });

  it('shows loading', () => {
    render(<AnnouncementManagement />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders list', async () => {
    render(<AnnouncementManagement />);
    await waitFor(() => { expect(screen.getByText('系统维护')).toBeInTheDocument(); });
    expect(screen.getByText('新功能上线')).toBeInTheDocument();
    expect(screen.getByText('归档公告')).toBeInTheDocument();
  });

  it('shows status labels', async () => {
    render(<AnnouncementManagement />);
    await waitFor(() => { expect(screen.getByText('系统维护')).toBeInTheDocument(); });
    expect(screen.getAllByText('草稿').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('生效中').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('已归档').length).toBeGreaterThanOrEqual(1);
  });

  it('shows type labels', async () => {
    render(<AnnouncementManagement />);
    await waitFor(() => { expect(screen.getByText('系统维护')).toBeInTheDocument(); });
    expect(screen.getByText('普通')).toBeInTheDocument();
    expect(screen.getByText('紧急')).toBeInTheDocument();
    expect(screen.getByText('横幅')).toBeInTheDocument();
  });

  it('shows pinned badge', async () => {
    render(<AnnouncementManagement />);
    await waitFor(() => { expect(screen.getByText('系统维护')).toBeInTheDocument(); });
    expect(screen.getByText('置顶')).toBeInTheDocument();
  });

  it('shows filter tabs', async () => {
    render(<AnnouncementManagement />);
    await waitFor(() => { expect(screen.getByText('系统维护')).toBeInTheDocument(); });
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('定时发布')).toBeInTheDocument();
  });

  it('opens create form', async () => {
    const user = userEvent.setup();
    render(<AnnouncementManagement />);
    await waitFor(() => { expect(screen.getByText('系统维护')).toBeInTheDocument(); });
    await user.click(screen.getByText('新建公告'));
    expect(screen.getByTestId('announcement-form')).toBeInTheDocument();
  });

  it('closes form on cancel', async () => {
    const user = userEvent.setup();
    render(<AnnouncementManagement />);
    await waitFor(() => { expect(screen.getByText('系统维护')).toBeInTheDocument(); });
    await user.click(screen.getByText('新建公告'));
    await user.click(screen.getByText('form-cancel'));
    await waitFor(() => { expect(screen.queryByTestId('announcement-form')).not.toBeInTheDocument(); });
  });

  it('shows delete confirm', async () => {
    const user = userEvent.setup();
    render(<AnnouncementManagement />);
    await waitFor(() => { expect(screen.getByText('系统维护')).toBeInTheDocument(); });
    const deleteButtons = screen.getAllByTitle('删除');
    await user.click(deleteButtons[0]);
    expect(screen.getAllByText('确认删除').length).toBeGreaterThanOrEqual(1);
  });

  it('handles publish', async () => {
    const user = userEvent.setup();
    (adminPublishAnnouncement as Mock).mockResolvedValue(undefined);
    render(<AnnouncementManagement />);
    await waitFor(() => { expect(screen.getByText('系统维护')).toBeInTheDocument(); });
    await user.click(screen.getByTitle('发布'));
    await waitFor(() => { expect(adminPublishAnnouncement).toHaveBeenCalledWith('a1'); });
  });

  it('handles archive', async () => {
    const user = userEvent.setup();
    (adminArchiveAnnouncement as Mock).mockResolvedValue(undefined);
    render(<AnnouncementManagement />);
    await waitFor(() => { expect(screen.getByText('新功能上线')).toBeInTheDocument(); });
    await user.click(screen.getByTitle('归档'));
    await waitFor(() => { expect(adminArchiveAnnouncement).toHaveBeenCalledWith('a2'); });
  });

  it('confirms delete', async () => {
    const user = userEvent.setup();
    (adminDeleteAnnouncement as Mock).mockResolvedValue(undefined);
    render(<AnnouncementManagement />);
    await waitFor(() => { expect(screen.getByText('系统维护')).toBeInTheDocument(); });
    const deleteButtons = screen.getAllByTitle('删除');
    await user.click(deleteButtons[0]);
    const confirmBtns = screen.getAllByText('确认删除');
    await user.click(confirmBtns[confirmBtns.length - 1]);
    await waitFor(() => { expect(adminDeleteAnnouncement).toHaveBeenCalled(); });
  });

  it('shows fetch error', async () => {
    (adminGetAnnouncements as Mock).mockRejectedValue({ response: { data: { message: '获取公告失败' } } });
    render(<AnnouncementManagement />);
    await waitFor(() => { expect(screen.getByText('获取公告失败')).toBeInTheDocument(); });
  });

  it('shows empty state', async () => {
    (adminGetAnnouncements as Mock).mockResolvedValue({ announcements: [], pagination: { total: 0, pages: 0, page: 1, limit: 20 } });
    render(<AnnouncementManagement />);
    await waitFor(() => { expect(screen.getByText('暂无公告')).toBeInTheDocument(); });
  });

  it('shows read percentage', async () => {
    render(<AnnouncementManagement />);
    await waitFor(() => { expect(screen.getByText('系统维护')).toBeInTheDocument(); });
    expect(screen.getByText(/50.*(75%)/)).toBeInTheDocument();
  });
});
