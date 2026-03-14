import type { PostCategoryInfo } from '../features/posts/types/post';

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

export const postCategoryService = {
  getCategories: async (): Promise<{ categories: PostCategoryInfo[] }> => {
    const response = await fetch(`${API_URL}/api/post-categories`);
    return handleResponse(response);
  },

  adminGetCategories: async (): Promise<{ categories: PostCategoryInfo[] }> => {
    const response = await fetch(`${API_URL}/api/admin/post-categories`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  adminCreateCategory: async (data: { name: string; slug: string; description?: string }): Promise<{ category: PostCategoryInfo }> => {
    const response = await fetch(`${API_URL}/api/admin/post-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  adminUpdateCategory: async (id: number, data: { name?: string; slug?: string; description?: string }): Promise<{ category: PostCategoryInfo }> => {
    const response = await fetch(`${API_URL}/api/admin/post-categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  adminToggleCategory: async (id: number): Promise<{ category: PostCategoryInfo }> => {
    const response = await fetch(`${API_URL}/api/admin/post-categories/${id}/toggle`, {
      method: 'PUT',
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  adminReorderCategories: async (orderedIds: number[]): Promise<void> => {
    const response = await fetch(`${API_URL}/api/admin/post-categories/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ orderedIds })
    });
    await handleResponse(response);
  },

  adminMigrateCategory: async (id: number, targetCategoryId: number): Promise<{ message: string; migratedCount: number }> => {
    const response = await fetch(`${API_URL}/api/admin/post-categories/${id}/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ targetCategoryId })
    });
    return handleResponse(response);
  }
};
