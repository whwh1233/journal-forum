import { useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const { state, login, register, logout, checkAuthStatus } = useAuthContext();

  const handleLogin = useCallback(async (email: string, password: string) => {
    await login({ email, password });
  }, [login]);

  const handleRegister = useCallback(async (email: string, password: string, confirmPassword: string) => {
    await register({ email, password, confirmPassword });
  }, [register]);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    login: handleLogin,
    register: handleRegister,
    logout,
    checkAuthStatus
  };
}