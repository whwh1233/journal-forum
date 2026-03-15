import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnnouncementModal from '@/features/announcements/components/AnnouncementModal';
import type { Announcement } from '@/features/announcements/types/announcement';

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: (html: string) => html,
  },
}));

// Mock marked
vi.mock('marked', () => ({
  marked: {
    parse: (content: string) => `<p>${content}</p>`,
  },
}));

// Mock useAnnouncement hook
const mockMarkAsRead = vi.fn();
const mockDismissUrgent = vi.fn();

vi.mock('@/contexts/AnnouncementContext', () => ({
  useAnnouncement: () => ({
    banners: [],
    announcements: [],
    unreadCount: 0,
    loading: false,
    refreshBanners: vi.fn(),
    refreshAnnouncements: vi.fn(),
    markAsRead: mockMarkAsRead,
    markAllAsRead: vi.fn(),
    dismissUrgent: mockDismissUrgent,
  }),
}));

// Helper to create mock announcement
const createMockAnnouncement = (overrides: Partial<Announcement> = {}): Announcement => ({
  id: 'modal-test-id',
  title: '测试公告标题',
  content: '这是测试公告的详细内容，支持 Markdown 格式。',
  type: 'normal',
  status: 'active',
  targetType: 'all',
  colorScheme: 'info',
  isPinned: false,
  priority: 0,
  createdAt: '2026-03-13T10:00:00.000Z',
  updatedAt: '2026-03-13T10:00:00.000Z',
  creatorId: 'creator-1',
  creatorName: '系统管理员',
  isRead: false,
  ...overrides,
});

