// API基础URL
const API_URL = '';

import { localStorageUtils } from '../utils/localStorage';

// 认证服务
export const authService = {
  // 注册用户
  register: async (email: string, password: string): Promise<void> => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '注册失败');
    }

    const data = await response.json();
    localStorageUtils.saveUser(data.data.user.email, data.data.token);
    localStorage.setItem('userId', data.data.user.id.toString());
  },

  // 用户登录
  login: async (email: string, password: string): Promise<{ token: string; role: string; id: number | string }> => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '登录失败');
    }

    const data = await response.json();
    localStorage.setItem('userId', data.data.user.id.toString());
    return { token: data.data.token, role: data.data.user.role || 'user', id: data.data.user.id };
  },

  // 检查认证状态
  checkAuthStatus: async (): Promise<{ isAuthenticated: boolean; email?: string; role?: string; id?: string | number }> => {
    const token = localStorage.getItem('authToken');
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');

    if (token && userEmail) {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const role = data.data.user.role || userRole || 'user';
          const id = data.data.user.id || userId;
          localStorage.setItem('userRole', role);
          if (id) localStorage.setItem('userId', id.toString());
          return { isAuthenticated: true, email: userEmail, role, id };
        }
      } catch (error) {
        console.error('Auth status check failed:', error);
      }
    }

    return { isAuthenticated: false };
  },

  // 用户登出
  logout: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
  }
};