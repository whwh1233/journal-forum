import { AdminStats, AdminUser, AdminComment, PaginationInfo, Journal } from '../types';

const API_URL = '';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const adminService = {
  // 获取统计数据
  getStats: async (): Promise<AdminStats> => {
    const response = await fetch(`${API_URL}/api/admin/stats`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '获取统计数据失败');
    }

    const data = await response.json();
    return data.data;
  },

  // 获取用户列表
  getUsers: async (search?: string, page: number = 1, limit: number = 10): Promise<{ users: AdminUser[]; pagination: PaginationInfo }> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await fetch(`${API_URL}/api/admin/users?${params}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '获取用户列表失败');
    }

    const data = await response.json();
    return data.data;
  },

  // 更新用户状态
  updateUserStatus: async (userId: number, status: 'active' | 'disabled'): Promise<void> => {
    const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '更新用户状态失败');
    }
  },

  // 删除用户
  deleteUser: async (userId: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '删除用户失败');
    }
  },

  // 获取评论列表
  getComments: async (search?: string, page: number = 1, limit: number = 10): Promise<{ comments: AdminComment[]; pagination: PaginationInfo }> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await fetch(`${API_URL}/api/admin/comments?${params}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '获取评论列表失败');
    }

    const data = await response.json();
    return data.data;
  },

  // 删除评论
  deleteComment: async (commentId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/api/admin/comments/${commentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '删除评论失败');
    }
  },

  // 创建期刊
  createJournal: async (journal: { title: string; issn: string; category: string; description?: string }): Promise<Journal> => {
    const response = await fetch(`${API_URL}/api/admin/journals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(journal),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '创建期刊失败');
    }

    const data = await response.json();
    return data.data.journal;
  },

  // 更新期刊
  updateJournal: async (journalId: number, journal: { title?: string; issn?: string; category?: string; description?: string }): Promise<Journal> => {
    const response = await fetch(`${API_URL}/api/admin/journals/${journalId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(journal),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '更新期刊失败');
    }

    const data = await response.json();
    return data.data.journal;
  },

  // 删除期刊
  deleteJournal: async (journalId: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/admin/journals/${journalId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '删除期刊失败');
    }
  },
};
