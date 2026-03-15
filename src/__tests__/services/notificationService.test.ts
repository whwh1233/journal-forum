import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAllAsRead,
} from '@/features/notifications/services/notificationService';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

// Mock localStorage
const mockLocalStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage[key];
  }),
});

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);
    mockLocalStorage['authToken'] = 'test-token';
  });

  describe('getNotifications', () => {
    it('应该使用默认分页参数获取通知列表', async () => {
      const mockResponse = {
        success: true,
        data: {
          notifications: [],
          pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
        },
      };
      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await getNotifications();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/notifications', {
        headers: { Authorization: 'Bearer test-token' },
        params: { page: 1, limit: 20 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('应该在提供 type 时包含 type 参数', async () => {
      const mockResponse = {
        success: true,
        data: {
          notifications: [],
          pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
        },
      };
      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      await getNotifications(2, 10, 'comment_reply');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/notifications', {
        headers: { Authorization: 'Bearer test-token' },
        params: { page: 2, limit: 10, type: 'comment_reply' },
      });
    });

    it('没有 token 时不应该发送 Authorization 头', async () => {
      delete mockLocalStorage['authToken'];

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { notifications: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } },
        },
      });

      await getNotifications();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/notifications', {
        headers: {},
        params: { page: 1, limit: 20 },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('应该返回未读通知数量', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { data: { count: 7 } } });

      const result = await getUnreadCount();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/notifications/unread-count', {
        headers: { Authorization: 'Bearer test-token' },
      });
      expect(result).toBe(7);
    });
  });

  describe('getNotificationById', () => {
    it('应该获取单条通知详情', async () => {
      const mockNotification = {
        id: 'notif-1',
        recipientId: 'user-1',
        senderId: 'sender-1',
        sender: { id: 'sender-1', name: 'Sender' },
        type: 'comment_reply',
        entityType: 'comment',
        entityId: 'entity-1',
        content: { title: 'Test', body: 'Body' },
        isRead: false,
        readAt: null,
        createdAt: '2026-03-15T10:00:00.000Z',
        updatedAt: '2026-03-15T10:00:00.000Z',
      };
      mockedAxios.get.mockResolvedValueOnce({ data: { data: mockNotification } });

      const result = await getNotificationById('notif-1');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/notifications/notif-1', {
        headers: { Authorization: 'Bearer test-token' },
      });
      expect(result).toEqual(mockNotification);
    });
  });

  describe('markAsRead', () => {
    it('应该向正确的端点发送 POST 请求', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      await markAsRead('notif-1');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/notifications/notif-1/read',
        {},
        { headers: { Authorization: 'Bearer test-token' } }
      );
    });
  });

  describe('markAllAsRead', () => {
    it('应该向 read-all 端点发送 POST 请求', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      await markAllAsRead();

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/notifications/read-all',
        {},
        { headers: { Authorization: 'Bearer test-token' } }
      );
    });
  });

  describe('错误处理', () => {
    it('网络错误应该向上传播', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValueOnce(networkError);

      await expect(getNotifications()).rejects.toThrow('Network Error');
    });

    it('401 错误应该向上传播', async () => {
      const authError = Object.assign(new Error('Unauthorized'), {
        response: { status: 401, data: { message: 'Unauthorized' } },
      });
      mockedAxios.get.mockRejectedValueOnce(authError);

      await expect(getUnreadCount()).rejects.toThrow('Unauthorized');
    });
  });
});
