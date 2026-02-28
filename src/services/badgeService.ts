import axios from 'axios';
import type { Badge, UserBadgesResponse, MyBadgesResponse, BadgeStats } from '../types';

const API_URL = 'http://localhost:3001/api/badges';

// 获取认证头
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 获取所有启用的徽章定义
export const getAllBadges = async (): Promise<Badge[]> => {
  const response = await axios.get(API_URL);
  return response.data.data;
};

// 获取指定用户的徽章
export const getUserBadges = async (userId: number): Promise<UserBadgesResponse> => {
  const response = await axios.get(`${API_URL}/user/${userId}`);
  return response.data.data;
};

// 获取当前用户的徽章
export const getMyBadges = async (): Promise<MyBadgesResponse> => {
  const response = await axios.get(`${API_URL}/my`, {
    headers: getAuthHeaders()
  });
  return response.data.data;
};

// 设置置顶徽章
export const setPinnedBadges = async (badgeIds: number[]): Promise<Badge[]> => {
  const response = await axios.put(`${API_URL}/my/pinned`, { badgeIds }, {
    headers: getAuthHeaders()
  });
  return response.data.data.pinnedBadges;
};

// 标记徽章为已读
export const markBadgesAsRead = async (): Promise<number> => {
  const response = await axios.post(`${API_URL}/my/read`, {}, {
    headers: getAuthHeaders()
  });
  return response.data.data.markedCount;
};

// ========== 管理员接口 ==========

// 获取所有徽章（含禁用的）
export const adminGetAllBadges = async (): Promise<Badge[]> => {
  const response = await axios.get(`${API_URL}/admin/all`, {
    headers: getAuthHeaders()
  });
  return response.data.data;
};

// 创建徽章
export const createBadge = async (badge: Partial<Badge>): Promise<Badge> => {
  const response = await axios.post(`${API_URL}/admin`, badge, {
    headers: getAuthHeaders()
  });
  return response.data.data;
};

// 更新徽章
export const updateBadge = async (id: number, updates: Partial<Badge>): Promise<Badge> => {
  const response = await axios.put(`${API_URL}/admin/${id}`, updates, {
    headers: getAuthHeaders()
  });
  return response.data.data;
};

// 删除徽章
export const deleteBadge = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/admin/${id}`, {
    headers: getAuthHeaders()
  });
};

// 授予徽章
export const grantBadge = async (badgeId: number, userId: number): Promise<void> => {
  await axios.post(`${API_URL}/admin/${badgeId}/grant`, { userId }, {
    headers: getAuthHeaders()
  });
};

// 撤销徽章
export const revokeBadge = async (badgeId: number, userId: number): Promise<void> => {
  await axios.post(`${API_URL}/admin/${badgeId}/revoke`, { userId }, {
    headers: getAuthHeaders()
  });
};

// 获取徽章统计
export const getBadgeStats = async (): Promise<BadgeStats> => {
  const response = await axios.get(`${API_URL}/admin/stats`, {
    headers: getAuthHeaders()
  });
  return response.data.data;
};

// 批量授予徽章
export const batchGrantBadge = async (badgeId: number, userIds: number[]): Promise<void> => {
  await axios.post(`${API_URL}/admin/batch-grant`, { badgeId, userIds }, {
    headers: getAuthHeaders()
  });
};
