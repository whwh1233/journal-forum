import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnnouncementItem from '@/features/announcements/components/AnnouncementItem';
import type { Announcement } from '@/features/announcements/types/announcement';

// Mock announcement data
const createMockAnnouncement = (overrides: Partial<Announcement> = {}): Announcement => ({
  id: 'test-id-1',
  title: '测试公告标题',
  content: '这是测试公告的内容，支持 **Markdown** 格式。',
  type: 'normal',
  status: 'active',
  targetType: 'all',
  colorScheme: 'info',
  isPinned: false,
  priority: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  creatorId: 'creator-1',
  creatorName: '管理员',
  isRead: false,
  ...overrides,
});

describe('AnnouncementItem', () => {
  describe('渲染', () => {
    it('应该正确渲染公告标题', () => {
      const announcement = createMockAnnouncement({ title: '重要系统通知' });
      const onClick = vi.fn();

      render(<AnnouncementItem announcement={announcement} onClick={onClick} />);

      expect(screen.getByText('重要系统通知')).toBeInTheDocument();
    });

    it('应该渲染公告内容预览', () => {
      const announcement = createMockAnnouncement({
        content: '这是一段较长的公告内容用于测试预览功能',
      });
      const onClick = vi.fn();

      render(<AnnouncementItem announcement={announcement} onClick={onClick} />);

      expect(screen.getByText(/这是一段较长的公告内容/)).toBeInTheDocument();
    });

    it('应该显示创建者名称', () => {
      const announcement = createMockAnnouncement({ creatorName: '系统管理员' });
      const onClick = vi.fn();

      render(<AnnouncementItem announcement={announcement} onClick={onClick} />);

      expect(screen.getByText('系统管理员')).toBeInTheDocument();
    });

    it('应该显示类型标签', () => {
      const announcement = createMockAnnouncement({ type: 'urgent' });
      const onClick = vi.fn();

      render(<AnnouncementItem announcement={announcement} onClick={onClick} />);

      expect(screen.getByText('紧急')).toBeInTheDocument();
    });
  });

  describe('未读状态', () => {
    it('未读公告应该显示未读标识', () => {
      const announcement = createMockAnnouncement({ isRead: false });
      const onClick = vi.fn();

      const { container } = render(
        <AnnouncementItem announcement={announcement} onClick={onClick} />
      );

      expect(container.querySelector('.announcement-item--unread')).toBeInTheDocument();
      expect(container.querySelector('.announcement-item__dot')).toBeInTheDocument();
    });

    it('已读公告不应该显示未读标识', () => {
      const announcement = createMockAnnouncement({ isRead: true });
      const onClick = vi.fn();

      const { container } = render(
        <AnnouncementItem announcement={announcement} onClick={onClick} />
      );

      expect(container.querySelector('.announcement-item--unread')).not.toBeInTheDocument();
      expect(container.querySelector('.announcement-item__dot')).not.toBeInTheDocument();
    });
  });

  describe('置顶标识', () => {
    it('置顶公告应该显示置顶图标', () => {
      const announcement = createMockAnnouncement({ isPinned: true });
      const onClick = vi.fn();

      const { container } = render(
        <AnnouncementItem announcement={announcement} onClick={onClick} />
      );

      expect(container.querySelector('.announcement-item__pinned')).toBeInTheDocument();
    });

    it('非置顶公告不应该显示置顶图标', () => {
      const announcement = createMockAnnouncement({ isPinned: false });
      const onClick = vi.fn();

      const { container } = render(
        <AnnouncementItem announcement={announcement} onClick={onClick} />
      );

      expect(container.querySelector('.announcement-item__pinned')).not.toBeInTheDocument();
    });
  });

  describe('颜色方案', () => {
    it.each(['info', 'success', 'warning', 'danger'] as const)(
      '应该正确应用 %s 颜色方案',
      (colorScheme) => {
        const announcement = createMockAnnouncement({ colorScheme });
        const onClick = vi.fn();

        const { container } = render(
          <AnnouncementItem announcement={announcement} onClick={onClick} />
        );

        expect(
          container.querySelector(`.announcement-item__tag--${colorScheme}`)
        ).toBeInTheDocument();
      }
    );
  });

  describe('点击事件', () => {
    it('点击公告应该触发 onClick 回调', () => {
      const announcement = createMockAnnouncement();
      const onClick = vi.fn();

      const { container } = render(
        <AnnouncementItem announcement={announcement} onClick={onClick} />
      );

      fireEvent.click(container.querySelector('.announcement-item')!);

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(announcement);
    });
  });

  describe('相对时间', () => {
    it('应该显示相对时间格式', () => {
      const now = new Date();
      const announcement = createMockAnnouncement({
        createdAt: now.toISOString(),
      });
      const onClick = vi.fn();

      render(<AnnouncementItem announcement={announcement} onClick={onClick} />);

      // 刚刚创建的应该显示"刚刚"
      expect(screen.getByText('刚刚')).toBeInTheDocument();
    });

    it('应该显示分钟前', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const announcement = createMockAnnouncement({
        createdAt: tenMinutesAgo.toISOString(),
      });
      const onClick = vi.fn();

      render(<AnnouncementItem announcement={announcement} onClick={onClick} />);

      expect(screen.getByText('10 分钟前')).toBeInTheDocument();
    });
  });

  describe('Markdown 内容处理', () => {
    it('应该去除 Markdown 标记显示纯文本预览', () => {
      const announcement = createMockAnnouncement({
        content: '# 标题\n\n**粗体**文字和*斜体*文字',
      });
      const onClick = vi.fn();

      render(<AnnouncementItem announcement={announcement} onClick={onClick} />);

      // 预览应该去除 Markdown 标记
      expect(screen.queryByText('#')).not.toBeInTheDocument();
      expect(screen.queryByText('**')).not.toBeInTheDocument();
    });
  });
});
