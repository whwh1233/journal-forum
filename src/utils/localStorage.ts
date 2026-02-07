// 本地存储工具函数
export const localStorageUtils = {
  // 获取用户信息
  getUser: (): { email: string; token: string } | null => {
    const email = localStorage.getItem('userEmail');
    const token = localStorage.getItem('authToken');

    if (email && token) {
      return { email, token };
    }

    return null;
  },

  // 保存用户信息
  saveUser: (email: string, token: string): void => {
    localStorage.setItem('userEmail', email);
    localStorage.setItem('authToken', token);
  },

  // 清除用户信息
  clearUser: (): void => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('authToken');
  },

  // 检查是否已认证
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken') && !!localStorage.getItem('userEmail');
  }
};