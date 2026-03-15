import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AnnouncementBanner from '@/features/announcements/components/AnnouncementBanner';
import type { Announcement } from '@/features/announcements/types/announcement';

// Mock sessionStorage
const mockSessionStorage: Record<string, string> = {};
vi.stubGlobal('sessionStorage', {
  getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockSessionStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  }),
});

// Mock announcement data
const createMockBanner = (overrides: Partial<Announcement> = {}): Announcement => ({
  id: `banner-${Math.random().toString(36).slice(2)}`,
  title: '横幅公告标题',
  content: '这是横幅公告的内容',
  type: 'banner',
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

// Mock banners for useAnnouncement
let mockBanners: Announcement[] = [];

// Mock useAnnouncement hook
vi.mock('@/contexts/AnnouncementContext', () => ({
  useAnnouncement: () => ({
    banners: mockBanners,
    announcements: [],
    unreadCount: 0,
    loading: false,
    refreshBanners: vi.fn(),
    refreshAnnouncements: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    dismissUrgent: vi.fn(),
  }),
}));

describe('AnnouncementBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
    mockBanners = [];
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('渲染', () => {
    it('没有公告时不应该渲染任何内容', () => {
      mockBanners = [];
      const { container } = render(<AnnouncementBanner />);
      expect(container.querySelector('.announcement-banner')).not.toBeInTheDocument();
    });

    it('有公告时应该渲染横幅', () => {
      mockBanners = [createMockBanner({ title: '系统维护通知' })];
      render(<AnnouncementBanner />);
      expect(screen.getByText('系统维护通知')).toBeInTheDocument();
    });

    it('应该显示颜色方案对应的标签', () => {
      mockBanners = [createMockBanner({ colorScheme: 'info' })];
      render(<AnnouncementBanner />);
      expect(screen.getByText('公告')).toBeInTheDocument();
    });

    it('应该显示 success 颜色方案的标签', () => {
      mockBanners = [createMockBanner({ colorScheme: 'success' })];
      render(<AnnouncementBanner />);
      expect(screen.getByText('好消息')).toBeInTheDocument();
    });

    it('应该显示 warning 颜色方案的标签', () => {
      mockBanners = [createMockBanner({ colorScheme: 'warning' })];
      render(<AnnouncementBanner />);
      expect(screen.getByText('注意')).toBeInTheDocument();
    });

    it('应该显示 danger 颜色方案的标签', () => {
      mockBanners = [createMockBanner({ colorScheme: 'danger' })];
      render(<AnnouncementBanner />);
      expect(screen.getByText('重要')).toBeInTheDocument();
    });
  });

  describe('颜色方案', () => {
    it.each(['info', 'success', 'warning', 'danger'] as const)(
      '应该正确应用 %s 颜色方案类名',
      (colorScheme) => {
        mockBanners = [createMockBanner({ colorScheme })];
        const { container } = render(<AnnouncementBanner />);
        expect(
          container.querySelector(`.announcement-banner--${colorScheme}`)
        ).toBeInTheDocument();
      }
    );
  });

  describe('轮播功能', () => {
    it('多个公告时应该显示导航按钮', () => {
      mockBanners = [
        createMockBanner({ id: '1', title: '公告1' }),
        createMockBanner({ id: '2', title: '公告2' }),
        createMockBanner({ id: '3', title: '公告3' }),
      ];
      const { container } = render(<AnnouncementBanner />);

      const dots = container.querySelectorAll('.announcement-banner__dot');
      expect(dots.length).toBe(3);
    });

    it('点击导航点应该切换公告', () => {
      mockBanners = [
        createMockBanner({ id: '1', title: '公告1' }),
        createMockBanner({ id: '2', title: '公告2' }),
      ];
      const { container } = render(<AnnouncementBanner />);

      // 初始显示第一个
      expect(screen.getByText('公告1')).toBeInTheDocument();

      // 点击第二个点
      const dots = container.querySelectorAll('.announcement-banner__dot');
      fireEvent.click(dots[1]);

      expect(screen.getByText('公告2')).toBeInTheDocument();
    });

    it('应该自动轮播', async () => {
      mockBanners = [
        createMockBanner({ id: '1', title: '公告1' }),
        createMockBanner({ id: '2', title: '公告2' }),
      ];
      render(<AnnouncementBanner />);

      // 初始显示第一个
      expect(screen.getByText('公告1')).toBeInTheDocument();

      // 等待 5 秒自动切换
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByText('公告2')).toBeInTheDocument();
    });

    it('单个公告时不应该显示导航点', () => {
      mockBanners = [createMockBanner({ title: '唯一公告' })];
      const { container } = render(<AnnouncementBanner />);

      const dots = container.querySelectorAll('.announcement-banner__dot');
      expect(dots.length).toBe(0);
    });

    it('点击上一条按钮应该切换', () => {
      mockBanners = [
        createMockBanner({ id: '1', title: '公告1' }),
        createMockBanner({ id: '2', title: '公告2' }),
      ];
      const { container } = render(<AnnouncementBanner />);

      // 先切换到第二个
      const dots = container.querySelectorAll('.announcement-banner__dot');
      fireEvent.click(dots[1]);
      expect(screen.getByText('公告2')).toBeInTheDocument();

      // 点击上一条
      const prevBtn = container.querySelector('[aria-label="上一条"]');
      fireEvent.click(prevBtn!);

      expect(screen.getByText('公告1')).toBeInTheDocument();
    });

    it('点击下一条按钮应该切换', () => {
      mockBanners = [
        createMockBanner({ id: '1', title: '公告1' }),
        createMockBanner({ id: '2', title: '公告2' }),
      ];
      const { container } = render(<AnnouncementBanner />);

      expect(screen.getByText('公告1')).toBeInTheDocument();

      // 点击下一条
      const nextBtn = container.querySelector('[aria-label="下一条"]');
      fireEvent.click(nextBtn!);

      expect(screen.getByText('公告2')).toBeInTheDocument();
    });
  });

  describe('关闭功能', () => {
    it('应该显示关闭按钮', () => {
      mockBanners = [createMockBanner()];
      const { container } = render(<AnnouncementBanner />);

      expect(container.querySelector('.announcement-banner__close')).toBeInTheDocument();
    });

    it('点击关闭按钮应该隐藏当前公告', () => {
      mockBanners = [
        createMockBanner({ id: 'banner-1', title: '公告1' }),
        createMockBanner({ id: 'banner-2', title: '公告2' }),
      ];
      const { container } = render(<AnnouncementBanner />);

      expect(screen.getByText('公告1')).toBeInTheDocument();

      // 关闭第一个
      const closeBtn = container.querySelector('.announcement-banner__close');
      fireEvent.click(closeBtn!);

      // 应该显示第二个
      expect(screen.getByText('公告2')).toBeInTheDocument();
    });

    it('关闭所有公告后应该不渲染横幅', () => {
      mockBanners = [createMockBanner({ id: 'only-one', title: '唯一公告' })];
      const { container } = render(<AnnouncementBanner />);

      // 关闭唯一的公告
      const closeBtn = container.querySelector('.announcement-banner__close');
      fireEvent.click(closeBtn!);

      // 横幅应该消失
      expect(container.querySelector('.announcement-banner')).not.toBeInTheDocument();
    });

    it('关闭的公告 ID 应该保存到 sessionStorage', () => {
      mockBanners = [createMockBanner({ id: 'test-dismiss-id' })];
      const { container } = render(<AnnouncementBanner />);

      const closeBtn = container.querySelector('.announcement-banner__close');
      fireEvent.click(closeBtn!);

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'dismissed-banner-test-dismiss-id',
        'true'
      );
    });
  });

  describe('已关闭公告过滤', () => {
    it('应该过滤掉已关闭的公告', () => {
      // 预设已关闭的公告
      mockSessionStorage['dismissed-banner-dismissed-id'] = 'true';

      mockBanners = [
        createMockBanner({ id: 'dismissed-id', title: '已关闭' }),
        createMockBanner({ id: 'visible-id', title: '可见公告' }),
      ];
      render(<AnnouncementBanner />);

      expect(screen.queryByText('已关闭')).not.toBeInTheDocument();
      expect(screen.getByText('可见公告')).toBeInTheDocument();
    });
  });

  describe('onBannerClick 回调', () => {
    it('点击横幅应该触发回调', () => {
      const onBannerClick = vi.fn();
      mockBanners = [createMockBanner({ id: 'click-test', title: '点击测试' })];

      const { container } = render(<AnnouncementBanner onBannerClick={onBannerClick} />);

      const banner = container.querySelector('.announcement-banner');
      fireEvent.click(banner!);

      expect(onBannerClick).toHaveBeenCalledTimes(1);
      expect(onBannerClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'click-test', title: '点击测试' })
      );
    });
  });

  describe('鼠标悬停暂停', () => {
    it('鼠标悬停时应该暂停轮播', async () => {
      mockBanners = [
        createMockBanner({ id: '1', title: '公告1' }),
        createMockBanner({ id: '2', title: '公告2' }),
      ];
      const { container } = render(<AnnouncementBanner />);

      expect(screen.getByText('公告1')).toBeInTheDocument();

      // 鼠标悬停
      const banner = container.querySelector('.announcement-banner');
      fireEvent.mouseEnter(banner!);

      // 等待超过轮播时间
      await act(async () => {
        vi.advanceTimersByTime(6000);
      });

      // 应该还是第一个（没有自动切换）
      expect(screen.getByText('公告1')).toBeInTheDocument();

      // 鼠标离开
      fireEvent.mouseLeave(banner!);

      // 等待轮播
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // 应该切换了
      expect(screen.getByText('公告2')).toBeInTheDocument();
    });
  });

  describe('无障碍', () => {
    it('应该有正确的 ARIA 属性', () => {
      mockBanners = [createMockBanner()];
      const { container } = render(<AnnouncementBanner />);

      const banner = container.querySelector('.announcement-banner');
      expect(banner).toHaveAttribute('role', 'alert');
      expect(banner).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('轮播自动前进扩展', () => {
    it('5 秒后自动切换到下一条', async () => {
      mockBanners = [
        createMockBanner({ id: 'c1', title: '轮播公告1' }),
        createMockBanner({ id: 'c2', title: '轮播公告2' }),
      ];
      render(<AnnouncementBanner />);

      expect(screen.getByText('轮播公告1')).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByText('轮播公告2')).toBeInTheDocument();
    });

    it('再过 5 秒循环回第一条', async () => {
      mockBanners = [
        createMockBanner({ id: 'c1', title: '循环公告1' }),
        createMockBanner({ id: 'c2', title: '循环公告2' }),
      ];
      render(<AnnouncementBanner />);

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByText('循环公告2')).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByText('循环公告1')).toBeInTheDocument();
    });
  });

  describe('手动导航扩展', () => {
    it('点击下一条后点击上一条应该回到第一条', () => {
      mockBanners = [
        createMockBanner({ id: 'n1', title: '导航公告1' }),
        createMockBanner({ id: 'n2', title: '导航公告2' }),
        createMockBanner({ id: 'n3', title: '导航公告3' }),
      ];
      const { container } = render(<AnnouncementBanner />);

      expect(screen.getByText('导航公告1')).toBeInTheDocument();

      const nextBtn = container.querySelector('[aria-label="下一条"]');
      fireEvent.click(nextBtn!);
      expect(screen.getByText('导航公告2')).toBeInTheDocument();

      const prevBtn = container.querySelector('[aria-label="上一条"]');
      fireEvent.click(prevBtn!);
      expect(screen.getByText('导航公告1')).toBeInTheDocument();
    });

    it('从第一条点击上一条应该循环到最后一条', () => {
      mockBanners = [
        createMockBanner({ id: 'w1', title: '绕行公告1' }),
        createMockBanner({ id: 'w2', title: '绕行公告2' }),
        createMockBanner({ id: 'w3', title: '绕行公告3' }),
      ];
      const { container } = render(<AnnouncementBanner />);

      expect(screen.getByText('绕行公告1')).toBeInTheDocument();

      const prevBtn = container.querySelector('[aria-label="上一条"]');
      fireEvent.click(prevBtn!);

      expect(screen.getByText('绕行公告3')).toBeInTheDocument();
    });
  });

  describe('关闭后保存到 sessionStorage', () => {
    it('关闭第二条公告时正确保存其 ID', () => {
      mockBanners = [
        createMockBanner({ id: 'ss-first', title: '第一条' }),
        createMockBanner({ id: 'ss-second', title: '第二条' }),
      ];
      const { container } = render(<AnnouncementBanner />);

      // 切换到第二条
      const dots = container.querySelectorAll('.announcement-banner__dot');
      fireEvent.click(dots[1]);
      expect(screen.getByText('第二条')).toBeInTheDocument();

      // 关闭第二条
      const closeBtn = container.querySelector('.announcement-banner__close');
      fireEvent.click(closeBtn!);

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'dismissed-banner-ss-second',
        'true'
      );
    });
  });
});
