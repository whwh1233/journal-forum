import type { TagInfo } from '../features/posts/types/post';

const API_URL = '';

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }
  return response.json();
};

export const tagService = {
  // Public
  getTags: async (params?: { search?: string; sort?: string; page?: number; limit?: number }): Promise<{ tags: TagInfo[]; pagination: any }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const response = await fetch(`${API_URL}/api/tags?${searchParams}`);
    return handleResponse(response);
  },

  getHotTags: async (): Promise<{ tags: TagInfo[] }> => {
    const response = await fetch(`${API_URL}/api/tags/hot`);
    return handleResponse(response);
  },

  suggestTags: async (q: string): Promise<{ tags: TagInfo[] }> => {
    const response = await fetch(`${API_URL}/api/tags/suggest?q=${encodeURIComponent(q)}`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  createTag: async (name: string): Promise<{ tag: TagInfo & { isNew: boolean }; message: string }> => {
    const response = await fetch(`${API_URL}/api/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ name })
    });
    return handleResponse(response);
  },

  // Admin
  adminGetTags: async (params?: { status?: string; isOfficial?: string; search?: string; page?: number; limit?: number }): Promise<{ tags: any[]; pagination: any }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const response = await fetch(`${API_URL}/api/admin/tags?${searchParams}`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  adminCreateTag: async (name: string): Promise<{ tag: TagInfo }> => {
    const response = await fetch(`${API_URL}/api/admin/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ name })
    });
    return handleResponse(response);
  },

  adminUpdateTag: async (id: number, name: string): Promise<{ tag: TagInfo }> => {
    const response = await fetch(`${API_URL}/api/admin/tags/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ name })
    });
    return handleResponse(response);
  },

  adminDeleteTag: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/admin/tags/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    await handleResponse(response);
  },

  adminApproveTag: async (id: number): Promise<{ tag: TagInfo }> => {
    const response = await fetch(`${API_URL}/api/admin/tags/${id}/approve`, {
      method: 'PUT',
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  adminRejectTag: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/admin/tags/${id}/reject`, {
      method: 'PUT',
      headers: getAuthHeader()
    });
    await handleResponse(response);
  },

  adminBatchApprove: async (tagIds: number[]): Promise<void> => {
    const response = await fetch(`${API_URL}/api/admin/tags/batch-approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ tagIds })
    });
    await handleResponse(response);
  },

  adminBatchReject: async (tagIds: number[]): Promise<void> => {
    const response = await fetch(`${API_URL}/api/admin/tags/batch-reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ tagIds })
    });
    await handleResponse(response);
  },

  adminMergeTags: async (sourceId: number, targetId: number): Promise<{ message: string; migratedCount: number }> => {
    const response = await fetch(`${API_URL}/api/admin/tags/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ sourceId, targetId })
    });
    return handleResponse(response);
  }
};
