import axios from 'axios';
import type { Comment, DimensionRatings, RatingSummary } from '../types';

const API_URL = '/api/comments';

// 获取期刊的所有评论
export const getCommentsByJournalId = async (
  journalId: string,
  sort: 'newest' | 'oldest' | 'rating' | 'helpful' = 'newest'
): Promise<Comment[]> => {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(`${API_URL}/journal/${journalId}`, {
    params: { sort },
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};

// 创建评论或回复
export const createComment = async (data: {
  journalId: string;
  parentId?: string | null;
  content: string;
  rating?: number;
  dimensionRatings?: DimensionRatings;
}): Promise<Comment> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('请先登录');
  }

  const response = await axios.post(API_URL, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// 更新评论
export const updateComment = async (
  commentId: string,
  content: string
): Promise<Comment> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('请先登录');
  }

  const response = await axios.put(
    `${API_URL}/${commentId}`,
    { content },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};

// 删除评论
export const deleteComment = async (commentId: string): Promise<void> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('请先登录');
  }

  await axios.delete(`${API_URL}/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// 点赞/取消点赞评论
export const likeComment = async (commentId: string): Promise<{ liked: boolean; likeCount: number }> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('请先登录');
  }
  const response = await axios.post(`${API_URL}/${commentId}/like`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// 获取期刊多维评分汇总
export const getRatingSummary = async (journalId: string): Promise<RatingSummary> => {
  const response = await axios.get(`${API_URL}/journal/${journalId}/ratings`);
  return response.data;
};

