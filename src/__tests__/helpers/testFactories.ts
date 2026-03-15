import type { Notification, NotificationType, EntityType, NotificationContent } from '@/features/notifications/types/notification';
import type { Announcement } from '@/features/announcements/types/announcement';

let counter = 0;
const nextId = () => `test-${++counter}-${Math.random().toString(36).slice(2, 8)}`;

export const createMockNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: nextId(),
  recipientId: 'recipient-1',
  senderId: 'sender-1',
  sender: { id: 'sender-1', name: 'Test Sender', avatar: undefined },
  type: 'comment_reply' as NotificationType,
  entityType: 'comment' as EntityType,
  entityId: 'entity-1',
  content: { title: 'Test notification', body: 'Test body' } as NotificationContent,
  isRead: false,
  readAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockAnnouncement = (overrides: Partial<Announcement> = {}): Announcement => ({
  id: nextId(),
  title: '测试公告',
  content: '测试内容',
  type: 'normal',
  status: 'active',
  targetType: 'all',
  targetRoles: null,
  targetUserIds: null,
  colorScheme: 'info',
  customColor: null,
  isPinned: false,
  priority: 0,
  startTime: null,
  endTime: null,
  creatorId: 'creator-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isRead: false,
  readAt: null,
  dismissed: false,
  ...overrides,
});

export const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: nextId(),
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  avatar: null,
  ...overrides,
});
