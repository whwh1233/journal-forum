import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  getBanners,
  getAnnouncements,
  getUnreadCount,
  getAnnouncementById,
  markAsRead,
  markAllAsRead,
  adminGetAnnouncements,
  adminGetAnnouncementById,
  adminCreateAnnouncement,
  adminUpdateAnnouncement,
  adminPublishAnnouncement,
  adminArchiveAnnouncement,
  adminDeleteAnnouncement,
} from '@/features/announcements/services/announcementService';
import type { Announcement, CreateAnnouncementData } from '@/features/announcements/types/announcement';

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

// Mock announcement data
const mockAnnouncement: Announcement = {
  id: 'test-id',
  title: '测试公告',
  content: '测试内容',
  type: 'normal',
  status: 'active',
  targetType: 'all',
  colorScheme: 'info',
  isPinned: false,
  priority: 0,
  createdAt: '2026-03-13T10:00:00.000Z',
  updatedAt: '2026-03-13T10:00:00.000Z',
  creatorId: 'creator-1',
  isRead: false,
};

describe('announcementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);
  });

  describe('公共接口', () => {
    describe('getBanners', () => {
      it('应该获取横幅公告列表', async () => {
        const mockBanners = [mockAnnouncement];
        mockedAxios.get.mockResolvedValueOnce({ data: { data: mockBanners } });

        const result = await getBanners();

        expect(mockedAxios.get).toHaveBeenCalledWith('/api/announcements/banners');
        expect(result).toEqual(mockBanners);
      });
    });
  });

  describe('用户接口', () => {
    beforeEach(() => {
      mockLocalStorage['authToken'] = 'test-token';
    });

    describe('getAnnouncements', () => {
      it('应该获取公告列表', async () => {
        const mockResponse = {
          announcements: [mockAnnouncement],
          pagination: { total: 1, page: 1, limit: 20, pages: 1 },
        };
        mockedAxios.get.mockResolvedValueOnce({ data: { data: mockResponse } });

        const result = await getAnnouncements(1, 20);

        expect(mockedAxios.get).toHaveBeenCalledWith('/api/announcements', {
          params: { page: 1, limit: 20 },
          headers: { Authorization: 'Bearer test-token' },
        });
        expect(result).toEqual(mockResponse);
      });

      it('应该使用默认分页参数', async () => {
        const mockResponse = {
          announcements: [],
          pagination: { total: 0, page: 1, limit: 20, pages: 0 },
        };
        mockedAxios.get.mockResolvedValueOnce({ data: { data: mockResponse } });

        await getAnnouncements();

        expect(mockedAxios.get).toHaveBeenCalledWith('/api/announcements', {
          params: { page: 1, limit: 20 },
          headers: { Authorization: 'Bearer test-token' },
        });
      });
    });

    describe('getUnreadCount', () => {
      it('应该获取未读数量', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { data: { count: 5 } } });

        const result = await getUnreadCount();

        expect(mockedAxios.get).toHaveBeenCalledWith('/api/announcements/unread-count', {
          headers: { Authorization: 'Bearer test-token' },
        });
        expect(result).toBe(5);
      });
    });

    describe('getAnnouncementById', () => {
      it('应该获取公告详情', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { data: mockAnnouncement } });

        const result = await getAnnouncementById('test-id');

        expect(mockedAxios.get).toHaveBeenCalledWith('/api/announcements/test-id', {
          headers: { Authorization: 'Bearer test-token' },
        });
        expect(result).toEqual(mockAnnouncement);
      });
    });

    describe('markAsRead', () => {
      it('应该标记公告为已读', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

        await markAsRead('test-id');

        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/announcements/test-id/read',
          { dismissed: false },
          { headers: { Authorization: 'Bearer test-token' } }
        );
      });

      it('应该支持 dismissed 参数', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

        await markAsRead('test-id', true);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/announcements/test-id/read',
          { dismissed: true },
          { headers: { Authorization: 'Bearer test-token' } }
        );
      });
    });

    describe('markAllAsRead', () => {
      it('应该标记全部公告为已读', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

        await markAllAsRead();

        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/announcements/read-all',
          {},
          { headers: { Authorization: 'Bearer test-token' } }
        );
      });
    });
  });

  describe('管理员接口', () => {
    beforeEach(() => {
      mockLocalStorage['authToken'] = 'admin-token';
    });

    describe('adminGetAnnouncements', () => {
      it('应该获取管理员公告列表', async () => {
        const mockResponse = {
          announcements: [{ ...mockAnnouncement, readCount: 10, readPercentage: 50 }],
          pagination: { total: 1, page: 1, limit: 20, pages: 1 },
        };
        mockedAxios.get.mockResolvedValueOnce({ data: { data: mockResponse } });

        const result = await adminGetAnnouncements({ status: 'active' });

        expect(mockedAxios.get).toHaveBeenCalledWith('/api/admin/announcements', {
          params: { status: 'active' },
          headers: { Authorization: 'Bearer admin-token' },
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('adminGetAnnouncementById', () => {
      it('应该获取公告详情（包含阅读统计）', async () => {
        const mockDetail = { ...mockAnnouncement, readCount: 10, readPercentage: 50 };
        mockedAxios.get.mockResolvedValueOnce({ data: { data: mockDetail } });

        const result = await adminGetAnnouncementById('test-id');

        expect(mockedAxios.get).toHaveBeenCalledWith('/api/admin/announcements/test-id', {
          headers: { Authorization: 'Bearer admin-token' },
        });
        expect(result).toEqual(mockDetail);
      });
    });

    describe('adminCreateAnnouncement', () => {
      it('应该创建公告', async () => {
        const createData: CreateAnnouncementData = {
          title: '新公告',
          content: '新内容',
          type: 'normal',
          targetType: 'all',
          colorScheme: 'info',
        };
        mockedAxios.post.mockResolvedValueOnce({ data: { data: mockAnnouncement } });

        const result = await adminCreateAnnouncement(createData);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/admin/announcements',
          createData,
          { headers: { Authorization: 'Bearer admin-token' } }
        );
        expect(result).toEqual(mockAnnouncement);
      });
    });

    describe('adminUpdateAnnouncement', () => {
      it('应该更新公告', async () => {
        const updateData = { title: '更新后的标题' };
        mockedAxios.put.mockResolvedValueOnce({ data: { data: mockAnnouncement } });

        const result = await adminUpdateAnnouncement('test-id', updateData);

        expect(mockedAxios.put).toHaveBeenCalledWith(
          '/api/admin/announcements/test-id',
          updateData,
          { headers: { Authorization: 'Bearer admin-token' } }
        );
        expect(result).toEqual(mockAnnouncement);
      });
    });

    describe('adminPublishAnnouncement', () => {
      it('应该发布公告', async () => {
        const publishedAnnouncement = { ...mockAnnouncement, status: 'active' as const };
        mockedAxios.put.mockResolvedValueOnce({ data: { data: publishedAnnouncement } });

        const result = await adminPublishAnnouncement('test-id');

        expect(mockedAxios.put).toHaveBeenCalledWith(
          '/api/admin/announcements/test-id/publish',
          {},
          { headers: { Authorization: 'Bearer admin-token' } }
        );
        expect(result.status).toBe('active');
      });
    });

    describe('adminArchiveAnnouncement', () => {
      it('应该归档公告', async () => {
        const archivedAnnouncement = { ...mockAnnouncement, status: 'archived' as const };
        mockedAxios.put.mockResolvedValueOnce({ data: { data: archivedAnnouncement } });

        const result = await adminArchiveAnnouncement('test-id');

        expect(mockedAxios.put).toHaveBeenCalledWith(
          '/api/admin/announcements/test-id/archive',
          {},
          { headers: { Authorization: 'Bearer admin-token' } }
        );
        expect(result.status).toBe('archived');
      });
    });

    describe('adminDeleteAnnouncement', () => {
      it('应该删除公告', async () => {
        mockedAxios.delete.mockResolvedValueOnce({ data: { success: true } });

        await adminDeleteAnnouncement('test-id');

        expect(mockedAxios.delete).toHaveBeenCalledWith('/api/admin/announcements/test-id', {
          headers: { Authorization: 'Bearer admin-token' },
        });
      });
    });
  });

  describe('未认证状态', () => {
    it('没有 token 时不应该发送 Authorization 头', async () => {
      // 确保没有 token
      delete mockLocalStorage['authToken'];

      mockedAxios.get.mockResolvedValueOnce({ data: { data: [] } });

      await getBanners();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/announcements/banners');
    });
  });
});
