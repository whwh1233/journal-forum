import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { AnnouncementProvider, useAnnouncement } from '@/contexts/AnnouncementContext';
import { createMockAnnouncement } from '@/__tests__/helpers/testFactories';

// Mock announcementService
vi.mock('@/features/announcements/services/announcementService', () => ({
  getBanners: vi.fn(),
  getAnnouncements: vi.fn(),
  getUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import * as announcementService from '@/features/announcements/services/announcementService';
import { useAuth } from '@/hooks/useAuth';

const mockGetBanners = vi.mocked(announcementService.getBanners);
const mockGetAnnouncements = vi.mocked(announcementService.getAnnouncements);
const mockGetUnreadCount = vi.mocked(announcementService.getUnreadCount);
const mockMarkAsRead = vi.mocked(announcementService.markAsRead);
const mockMarkAllAsRead = vi.mocked(announcementService.markAllAsRead);
const mockUseAuth = vi.mocked(useAuth);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AnnouncementProvider>{children}</AnnouncementProvider>
);

/** Helper: set up default authenticated mock responses */
function setupAuthenticatedMocks(
  banners: ReturnType<typeof createMockAnnouncement>[] = [],
  announcements: ReturnType<typeof createMockAnnouncement>[] = [],
  unreadCount = 0
) {
  mockUseAuth.mockReturnValue({ isAuthenticated: true } as ReturnType<typeof useAuth>);
  mockGetBanners.mockResolvedValue(banners);
  mockGetAnnouncements.mockResolvedValue({
    announcements,
    pagination: { total: announcements.length, page: 1, limit: 50, pages: 1 },
  });
  mockGetUnreadCount.mockResolvedValue(unreadCount);
  mockMarkAsRead.mockResolvedValue(undefined);
  mockMarkAllAsRead.mockResolvedValue(undefined);
}

/** Helper: set up unauthenticated mock responses (banners still available) */
function setupUnauthenticatedMocks(
  banners: ReturnType<typeof createMockAnnouncement>[] = []
) {
  mockUseAuth.mockReturnValue({ isAuthenticated: false } as ReturnType<typeof useAuth>);
  mockGetBanners.mockResolvedValue(banners);
}

describe('AnnouncementContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated with empty data
    setupAuthenticatedMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Basic data fetching ──────────────────────────────────────────────────

  it('fetches banners, announcements, and unread count on mount when authenticated', async () => {
    const banners = [createMockAnnouncement({ id: 'b1', type: 'banner' })];
    const announcements = [
      createMockAnnouncement({ id: 'a1', isRead: false }),
      createMockAnnouncement({ id: 'a2', isRead: true }),
    ];
    setupAuthenticatedMocks(banners, announcements, 1);

    const { result } = renderHook(() => useAnnouncement(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetBanners).toHaveBeenCalled();
    expect(mockGetAnnouncements).toHaveBeenCalledWith(1, 50);
    expect(mockGetUnreadCount).toHaveBeenCalled();
    expect(result.current.banners).toHaveLength(1);
    expect(result.current.announcements).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
  });

  it('fetches banners even without authentication (banners are public)', async () => {
    const banners = [createMockAnnouncement({ id: 'b1', type: 'banner' })];
    setupUnauthenticatedMocks(banners);

    const { result } = renderHook(() => useAnnouncement(), { wrapper });

    await waitFor(() => {
      expect(mockGetBanners).toHaveBeenCalled();
    });

    expect(result.current.banners).toHaveLength(1);
    expect(mockGetAnnouncements).not.toHaveBeenCalled();
    expect(mockGetUnreadCount).not.toHaveBeenCalled();
    expect(result.current.announcements).toHaveLength(0);
    expect(result.current.unreadCount).toBe(0);
  });

  // ─── markAsRead ──────────────────────────────────────────────────────────

  it('markAsRead performs optimistic update: sets isRead=true and decrements unreadCount', async () => {
    const announcement = createMockAnnouncement({ id: 'a1', isRead: false });
    setupAuthenticatedMocks([], [announcement], 1);

    const { result } = renderHook(() => useAnnouncement(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.announcements).toHaveLength(1);
    });

    expect(result.current.unreadCount).toBe(1);
    expect(result.current.announcements[0].isRead).toBe(false);

    await act(async () => {
      await result.current.markAsRead('a1');
    });

    expect(result.current.announcements[0].isRead).toBe(true);
    expect(result.current.announcements[0].readAt).not.toBeNull();
    expect(result.current.unreadCount).toBe(0);
    expect(mockMarkAsRead).toHaveBeenCalledWith('a1', false);
  });

  // ─── markAllAsRead ────────────────────────────────────────────────────────

  it('markAllAsRead performs optimistic update: all isRead=true, unreadCount=0', async () => {
    const announcements = [
      createMockAnnouncement({ id: 'a1', isRead: false }),
      createMockAnnouncement({ id: 'a2', isRead: false }),
    ];
    setupAuthenticatedMocks([], announcements, 2);

    const { result } = renderHook(() => useAnnouncement(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.announcements).toHaveLength(2);
    });

    expect(result.current.unreadCount).toBe(2);

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.announcements.every((a) => a.isRead)).toBe(true);
    expect(mockMarkAllAsRead).toHaveBeenCalled();
  });

  // ─── dismissUrgent ────────────────────────────────────────────────────────

  it('dismissUrgent calls markAsRead service with dismissed=true', async () => {
    const announcement = createMockAnnouncement({ id: 'a1', type: 'urgent', isRead: false });
    setupAuthenticatedMocks([], [announcement], 1);

    const { result } = renderHook(() => useAnnouncement(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.announcements).toHaveLength(1);
    });

    await act(async () => {
      await result.current.dismissUrgent('a1');
    });

    expect(mockMarkAsRead).toHaveBeenCalledWith('a1', true);
    expect(result.current.announcements[0].isRead).toBe(true);
    expect(result.current.announcements[0].dismissed).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  // ─── Polling ──────────────────────────────────────────────────────────────

  it('polls every 5 minutes (300000ms)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const { result } = renderHook(() => useAnnouncement(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const getBannersCallsAfterMount = mockGetBanners.mock.calls.length;

    // Advance time by exactly 5 minutes — triggers one poll interval
    await act(async () => {
      vi.advanceTimersByTime(300000);
    });

    expect(mockGetBanners.mock.calls.length).toBeGreaterThan(getBannersCallsAfterMount);
  });

  // ─── Unauthenticated — only banners ──────────────────────────────────────

  it('only fetches banners when not authenticated (announcements + unreadCount NOT called)', async () => {
    setupUnauthenticatedMocks([]);

    const { result } = renderHook(() => useAnnouncement(), { wrapper });

    await waitFor(() => {
      expect(mockGetBanners).toHaveBeenCalled();
    });

    // Allow any async effects to settle
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetAnnouncements).not.toHaveBeenCalled();
    expect(mockGetUnreadCount).not.toHaveBeenCalled();
    expect(result.current.announcements).toHaveLength(0);
    expect(result.current.unreadCount).toBe(0);
  });
});
