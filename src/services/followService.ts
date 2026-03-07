import axios from 'axios';

const API_URL = '/api/follows';

// 关注用户
export const followUser = async (followingId: number): Promise<void> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('请先登录');
  }

  await axios.post(API_URL, { followingId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// 取消关注
export const unfollowUser = async (followingId: number): Promise<void> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('请先登录');
  }

  await axios.delete(`${API_URL}/${followingId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// 检查是否已关注
export const checkFollow = async (followingId: number): Promise<boolean> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return false;
  }

  try {
    const response = await axios.get(`${API_URL}/check/${followingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data.isFollowing;
  } catch (error) {
    return false;
  }
};

// 获取粉丝列表
export const getFollowers = async (userId: number, page = 1, limit = 20) => {
  const response = await axios.get(`${API_URL}/followers/${userId}`, {
    params: { page, limit }
  });
  return response.data.data;
};

// 获取关注列表
export const getFollowing = async (userId: number, page = 1, limit = 20) => {
  const response = await axios.get(`${API_URL}/following/${userId}`, {
    params: { page, limit }
  });
  return response.data.data;
};
