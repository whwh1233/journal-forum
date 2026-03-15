import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AnnouncementHandler from '@/features/announcements/components/AnnouncementHandler';
import type { Announcement } from '@/features/announcements/types/announcement';

let mockAnnouncements: Announcement[] = [];
let mockBanners: Announcement[] = [];
let mockIsAuthenticated = true;

vi.mock('@/contexts/AnnouncementContext', () => ({
  useAnnouncement: () => ({
    announcements: mockAnnouncements, banners: mockBanners, unreadCount: 0,
    loading: false, refreshBanners: vi.fn(), refreshAnnouncements: vi.fn(),
    markAsRead: vi.fn(), markAllAsRead: vi.fn(), dismissUrgent: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated, user: null, loading: false }),
}));

vi.mock("@/features/announcements/components/AnnouncementBanner", () => ({
  default: ({ onBannerClick }: any) => (
    <div data-testid="announcement-banner">
      {mockBanners.map(b => (
        <button key={b.id} data-testid={"banner-"+b.id} onClick={() => onBannerClick(b)}>{b.title}</button>
      ))}
    </div>
  ),
}));

vi.mock("@/features/announcements/components/AnnouncementModal", () => ({
  default: ({ announcement, mode, onClose }: any) => (
    <div data-testid="announcement-modal">
      <span data-testid="modal-title">{announcement.title}</span>
      <span data-testid="modal-mode">{mode}</span>
      <button data-testid="modal-close" onClick={onClose}>close</button>
    </div>
  ),
}));

const createMock = (o: Partial<Announcement> = {}): Announcement => ({
  id: "ann-" + Math.random().toString(36).slice(2, 8),
  title: "Test", content: "Content", type: "normal", status: "active",
  targetType: "all", colorScheme: "info", isPinned: false, priority: 0,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  creatorId: "c1", isRead: false, ...o,
});

describe("AnnouncementHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAnnouncements = [];
    mockBanners = [];
    mockIsAuthenticated = true;
  });

  it("renders banner", () => {
    render(<AnnouncementHandler />);
    expect(screen.getByTestId("announcement-banner")).toBeInTheDocument();
  });

  it("no modal initially", () => {
    render(<AnnouncementHandler />);
    expect(screen.queryByTestId("announcement-modal")).not.toBeInTheDocument();
  });

  it("opens detail on banner click", async () => {
    const b = createMock({ id: "b1", title: "Banner1", type: "banner" });
    mockBanners = [b];
    render(<AnnouncementHandler />);
    fireEvent.click(screen.getByTestId("banner-b1"));
    expect(screen.getByTestId("announcement-modal")).toBeInTheDocument();
    expect(screen.getByTestId("modal-mode")).toHaveTextContent("detail");
    expect(screen.getByTestId("modal-title")).toHaveTextContent("Banner1");
  });

  it("closes modal", async () => {
    mockBanners = [createMock({ id: "b1", type: "banner" })];
    render(<AnnouncementHandler />);
    fireEvent.click(screen.getByTestId("banner-b1"));
    fireEvent.click(screen.getByTestId("modal-close"));
    expect(screen.queryByTestId("announcement-modal")).not.toBeInTheDocument();
  });

  it("auto-opens urgent", async () => {
    mockAnnouncements = [createMock({ id: "u1", title: "Urgent1", type: "urgent", isRead: false })];
    render(<AnnouncementHandler />);
    await waitFor(() => {
      expect(screen.getByTestId("announcement-modal")).toBeInTheDocument();
      expect(screen.getByTestId("modal-mode")).toHaveTextContent("urgent");
    });
  });

  it("skips read urgent", () => {
    mockAnnouncements = [createMock({ type: "urgent", isRead: true })];
    render(<AnnouncementHandler />);
    expect(screen.queryByTestId("announcement-modal")).not.toBeInTheDocument();
  });

  it("skips dismissed urgent", () => {
    mockAnnouncements = [createMock({ type: "urgent", isRead: false, dismissed: true })];
    render(<AnnouncementHandler />);
    expect(screen.queryByTestId("announcement-modal")).not.toBeInTheDocument();
  });

  it("skips when not authenticated", () => {
    mockIsAuthenticated = false;
    mockAnnouncements = [createMock({ type: "urgent", isRead: false })];
    render(<AnnouncementHandler />);
    expect(screen.queryByTestId("announcement-modal")).not.toBeInTheDocument();
  });

  it("skips non-urgent", () => {
    mockAnnouncements = [createMock({ type: "normal", isRead: false })];
    render(<AnnouncementHandler />);
    expect(screen.queryByTestId("announcement-modal")).not.toBeInTheDocument();
  });

  it("processes urgent queue", async () => {
    mockAnnouncements = [
      createMock({ id: "u1", title: "U1", type: "urgent", isRead: false }),
      createMock({ id: "u2", title: "U2", type: "urgent", isRead: false }),
    ];
    render(<AnnouncementHandler />);
    await waitFor(() => { expect(screen.getByTestId("modal-title")).toHaveTextContent("U1"); });
    fireEvent.click(screen.getByTestId("modal-close"));
    await waitFor(() => { expect(screen.getByTestId("modal-title")).toHaveTextContent("U2"); });
  });

  describe("紧急公告队列扩展", () => {
    it("多个紧急公告时只弹出第一个", async () => {
      mockAnnouncements = [
        createMock({ id: "u1", title: "First", type: "urgent", isRead: false }),
        createMock({ id: "u2", title: "Second", type: "urgent", isRead: false }),
        createMock({ id: "u3", title: "Third", type: "urgent", isRead: false }),
      ];
      render(<AnnouncementHandler />);
      await waitFor(() => {
        expect(screen.getByTestId("announcement-modal")).toBeInTheDocument();
        expect(screen.getByTestId("modal-title")).toHaveTextContent("First");
      });
      // Second and Third should not be visible yet
      expect(screen.queryByText("Second")).not.toBeInTheDocument();
      expect(screen.queryByText("Third")).not.toBeInTheDocument();
    });

    it("关闭第一个紧急公告后弹出第二个", async () => {
      mockAnnouncements = [
        createMock({ id: "u1", title: "First", type: "urgent", isRead: false }),
        createMock({ id: "u2", title: "Second", type: "urgent", isRead: false }),
      ];
      render(<AnnouncementHandler />);
      await waitFor(() => {
        expect(screen.getByTestId("modal-title")).toHaveTextContent("First");
      });
      fireEvent.click(screen.getByTestId("modal-close"));
      await waitFor(() => {
        expect(screen.getByTestId("modal-title")).toHaveTextContent("Second");
      });
    });

    it("processedUrgentIds 阻止相同紧急公告重复弹出", async () => {
      mockAnnouncements = [
        createMock({ id: "u1", title: "OnlyOnce", type: "urgent", isRead: false }),
      ];
      const { rerender } = render(<AnnouncementHandler />);
      await waitFor(() => {
        expect(screen.getByTestId("modal-title")).toHaveTextContent("OnlyOnce");
      });
      fireEvent.click(screen.getByTestId("modal-close"));
      await waitFor(() => {
        expect(screen.queryByTestId("announcement-modal")).not.toBeInTheDocument();
      });
      // Re-render with same announcements — should NOT re-popup the same urgent
      rerender(<AnnouncementHandler />);
      expect(screen.queryByTestId("announcement-modal")).not.toBeInTheDocument();
    });
  });
});
