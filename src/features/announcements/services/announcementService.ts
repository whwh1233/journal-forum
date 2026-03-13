import axios from 'axios';
import type {
  Announcement,
  AnnouncementListResponse,
  AdminAnnouncementListResponse,
  CreateAnnouncementData,
  UpdateAnnouncementData,
  AdminAnnouncementFilters,
} from '../types/announcement';

const API_URL = '/api/announcements';
const ADMIN_API_URL = '/api/admin/announcements';

// 获取认证头
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ========== 公共接口 ==========

// 获取横幅公告（无需认证）
export const getBanners = async (): Promise<Announcement[]> => {
  const response = await axios.get(`${API_URL}/banners`);
  return response.data.data;
};

// ========== 用户接口 ==========

// 获取公告列表
export const getAnnouncements = async (
  page: number = 1,
  limit: number = 20
): Promise<AnnouncementListResponse> => {
  const response = await axios.get(API_URL, {
    params: { page, limit },
    headers: getAuthHeaders(),
  });
  return response.data.data;
};

// 获取未读数量
export const getUnreadCount = async (): Promise<number> => {
  const response = await axios.get(`${API_URL}/unread-count`, {
    headers: getAuthHeaders(),
  });
  return response.data.data.count;
};

// 获取公告详情
export const getAnnouncementById = async (id: string): Promise<Announcement> => {
  const response = await axios.get(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data.data;
};

// 标记为已读
export const markAsRead = async (
  id: string,
  dismissed: boolean = false
): Promise<void> => {
  await axios.post(
    `${API_URL}/${id}/read`,
    { dismissed },
    { headers: getAuthHeaders() }
  );
};

// 标记全部已读
export const markAllAsRead = async (): Promise<void> => {
  await axios.post(`${API_URL}/read-all`, {}, { headers: getAuthHeaders() });
};

// ========== 管理员接口 ==========

// 获取公告列表（管理员）
export const adminGetAnnouncements = async (
  filters: AdminAnnouncementFilters = {}
): Promise<AdminAnnouncementListResponse> => {
  const response = await axios.get(ADMIN_API_URL, {
    params: filters,
    headers: getAuthHeaders(),
  });
  return response.data.data;
};

// 获取公告详情（管理员）
export const adminGetAnnouncementById = async (
  id: string
): Promise<Announcement & { readCount: number; readPercentage: number }> => {
  const response = await axios.get(`${ADMIN_API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data.data;
};

// 创建公告
export const adminCreateAnnouncement = async (
  data: CreateAnnouncementData
): Promise<Announcement> => {
  const response = await axios.post(ADMIN_API_URL, data, {
    headers: getAuthHeaders(),
  });
  return response.data.data;
};

// 更新公告
export const adminUpdateAnnouncement = async (
  id: string,
  data: UpdateAnnouncementData
): Promise<Announcement> => {
  const response = await axios.put(`${ADMIN_API_URL}/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return response.data.data;
};

// 发布公告
export const adminPublishAnnouncement = async (
  id: string
): Promise<Announcement> => {
  const response = await axios.put(
    `${ADMIN_API_URL}/${id}/publish`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data.data;
};

// 归档公告
export const adminArchiveAnnouncement = async (
  id: string
): Promise<Announcement> => {
  const response = await axios.put(
    `${ADMIN_API_URL}/${id}/archive`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data.data;
};

// 删除公告
export const adminDeleteAnnouncement = async (id: string): Promise<void> => {
  await axios.delete(`${ADMIN_API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
};