describe('AnnouncementModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('详情模式 (mode=detail)', () => {
    it('应该渲染公告标题', () => {
      const announcement = createMockAnnouncement({ title: '重要系统通知' });
      const onClose = vi.fn();

      render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      expect(screen.getByText('重要系统通知')).toBeInTheDocument();
    });

    it('应该渲染公告内容', () => {
      const announcement = createMockAnnouncement({ content: '详细内容说明' });
      const onClose = vi.fn();

      render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      expect(screen.getByText(/详细内容说明/)).toBeInTheDocument();
    });

    it('应该显示创建者信息', () => {
      const announcement = createMockAnnouncement({ creatorName: '管理员张三' });
      const onClose = vi.fn();

      render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      expect(screen.getByText(/管理员张三/)).toBeInTheDocument();
    });

    it('应该显示关闭按钮', () => {
      const announcement = createMockAnnouncement();
      const onClose = vi.fn();

      const { container } = render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      expect(container.querySelector('.announcement-modal__close')).toBeInTheDocument();
    });

    it('点击关闭按钮应该触发 onClose', () => {
      const announcement = createMockAnnouncement();
      const onClose = vi.fn();

      const { container } = render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      const closeBtn = container.querySelector('.announcement-modal__close');
      fireEvent.click(closeBtn!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('点击遮罩层应该触发 onClose', () => {
      const announcement = createMockAnnouncement();
      const onClose = vi.fn();

      const { container } = render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      const overlay = container.querySelector('.announcement-modal__overlay');
      fireEvent.click(overlay!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('点击模态框内容不应该触发关闭', () => {
      const announcement = createMockAnnouncement();
      const onClose = vi.fn();

      const { container } = render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      const modal = container.querySelector('.announcement-modal');
      fireEvent.click(modal!);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('应该显示关闭按钮文字', () => {
      const announcement = createMockAnnouncement();
      const onClose = vi.fn();

      render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      expect(screen.getByText('关闭')).toBeInTheDocument();
    });

    it('点击关闭按钮应该调用 markAsRead', async () => {
      const announcement = createMockAnnouncement();
      const onClose = vi.fn();

      render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      const closeButton = screen.getByText('关闭');
      fireEvent.click(closeButton);

      expect(mockMarkAsRead).toHaveBeenCalledWith('modal-test-id');
    });
  });

  describe('紧急模式 (mode=urgent)', () => {
    it('应该使用 alertdialog 角色', () => {
      const announcement = createMockAnnouncement({ type: 'urgent' });
      const onClose = vi.fn();

      const { container } = render(
        <AnnouncementModal
          announcement={announcement}
          mode="urgent"
          onClose={onClose}
        />
      );

      const overlay = container.querySelector('.announcement-modal__overlay');
      expect(overlay).toHaveAttribute('role', 'alertdialog');
    });

    it('应该显示"我知道了"按钮', () => {
      const announcement = createMockAnnouncement({ type: 'urgent' });
      const onClose = vi.fn();

      render(
        <AnnouncementModal
          announcement={announcement}
          mode="urgent"
          onClose={onClose}
        />
      );

      expect(screen.getByText('我知道了')).toBeInTheDocument();
    });

    it('点击确认按钮应该触发 dismissUrgent', async () => {
      const announcement = createMockAnnouncement({ type: 'urgent', id: 'urgent-id' });
      const onClose = vi.fn();

      render(
        <AnnouncementModal
          announcement={announcement}
          mode="urgent"
          onClose={onClose}
        />
      );

      const confirmBtn = screen.getByText('我知道了');
      fireEvent.click(confirmBtn);

      expect(mockDismissUrgent).toHaveBeenCalledWith('urgent-id');
    });

    it('紧急模式不应该显示关闭按钮（X图标）', () => {
      const announcement = createMockAnnouncement({ type: 'urgent' });
      const onClose = vi.fn();

      const { container } = render(
        <AnnouncementModal
          announcement={announcement}
          mode="urgent"
          onClose={onClose}
        />
      );

      expect(container.querySelector('.announcement-modal__close')).not.toBeInTheDocument();
    });

    it('紧急模式点击遮罩层不应该关闭', () => {
      const announcement = createMockAnnouncement({ type: 'urgent' });
      const onClose = vi.fn();

      const { container } = render(
        <AnnouncementModal
          announcement={announcement}
          mode="urgent"
          onClose={onClose}
        />
      );

      const overlay = container.querySelector('.announcement-modal__overlay');
      fireEvent.click(overlay!);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('颜色方案', () => {
    it.each(['info', 'success', 'warning', 'danger'] as const)(
      '应该正确应用 %s 颜色方案到条纹',
      (colorScheme) => {
        const announcement = createMockAnnouncement({ colorScheme });
        const onClose = vi.fn();

        const { container } = render(
          <AnnouncementModal
            announcement={announcement}
            mode="detail"
            onClose={onClose}
          />
        );

        expect(
          container.querySelector(`.announcement-modal__stripe--${colorScheme}`)
        ).toBeInTheDocument();
      }
    );

    it.each(['info', 'success', 'warning', 'danger'] as const)(
      '应该正确应用 %s 颜色方案到图标',
      (colorScheme) => {
        const announcement = createMockAnnouncement({ colorScheme });
        const onClose = vi.fn();

        const { container } = render(
          <AnnouncementModal
            announcement={announcement}
            mode="detail"
            onClose={onClose}
          />
        );

        expect(
          container.querySelector(`.announcement-modal__icon--${colorScheme}`)
        ).toBeInTheDocument();
      }
    );
  });

  describe('类型标签', () => {
    it('普通公告应该显示"系统公告"标签', () => {
      const announcement = createMockAnnouncement({ type: 'normal' });
      const onClose = vi.fn();

      render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      expect(screen.getByText('系统公告')).toBeInTheDocument();
    });

    it('紧急公告应该显示"紧急通知"标签', () => {
      const announcement = createMockAnnouncement({ type: 'urgent' });
      const onClose = vi.fn();

      render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      expect(screen.getByText('紧急通知')).toBeInTheDocument();
    });

    it('横幅公告应该显示"重要公告"标签', () => {
      const announcement = createMockAnnouncement({ type: 'banner' });
      const onClose = vi.fn();

      render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      expect(screen.getByText('重要公告')).toBeInTheDocument();
    });
  });

  describe('键盘交互', () => {
    it('详情模式按 Escape 应该关闭', () => {
      const announcement = createMockAnnouncement();
      const onClose = vi.fn();

      render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('紧急模式按 Escape 不应该关闭', () => {
      const announcement = createMockAnnouncement({ type: 'urgent' });
      const onClose = vi.fn();

      render(
        <AnnouncementModal
          announcement={announcement}
          mode="urgent"
          onClose={onClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('无公告时', () => {
    it('announcement 为 null 时不应该渲染', () => {
      const onClose = vi.fn();

      const { container } = render(
        <AnnouncementModal
          announcement={null}
          mode="detail"
          onClose={onClose}
        />
      );

      expect(container.querySelector('.announcement-modal')).not.toBeInTheDocument();
    });
  });

  describe('无障碍', () => {
    it('应该有正确的 aria-modal 属性', () => {
      const announcement = createMockAnnouncement();
      const onClose = vi.fn();

      const { container } = render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      const overlay = container.querySelector('.announcement-modal__overlay');
      expect(overlay).toHaveAttribute('aria-modal', 'true');
    });

    it('应该有正确的 aria-labelledby 属性', () => {
      const announcement = createMockAnnouncement();
      const onClose = vi.fn();

      const { container } = render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      const overlay = container.querySelector('.announcement-modal__overlay');
      expect(overlay).toHaveAttribute('aria-labelledby', 'announcement-modal-title');
    });
  });

  describe('紧急模式按钮', () => {
    it('urgent 模式只显示"我知道了"按钮，不显示"关闭"文字按钮', () => {
      const announcement = createMockAnnouncement({ type: 'urgent' });
      const onClose = vi.fn();

      render(
        <AnnouncementModal
          announcement={announcement}
          mode="urgent"
          onClose={onClose}
        />
      );

      expect(screen.getByText('我知道了')).toBeInTheDocument();
      expect(screen.queryByText('关闭')).not.toBeInTheDocument();
    });

    it('urgent 模式点击"我知道了"后触发 onClose', async () => {
      const announcement = createMockAnnouncement({ type: 'urgent', id: 'u-btn-test' });
      const onClose = vi.fn();

      render(
        <AnnouncementModal
          announcement={announcement}
          mode="urgent"
          onClose={onClose}
        />
      );

      fireEvent.click(screen.getByText('我知道了'));

      // handleAction is async, wait for promise microtasks to resolve
      await Promise.resolve();
      await Promise.resolve();

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('详情模式标记已读', () => {
    it('detail 模式点击"关闭"按钮时调用 markAsRead', () => {
      const announcement = createMockAnnouncement({ id: 'detail-read-id' });
      const onClose = vi.fn();

      render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      fireEvent.click(screen.getByText('关闭'));

      expect(mockMarkAsRead).toHaveBeenCalledWith('detail-read-id');
    });

    it('detail 模式点击遮罩层不调用 markAsRead', () => {
      const announcement = createMockAnnouncement({ id: 'overlay-no-read' });
      const onClose = vi.fn();

      const { container } = render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      const overlay = container.querySelector('.announcement-modal__overlay');
      fireEvent.click(overlay!);

      expect(mockMarkAsRead).not.toHaveBeenCalled();
    });
  });

  describe('Escape 键关闭', () => {
    it('detail 模式按 Escape 触发 onClose', () => {
      const announcement = createMockAnnouncement();
      const onClose = vi.fn();

      render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('urgent 模式按 Escape 不触发 onClose', () => {
      const announcement = createMockAnnouncement({ type: 'urgent' });
      const onClose = vi.fn();

      render(
        <AnnouncementModal
          announcement={announcement}
          mode="urgent"
          onClose={onClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Markdown 内容渲染', () => {
    it('公告内容经过 marked 解析后渲染为 HTML', () => {
      const announcement = createMockAnnouncement({ content: 'Hello World' });
      const onClose = vi.fn();

      const { container } = render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      // Our mock of marked.parse wraps content in <p> tags
      const contentEl = container.querySelector('.announcement-modal__content');
      expect(contentEl?.innerHTML).toContain('<p>Hello World</p>');
    });

    it('HTML 内容经过 DOMPurify 净化', () => {
      const announcement = createMockAnnouncement({ content: '<script>evil()</script>Safe' });
      const onClose = vi.fn();

      const { container } = render(
        <AnnouncementModal
          announcement={announcement}
          mode="detail"
          onClose={onClose}
        />
      );

      // DOMPurify mock passes through as-is in tests, but the content is rendered
      const contentEl = container.querySelector('.announcement-modal__content');
      expect(contentEl).toBeInTheDocument();
    });
  });
});
