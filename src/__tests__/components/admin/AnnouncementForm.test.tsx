import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnnouncementForm from '@/features/admin/components/AnnouncementForm';

vi.mock('@/contexts/PageContext', () => ({ usePageTitle: vi.fn() }));
vi.mock('dompurify', () => ({ default: { sanitize: (html: string) => html } }));
vi.mock('marked', () => ({ marked: { parse: (text: string) => '<p>' + text + '</p>' } }));
vi.mock('@/features/announcements/services/announcementService', () => ({
  adminCreateAnnouncement: vi.fn(),
  adminUpdateAnnouncement: vi.fn(),
  adminPublishAnnouncement: vi.fn(),
}));
vi.mock('@/services/adminService', () => ({ adminService: { getUsers: vi.fn() } }));

import { adminCreateAnnouncement, adminUpdateAnnouncement, adminPublishAnnouncement } from '@/features/announcements/services/announcementService';
import { adminService } from '@/services/adminService';

const mockOnSuccess = vi.fn();
const mockOnCancel = vi.fn();
const mockAnnouncement = {
  id: 'ann-1', title: '测试公告', content: '测试内容',
  type: 'normal' as const, status: 'draft' as const, targetType: 'all' as const,
  colorScheme: 'info' as const, isPinned: false, priority: 0,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  creatorId: 'creator-1', isRead: false,
};

describe('AnnouncementForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (adminService.getUsers as Mock).mockResolvedValue({ users: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 } });
  });

  it('renders new form', () => {
    render(<AnnouncementForm announcement={null} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    expect(screen.getByText('新建公告')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入公告标题')).toBeInTheDocument();
  });

  it('renders edit form', () => {
    render(<AnnouncementForm announcement={mockAnnouncement} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    expect(screen.getByText('编辑公告')).toBeInTheDocument();
    expect(screen.getByDisplayValue('测试公告')).toBeInTheDocument();
  });

  it('calls onCancel on back', async () => {
    const user = userEvent.setup();
    render(<AnnouncementForm announcement={null} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    await user.click(screen.getByText('返回'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel on cancel', async () => {
    const user = userEvent.setup();
    render(<AnnouncementForm announcement={null} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    await user.click(screen.getByText('取消'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('shows error on empty save', async () => {
    const user = userEvent.setup();
    render(<AnnouncementForm announcement={null} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    await user.click(screen.getByText('保存草稿'));
    expect(screen.getByText('标题和内容不能为空')).toBeInTheDocument();
  });

  it('saves draft', async () => {
    const user = userEvent.setup();
    (adminCreateAnnouncement as Mock).mockResolvedValue({ id: 'new-id' });
    render(<AnnouncementForm announcement={null} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    await user.type(screen.getByPlaceholderText('请输入公告标题'), 'Title');
    await user.type(screen.getByPlaceholderText('支持 Markdown 格式'), 'Content');
    await user.click(screen.getByText('保存草稿'));
    await waitFor(() => { expect(adminCreateAnnouncement).toHaveBeenCalled(); });
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });

  it('updates announcement', async () => {
    const user = userEvent.setup();
    (adminUpdateAnnouncement as Mock).mockResolvedValue(undefined);
    render(<AnnouncementForm announcement={mockAnnouncement} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    await user.clear(screen.getByDisplayValue('测试公告'));
    await user.type(screen.getByPlaceholderText('请输入公告标题'), 'Updated');
    await user.click(screen.getByText('保存草稿'));
    await waitFor(() => { expect(adminUpdateAnnouncement).toHaveBeenCalledWith('ann-1', expect.objectContaining({ title: 'Updated' })); });
  });

  it('publishes announcement', async () => {
    const user = userEvent.setup();
    (adminCreateAnnouncement as Mock).mockResolvedValue({ id: 'pub-id' });
    (adminPublishAnnouncement as Mock).mockResolvedValue(undefined);
    render(<AnnouncementForm announcement={null} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    await user.type(screen.getByPlaceholderText('请输入公告标题'), 'T');
    await user.type(screen.getByPlaceholderText('支持 Markdown 格式'), 'C');
    await user.click(screen.getByText('立即发布'));
    await waitFor(() => { expect(adminPublishAnnouncement).toHaveBeenCalledWith('pub-id'); });
  });

  it('shows save error', async () => {
    const user = userEvent.setup();
    (adminCreateAnnouncement as Mock).mockRejectedValue({ response: { data: { message: 'SaveErr' } } });
    render(<AnnouncementForm announcement={null} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    await user.type(screen.getByPlaceholderText('请输入公告标题'), 'T');
    await user.type(screen.getByPlaceholderText('支持 Markdown 格式'), 'C');
    await user.click(screen.getByText('保存草稿'));
    await waitFor(() => { expect(screen.getByText('SaveErr')).toBeInTheDocument(); });
  });

  it('shows publish error', async () => {
    const user = userEvent.setup();
    (adminCreateAnnouncement as Mock).mockResolvedValue({ id: 'x' });
    (adminPublishAnnouncement as Mock).mockRejectedValue({ response: { data: { message: 'PubErr' } } });
    render(<AnnouncementForm announcement={null} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    await user.type(screen.getByPlaceholderText('请输入公告标题'), 'T');
    await user.type(screen.getByPlaceholderText('支持 Markdown 格式'), 'C');
    await user.click(screen.getByText('立即发布'));
    await waitFor(() => { expect(screen.getByText('PubErr')).toBeInTheDocument(); });
  });

  it('switches type', async () => {
    const user = userEvent.setup();
    render(<AnnouncementForm announcement={null} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    await user.click(screen.getByText('紧急通知'));
    expect(screen.getByText('紧急通知').closest('button')).toHaveClass('active');
  });

  it('shows role checkboxes', async () => {
    const user = userEvent.setup();
    render(<AnnouncementForm announcement={null} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    await user.click(screen.getByText('按角色'));
    expect(screen.getByText('普通用户')).toBeInTheDocument();
    expect(screen.getByText('管理员')).toBeInTheDocument();
  });

  it('toggles role checkbox', async () => {
    const user = userEvent.setup();
    render(<AnnouncementForm announcement={null} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    await user.click(screen.getByText('按角色'));
    const cb = screen.getByText('普通用户').closest('label')!.querySelector('input')!;
    await user.click(cb);
    expect(cb).toBeChecked();
    await user.click(cb);
    expect(cb).not.toBeChecked();
  });

  it('switches edit/preview', async () => {
    const user = userEvent.setup();
    render(<AnnouncementForm announcement={null} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    expect(screen.getByPlaceholderText('支持 Markdown 格式')).toBeInTheDocument();
    await user.click(screen.getByText('预览'));
    expect(screen.queryByPlaceholderText('支持 Markdown 格式')).not.toBeInTheDocument();
  });

  it('hides publish for non-draft', () => {
    render(<AnnouncementForm announcement={{ ...mockAnnouncement, status: 'active' as const }} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    expect(screen.queryByText('立即发布')).not.toBeInTheDocument();
  });

  it('toggles pin', async () => {
    const user = userEvent.setup();
    render(<AnnouncementForm announcement={null} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    const cb = screen.getByText('置顶显示').closest('label')!.querySelector('input')!;
    expect(cb).not.toBeChecked();
    await user.click(cb);
    expect(cb).toBeChecked();
  });

  it('shows user search', async () => {
    const user = userEvent.setup();
    render(<AnnouncementForm announcement={null} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    await user.click(screen.getByText('指定用户'));
    expect(screen.getByPlaceholderText('搜索用户（姓名或邮箱）')).toBeInTheDocument();
  });
});
