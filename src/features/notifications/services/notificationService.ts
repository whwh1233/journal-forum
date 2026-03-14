import axios from 'axios';
import type {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from '../types/notification';

const API_URL = '/api/notifications';

// 获取认证头
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 获取通知列表
export const getNotifications = async (
  page: number = 1,
  limit: number = 20,
  type?: string
): Promise<NotificationListResponse> => {
  const params: Record<string, string | number> = { page, limit };
  if (type) params.type = type;
  const response = await axios.get(API_URL, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

// 获取未读数量
export const getUnreadCount = async (): Promise<number> => {
  const response = await axios.get<UnreadCountResponse>(
    `${API_URL}/unread-count`,
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data.data.count;
};

// 获取通知详情
export const getNotificationById = async (id: string): Promise<Notification> => {
  const response = await axios.get(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data.data;
};

// 标记为已读
export const markAsRead = async (id: string): Promise<void> => {
  await axios.post(`${API_URL}/${id}/read`, {}, {
    headers: getAuthHeaders(),
  });
};

// 标记全部已读
export const markAllAsRead = async (): Promise<void> => {
  await axios.post(`${API_URL}/read-all`, {}, {
    headers: getAuthHeaders(),
  });
};
