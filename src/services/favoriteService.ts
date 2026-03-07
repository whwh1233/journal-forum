import axios from 'axios';

const API_URL = 'http://localhost:3001/api/favorites';

// 添加收藏
export const addFavorite = async (journalId: number): Promise<void> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('请先登录');
  }

  await axios.post(API_URL, { journalId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// 取消收藏
export const removeFavorite = async (journalId: number): Promise<void> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('请先登录');
  }

  await axios.delete(`${API_URL}/${journalId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// 检查是否已收藏
export const checkFavorite = async (journalId: number): Promise<boolean> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return false;
  }

  try {
    const response = await axios.get(`${API_URL}/check/${journalId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.isFavorited;
  } catch (error) {
    return false;
  }
};

// 获取用户收藏列表
export const getUserFavorites = async (userId: number, page = 1, limit = 10) => {
  const response = await axios.get(`${API_URL}/user/${userId}`, {
    params: { page, limit }
  });
  return response.data;
};

// 切换收藏状态
export const toggleFavorite = async (journalId: number): Promise<{ favorited: boolean }> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('请先登录');
  }

  const isFavorited = await checkFavorite(journalId);

  if (isFavorited) {
    await removeFavorite(journalId);
    return { favorited: false };
  } else {
    await addFavorite(journalId);
    return { favorited: true };
  }
};
