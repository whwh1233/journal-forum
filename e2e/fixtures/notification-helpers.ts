/**
 * Notification & Announcement E2E helpers
 *
 * API helpers use the backend directly (no browser); UI helpers drive Playwright.
 * All E2E-created announcements are prefixed with "[E2E]" so cleanup is reliable.
 */

import { Page } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:3001';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LoginResult {
  token: string;
  userId: string;
}

export interface AnnouncementData {
  title?: string;
  content?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
  isPinned?: boolean;
  priority?: number;
  target?: 'all' | 'roles' | 'users';
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

/**
 * Login via API and return { token, userId }.
 */
export async function apiLogin(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`apiLogin failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const token: string = data.token || data.data?.token;
  const userId: string = String(data.user?.id || data.data?.user?.id || '');

  if (!token) {
    throw new Error(`apiLogin: no token in response: ${JSON.stringify(data)}`);
  }

  return { token, userId };
}

/**
 * Create an announcement via API.
 * Title defaults to "[E2E] Test Announcement" so cleanup can target it.
 */
export async function apiCreateAnnouncement(
  token: string,
  data: AnnouncementData = {}
): Promise<{ id: string; status: string }> {
  const body = {
    title: data.title ?? '[E2E] Test Announcement',
    content: data.content ?? 'E2E test announcement content.',
    type: data.type ?? 'info',
    isPinned: data.isPinned ?? false,
    priority: data.priority ?? 0,
    target: data.target ?? 'all',
  };

  const res = await fetch(`${BASE_URL}/api/admin/announcements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`apiCreateAnnouncement failed: ${res.status} ${await res.text()}`);
  }

  const result = await res.json();
  const announcement = result.data || result;
  return { id: String(announcement.id), status: announcement.status || 'draft' };
}

/**
 * Publish an announcement by ID.
 */
export async function apiPublishAnnouncement(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/announcements/${id}/publish`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`apiPublishAnnouncement failed: ${res.status} ${await res.text()}`);
  }
}

/**
 * Delete an announcement by ID.
 * If the announcement is active or scheduled, archive it first (required before delete).
 */
export async function apiDeleteAnnouncement(
  token: string,
  id: string,
  currentStatus?: string
): Promise<void> {
  const status = currentStatus ?? await _getAnnouncementStatus(token, id);

  // Active or scheduled announcements must be archived before deletion
  if (status === 'active' || status === 'scheduled') {
    const archiveRes = await fetch(`${BASE_URL}/api/admin/announcements/${id}/archive`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!archiveRes.ok) {
      // Non-fatal: log and continue
      console.warn(`apiDeleteAnnouncement: archive step failed for id=${id}: ${archiveRes.status}`);
    }
  }

  const deleteRes = await fetch(`${BASE_URL}/api/admin/announcements/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!deleteRes.ok) {
    throw new Error(`apiDeleteAnnouncement failed: ${deleteRes.status} ${await deleteRes.text()}`);
  }
}

/**
 * Delete all announcements whose title starts with "[E2E]".
 */
export async function apiCleanupAnnouncements(token: string): Promise<void> {
  // Fetch all announcements (page 1, large limit)
  const res = await fetch(`${BASE_URL}/api/admin/announcements?page=1&limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.warn(`apiCleanupAnnouncements: list failed: ${res.status}`);
    return;
  }

  const data = await res.json();
  const items: Array<{ id: string | number; title: string; status: string }> =
    data.data?.announcements ?? data.data ?? data.announcements ?? [];

  const e2eItems = items.filter((a) => a.title?.startsWith('[E2E]'));

  for (const item of e2eItems) {
    try {
      await apiDeleteAnnouncement(token, String(item.id), item.status);
    } catch (err) {
      console.warn(`apiCleanupAnnouncements: failed to delete id=${item.id}: ${err}`);
    }
  }
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

/**
 * Login via browser UI.
 * Clicks the top-bar login button, fills the auth modal, submits, and waits
 * for the modal to close.
 */
export async function uiLogin(page: Page, email: string, password: string): Promise<void> {
  const loginBtn = page.locator('.top-bar-login-btn');

  // If the login button is visible, we are logged out — proceed
  if (await loginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await loginBtn.click();
    await page.waitForSelector('.auth-form', { timeout: 5000 });
    await page.locator('input#email').fill(email);
    await page.locator('input#password').fill(password);
    await page.locator('.auth-button').click();

    // Wait for the auth modal to disappear (login success)
    await page.waitForSelector('.auth-modal', { state: 'hidden', timeout: 8000 });
  }
  // If already logged in, do nothing
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/**
 * CSS selectors for the combined notification / announcement bell (AnnouncementBell).
 *
 * The bell lives in `.announcement-bell` and is only rendered when the user
 * is authenticated.  It contains two tabs:
 *   - "通知" (notifications tab) → shows NotificationItems + NotificationModal
 *   - "公告" (announcements tab) → shows AnnouncementItems + AnnouncementModal
 */
export const notifSelectors = {
  // Bell button (top-bar, auth-required)
  bell: {
    container: '.announcement-bell',
    button: '.announcement-bell__button',
    badge: '.announcement-bell__badge',
  },

  // Dropdown
  dropdown: {
    container: '.announcement-bell__dropdown',
    header: '.announcement-bell__header',
    title: '.announcement-bell__title',
    totalCount: '.announcement-bell__count',
    markAllBtn: '.announcement-bell__mark-all',
  },

  // Tabs inside the dropdown
  tabs: {
    container: '.announcement-bell__tabs',
    tab: '.announcement-bell__tab',
    tabActive: '.announcement-bell__tab--active',
    tabBadge: '.announcement-bell__tab-badge',
    notificationsTab: '.announcement-bell__tab:nth-child(1)',
    announcementsTab: '.announcement-bell__tab:nth-child(2)',
  },

  // List area (shared by both tabs)
  list: {
    container: '.announcement-bell__list',
    empty: '.announcement-bell__empty',
  },

  // Notification items (通知 tab)
  notificationItem: {
    container: '.notification-item',
    unread: '.notification-item--unread',
    indicator: '.notification-item__indicator',
    title: '.notification-item__title',
    preview: '.notification-item__preview',
    typeTag: '.notification-item__type-tag',
    time: '.notification-item__time',
  },

  // Notification detail modal
  notificationModal: {
    overlay: '.notification-modal__overlay',
    container: '.notification-modal',
    header: '.notification-modal__header',
    title: '.notification-modal__title',
    closeBtn: '.notification-modal__close',
    body: '.notification-modal__body',
    content: '.notification-modal__content',
    extras: '.notification-modal__extras',
    meta: '.notification-modal__meta',
    link: '.notification-modal__link',
  },

  // Announcement items (公告 tab) — from AnnouncementItem component
  announcementItem: {
    container: '.announcement-item',
    unread: '.announcement-item--unread',
    tag: '.announcement-item__tag',
    title: '.announcement-item__title',
    preview: '.announcement-item__preview',
  },

  // Announcement detail modal (public view)
  announcementModal: {
    overlay: '.announcement-modal__overlay',
    container: '.announcement-modal',
    closeBtn: '.announcement-modal__close',
    title: '.announcement-modal__title',
    content: '.announcement-modal__content',
    actionBtn: '.announcement-modal__button',
  },

  // Top-of-page banner
  banner: {
    container: '.announcement-banner',
    title: '.announcement-banner__title',
    closeBtn: '.announcement-banner__close',
  },
};

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

async function _getAnnouncementStatus(token: string, id: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/admin/announcements/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return 'draft';
  const data = await res.json();
  return (data.data || data)?.status ?? 'draft';
}
