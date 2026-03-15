import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act, render } from '@testing-library/react';
import React from 'react';
import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext';
import { createMockNotification } from '@/__tests__/helpers/testFactories';

// Mock notificationService
vi.mock('@/features/notifications/services/notificationService', () => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import * as notificationService from '@/features/notifications/services/notificationService';
import { useAuth } from '@/hooks/useAuth';

const mockGetNotifications = vi.mocked(notificationService.getNotifications);
const mockGetUnreadCount = vi.mocked(notificationService.getUnreadCount);
const mockMarkAsRead = vi.mocked(notificationService.markAsRead);
const mockMarkAllAsRead = vi.mocked(notificationService.markAllAsRead);
const mockUseAuth = vi.mocked(useAuth);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NotificationProvider>{children}</NotificationProvider>
);

/** Helper: set up default authenticated mock responses */
function setupAuthenticatedMocks(
  notifications: ReturnType<typeof createMockNotification>[] = [],
  unreadCount = 0
) {
  mockUseAuth.mockReturnValue({ isAuthenticated: true } as ReturnType<typeof useAuth>);
  mockGetNotifications.mockResolvedValue({
    success: true,
    data: {
      notifications,
      pagination: { total: notifications.length, page: 1, limit: 20, totalPages: 1 },
    },
  });
  mockGetUnreadCount.mockResolvedValue(unreadCount);
  mockMarkAsRead.mockResolvedValue(undefined);
  mockMarkAllAsRead.mockResolvedValue(undefined);
}

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated with empty list
    setupAuthenticatedMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Basic data fetching ──────────────────────────────────────────────────

  it('fetches notifications and unread count on mount when authenticated', async () => {
    const notifications = [
      createMockNotification({ id: 'n1' }),
      createMockNotification({ id: 'n2' }),
    ];
    setupAuthenticatedMocks(notifications, 2);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetNotifications).toHaveBeenCalledWith(1, 20);
    expect(mockGetUnreadCount).toHaveBeenCalled();
    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(2);
  });

  it('does NOT fetch when not authenticated', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false } as ReturnType<typeof useAuth>);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Wait for any potential async effects to settle
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetNotifications).not.toHaveBeenCalled();
    expect(mockGetUnreadCount).not.toHaveBeenCalled();
    expect(result.current.notifications).toHaveLength(0);
    expect(result.current.unreadCount).toBe(0);
  });

  // ─── markAsRead ──────────────────────────────────────────────────────────

  it('markAsRead performs optimistic update: sets isRead=true and decrements unreadCount', async () => {
    const notification = createMockNotification({ id: 'n1', isRead: false });
    setupAuthenticatedMocks([notification], 1);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.notifications).toHaveLength(1);
    });

    expect(result.current.unreadCount).toBe(1);
    expect(result.current.notifications[0].isRead).toBe(false);

    await act(async () => {
      await result.current.markAsRead('n1');
    });

    expect(result.current.notifications[0].isRead).toBe(true);
    expect(result.current.notifications[0].readAt).not.toBeNull();
    expect(result.current.unreadCount).toBe(0);
    expect(mockMarkAsRead).toHaveBeenCalledWith('n1');
  });

  it('markAsRead rolls back on failure by calling refreshNotifications', async () => {
    const notification = createMockNotification({ id: 'n1', isRead: false });
    setupAuthenticatedMocks([notification], 1);
    mockMarkAsRead.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.notifications).toHaveLength(1);
    });

    const callsBefore = mockGetNotifications.mock.calls.length;

    await act(async () => {
      await result.current.markAsRead('n1');
    });

    // refreshNotifications should have been called again after failure
    await waitFor(() => {
      expect(mockGetNotifications.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  // ─── markAllAsRead ────────────────────────────────────────────────────────

  it('markAllAsRead sets all notifications to isRead=true and unreadCount to 0', async () => {
    const notifications = [
      createMockNotification({ id: 'n1', isRead: false }),
      createMockNotification({ id: 'n2', isRead: false }),
    ];
    setupAuthenticatedMocks(notifications, 2);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.notifications).toHaveLength(2);
    });

    expect(result.current.unreadCount).toBe(2);

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every((n) => n.isRead)).toBe(true);
    expect(mockMarkAllAsRead).toHaveBeenCalled();
  });

  // ─── Polling ──────────────────────────────────────────────────────────────

  it('polls unread count every 60 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callsAfterMount = mockGetUnreadCount.mock.calls.length;

    // Advance time by exactly 60 seconds — triggers one poll interval
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });

    expect(mockGetUnreadCount.mock.calls.length).toBeGreaterThan(callsAfterMount);
  });

  it('skips poll when page is not visible', async () => {
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
      configurable: true,
    });

    vi.useFakeTimers({ shouldAdvanceTime: true });

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callsAfterMount = mockGetUnreadCount.mock.calls.length;

    // Advance 60s — poll fires but visibility guard should skip the API call
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });

    expect(mockGetUnreadCount.mock.calls.length).toBe(callsAfterMount);

    // Restore
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });
  });

  // ─── Error boundary ───────────────────────────────────────────────────────

  it('throws when useNotifications is used outside NotificationProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // useNotifications throws synchronously — catch it via a try/catch render
    let thrownError: unknown;
    const ThrowingComponent = () => {
      try {
        useNotifications();
      } catch (e) {
        thrownError = e;
      }
      return null;
    };

    render(<ThrowingComponent />);

    expect(thrownError).toBeInstanceOf(Error);
    expect((thrownError as Error).message).toBe(
      'useNotifications must be used within a NotificationProvider'
    );

    consoleError.mockRestore();
  });
});
