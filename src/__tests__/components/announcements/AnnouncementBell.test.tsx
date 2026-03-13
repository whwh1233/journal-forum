import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Announcement } from '@/features/announcements/types/announcement';

// Mock announcement data
const createMockAnnouncement = (overrides: Partial<Announcement> = {}): Announcement => ({
  id: `ann-${Math.random().toString(36).slice(2)}`,
  title: '测试公告',
  content: '测试内容',
  type: 'normal',
  status: 'active',
  targetType: 'all',
  colorScheme: 'info',
  isPinned: false,
  priority: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  creatorId: 'creator-1',
  isRead: false,
  ...overrides,
});

// Mock data for tests
let mockAnnouncements: Announcement[] = [];
let mockUnreadCount = 0;
const mockMarkAllAsRead = vi.fn();
const mockMarkAsRead = vi.fn();
const mockRefreshAnnouncements = vi.fn();

// Mock useAnnouncement hook
vi.mock('@/contexts/AnnouncementContext', () => ({
  useAnnouncement: () => ({
    banners: [],
    announcements: mockAnnouncements,
    unreadCount: mockUnreadCount,
    loading: false,
    refreshBanners: vi.fn(),
    refreshAnnouncements: mockRefreshAnnouncements,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
    dismissUrgent: vi.fn(),
  }),
}));

// Import component after mocks are set up
import AnnouncementBell from '@/features/announcements/components/AnnouncementBell';

describe('AnnouncementBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAnnouncements = [];
    mockUnreadCount = 0;
  });

  describe('渲染', () => {
    it('应该渲染铃铛触发按钮', () => {
      const { container } = render(<AnnouncementBell />);
      expect(container.querySelector('.announcement-bell__button')).toBeInTheDocument();
    });

    it('没有未读时不应该显示徽章', () => {
      mockUnreadCount = 0;
      const { container } = render(<AnnouncementBell />);
      expect(container.querySelector('.announcement-bell__badge')).not.toBeInTheDocument();
    });

    it('有未读时应该显示徽章', () => {
      mockUnreadCount = 5;
      const { container } = render(<AnnouncementBell />);
      expect(container.querySelector('.announcement-bell__badge')).toBeInTheDocument();
    });

    it('徽章应该显示正确的未读数量', () => {
      mockUnreadCount = 3;
      const { container } = render(<AnnouncementBell />);
      const badge = container.querySelector('.announcement-bell__badge');
      expect(badge?.textContent).toBe('3');
    });

    it('未读数量超过 99 时应该显示 99+', () => {
      mockUnreadCount = 150;
      const { container } = render(<AnnouncementBell />);
      const badge = container.querySelector('.announcement-bell__badge');
      expect(badge?.textContent).toBe('99+');
    });
  });

  describe('下拉面板', () => {
    it('初始状态下拉面板应该关闭', () => {
      const { container } = render(<AnnouncementBell />);
      expect(container.querySelector('.announcement-bell__dropdown')).not.toBeInTheDocument();
    });

    it('点击铃铛应该打开下拉面板', async () => {
      const { container } = render(<AnnouncementBell />);

      const trigger = container.querySelector('.announcement-bell__button');
      fireEvent.click(trigger!);

      await waitFor(() => {
        expect(container.querySelector('.announcement-bell__dropdown')).toBeInTheDocument();
      });
    });

    it('再次点击铃铛应该关闭下拉面板', async () => {
      const { container } = render(<AnnouncementBell />);

      const trigger = container.querySelector('.announcement-bell__button');

      // 打开
      fireEvent.click(trigger!);
      await waitFor(() => {
        expect(container.querySelector('.announcement-bell__dropdown')).toBeInTheDocument();
      });

      // 关闭
      fireEvent.click(trigger!);
      await waitFor(() => {
        expect(container.querySelector('.announcement-bell__dropdown')).not.toBeInTheDocument();
      });
    });

    it('下拉面板应该显示标题', async () => {
      const { container } = render(<AnnouncementBell />);

      const trigger = container.querySelector('.announcement-bell__button');
      fireEvent.click(trigger!);

      await waitFor(() => {
        expect(screen.getByText('公告通知')).toBeInTheDocument();
      });
    });
  });

  describe('公告列表', () => {
    it('没有公告时应该显示空状态', async () => {
      mockAnnouncements = [];
      const { container } = render(<AnnouncementBell />);

      const trigger = container.querySelector('.announcement-bell__button');
      fireEvent.click(trigger!);

      await waitFor(() => {
        expect(screen.getByText(/暂无公告/)).toBeInTheDocument();
      });
    });

    it('有公告时应该显示公告列表', async () => {
      mockAnnouncements = [
        createMockAnnouncement({ id: '1', title: '公告一' }),
        createMockAnnouncement({ id: '2', title: '公告二' }),
      ];

      const { container } = render(<AnnouncementBell />);

      const trigger = container.querySelector('.announcement-bell__button');
      fireEvent.click(trigger!);

      await waitFor(() => {
        expect(screen.getByText('公告一')).toBeInTheDocument();
        expect(screen.getByText('公告二')).toBeInTheDocument();
      });
    });
  });

  describe('全部已读', () => {
    it('有未读公告时应该显示全部已读按钮', async () => {
      mockUnreadCount = 3;
      mockAnnouncements = [
        createMockAnnouncement({ id: '1', isRead: false }),
      ];

      const { container } = render(<AnnouncementBell />);

      const trigger = container.querySelector('.announcement-bell__button');
      fireEvent.click(trigger!);

      await waitFor(() => {
        expect(screen.getByText(/全部已读/)).toBeInTheDocument();
      });
    });

    it('点击全部已读应该调用 markAllAsRead', async () => {
      mockUnreadCount = 1;
      mockAnnouncements = [
        createMockAnnouncement({ id: '1', isRead: false }),
      ];

      const { container } = render(<AnnouncementBell />);

      const trigger = container.querySelector('.announcement-bell__button');
      fireEvent.click(trigger!);

      await waitFor(() => {
        const markAllBtn = screen.getByText(/全部已读/);
        fireEvent.click(markAllBtn);
      });

      expect(mockMarkAllAsRead).toHaveBeenCalled();
    });
  });

  describe('无障碍', () => {
    it('铃铛按钮应该有 aria-label', () => {
      const { container } = render(<AnnouncementBell />);
      const trigger = container.querySelector('.announcement-bell__button');
      expect(trigger).toHaveAttribute('aria-label');
    });

    it('下拉面板打开时按钮应该有 aria-expanded=true', async () => {
      const { container } = render(<AnnouncementBell />);

      const trigger = container.querySelector('.announcement-bell__button');
      fireEvent.click(trigger!);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });
});
