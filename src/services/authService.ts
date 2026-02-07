// API基础URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  },

  // 用户登录
  login: async (email: string, password: string): Promise<string> => {
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
    return data.data.token;
  },

  // 检查认证状态
  checkAuthStatus: async (): Promise<{ isAuthenticated: boolean; email?: string }> => {
    const token = localStorage.getItem('authToken');
    const userEmail = localStorage.getItem('userEmail');

    if (token && userEmail) {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          return { isAuthenticated: true, email: userEmail };
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
  }
};