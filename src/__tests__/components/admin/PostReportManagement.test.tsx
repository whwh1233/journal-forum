import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostReportManagement from '@/features/admin/components/PostReportManagement';

const mockReports = [
  {
    id: 1, postId: 101, postTitle: '违规帖子', postContent: '违规内容',
    reporterId: 'r1', reporterName: '张三', reporterEmail: 'zhang@test.com',
    reason: '内容不当', status: 'pending' as const,
    createdAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 2, postId: 102, postTitle: '已处理帖子', postContent: '已处理内容',
    reporterId: 'r2', reporterName: '李四', reporterEmail: 'li@test.com',
    reason: '垃圾广告', status: 'reviewed' as const,
    createdAt: '2024-01-02T10:00:00Z', reviewedAt: '2024-01-03T10:00:00Z',
    adminNote: '已删除',
  },
];
const mockPagination = { currentPage: 1, totalPages: 1, totalItems: 2, itemsPerPage: 10 };

describe('PostReportManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'mock-token'), setItem: vi.fn(), removeItem: vi.fn() });
    vi.stubGlobal('alert', vi.fn());
    vi.stubGlobal('confirm', vi.fn(() => true));
    vi.stubGlobal('fetch', vi.fn());
  });

  const setupFetchSuccess = () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { reports: mockReports, pagination: mockPagination } }),
    });
  };

  it('shows loading', () => {
    (global.fetch as any).mockReturnValue(new Promise(() => {}));
    render(<PostReportManagement />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders table', async () => {
    setupFetchSuccess();
    render(<PostReportManagement />);
    await waitFor(() => { expect(screen.getByText('违规帖子')).toBeInTheDocument(); });
    expect(screen.getByText('已处理帖子')).toBeInTheDocument();
    expect(screen.getByText('帖子举报管理')).toBeInTheDocument();
  });

  it('shows stats', async () => {
    setupFetchSuccess();
    render(<PostReportManagement />);
    await waitFor(() => { expect(screen.getByText(/总计.*2.*条举报/)).toBeInTheDocument(); });
  });

  it('shows reporter info', async () => {
    setupFetchSuccess();
    render(<PostReportManagement />);
    await waitFor(() => { expect(screen.getByText('张三')).toBeInTheDocument(); });
    expect(screen.getByText('zhang@test.com')).toBeInTheDocument();
  });

  it('shows status badges', async () => {
    setupFetchSuccess();
    render(<PostReportManagement />);
    await waitFor(() => { expect(screen.getByText('待处理')).toBeInTheDocument(); });
    expect(screen.getByText('已处理')).toBeInTheDocument();
  });

  it('shows reasons', async () => {
    setupFetchSuccess();
    render(<PostReportManagement />);
    await waitFor(() => { expect(screen.getByText('内容不当')).toBeInTheDocument(); });
    expect(screen.getByText('垃圾广告')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    (global.fetch as any).mockResolvedValue({ ok: false });
    render(<PostReportManagement />);
    await waitFor(() => { expect(screen.getByText('Failed to fetch reports')).toBeInTheDocument(); });
  });

  it('shows retry button', async () => {
    (global.fetch as any).mockResolvedValue({ ok: false });
    render(<PostReportManagement />);
    await waitFor(() => { expect(screen.getByText('重试')).toBeInTheDocument(); });
  });

  it('shows filter', async () => {
    setupFetchSuccess();
    render(<PostReportManagement />);
    await waitFor(() => { expect(screen.getByText('违规帖子')).toBeInTheDocument(); });
    expect(screen.getByText('全部状态')).toBeInTheDocument();
  });

  it('opens detail modal', async () => {
    setupFetchSuccess();
    const user = userEvent.setup();
    render(<PostReportManagement />);
    await waitFor(() => { expect(screen.getByText('违规帖子')).toBeInTheDocument(); });
    const viewButtons = screen.getAllByTitle('查看详情');
    await user.click(viewButtons[0]);
    expect(screen.getByText('举报详情')).toBeInTheDocument();
  });

  it('closes detail modal', async () => {
    setupFetchSuccess();
    const user = userEvent.setup();
    render(<PostReportManagement />);
    await waitFor(() => { expect(screen.getByText('违规帖子')).toBeInTheDocument(); });
    await user.click(screen.getAllByTitle('查看详情')[0]);
    expect(screen.getByText('举报详情')).toBeInTheDocument();
    await user.click(screen.getByText('关闭'));
    await waitFor(() => { expect(screen.queryByText('举报详情')).not.toBeInTheDocument(); });
  });

  it('handles delete post', async () => {
    setupFetchSuccess();
    const user = userEvent.setup();
    render(<PostReportManagement />);
    await waitFor(() => { expect(screen.getByText('违规帖子')).toBeInTheDocument(); });
    (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({}) });
    await user.click(screen.getByTitle('删除帖子'));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/post-reports/1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  it('toggles selection', async () => {
    setupFetchSuccess();
    const user = userEvent.setup();
    render(<PostReportManagement />);
    await waitFor(() => { expect(screen.getByText('违规帖子')).toBeInTheDocument(); });
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);
    expect(checkboxes[1]).toBeChecked();
  });

  it('selects all', async () => {
    setupFetchSuccess();
    const user = userEvent.setup();
    render(<PostReportManagement />);
    await waitFor(() => { expect(screen.getByText('违规帖子')).toBeInTheDocument(); });
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).toBeChecked();
  });

  it('shows batch actions', async () => {
    setupFetchSuccess();
    const user = userEvent.setup();
    render(<PostReportManagement />);
    await waitFor(() => { expect(screen.getByText('违规帖子')).toBeInTheDocument(); });
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    expect(screen.getByText(/已选择.*2.*条/)).toBeInTheDocument();
    expect(screen.getByText('批量删除帖子')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { reports: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 } } }),
    });
    render(<PostReportManagement />);
    await waitFor(() => { expect(screen.getByText('暂无举报记录')).toBeInTheDocument(); });
  });
});
