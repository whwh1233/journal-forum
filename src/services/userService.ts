import axios from 'axios';
import type { UserProfile } from '../types';

const API_URL = 'http://localhost:3001/api/users';

// 获取用户资料
export const getUserProfile = async (userId: number): Promise<UserProfile> => {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(`${API_URL}/${userId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};

// 更新用户资料
export const updateUserProfile = async (data: {
  name?: string;
  bio?: string;
  location?: string;
  institution?: string;
  website?: string;
}): Promise<UserProfile> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('请先登录');
  }

  const response = await axios.put(`${API_URL}/profile`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// 上传头像
export const uploadAvatar = async (file: File): Promise<string> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('请先登录');
  }

  const formData = new FormData();
  formData.append('avatar', file);

  const response = await axios.post(`${API_URL}/avatar`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data.avatar;
};

// 修改密码
export const updatePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('请先登录');
  }

  await axios.put(
    `${API_URL}/password`,
    { currentPassword, newPassword },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
};

// 获取我的评论
export const getUserComments = async (page = 1, limit = 10) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('请先登录');
  }

  const response = await axios.get(`${API_URL}/me/comments`, {
    params: { page, limit },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// 获取我的收藏
export const getUserFavorites = async (page = 1, limit = 10) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('请先登录');
  }

  const response = await axios.get(`${API_URL}/me/favorites`, {
    params: { page, limit },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// 获取活动统计
export const getUserActivity = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('请先登录');
  }

  const response = await axios.get(`${API_URL}/me/activity`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
