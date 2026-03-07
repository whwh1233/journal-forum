import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, LoginCredentials, RegisterData } from '../types';
import { authService } from '../services/authService';
import { localStorageUtils } from '../utils/localStorage';

// 认证状态类型
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Action类型
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CHECK_AUTH_STATUS'; payload: { isAuthenticated: boolean; email?: string; role?: string; id?: string | number } };

// 初始状态
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

// Reducer函数
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOGOUT':
      return { ...initialState, isAuthenticated: false };
    case 'CHECK_AUTH_STATUS':
      if (action.payload.isAuthenticated && action.payload.email) {
        return {
          ...state,
          user: {
            id: action.payload.id ? String(action.payload.id) : action.payload.email,
            email: action.payload.email,
            role: action.payload.role as 'user' | 'admin' || 'user'
          },
          isAuthenticated: true,
          loading: false
        };
      }
      return { ...state, isAuthenticated: false, loading: false };
    default:
      return state;
  }
}

// Context创建
const AuthContext = createContext<{
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}>({
  state: initialState,
  login: async () => { },
  register: async () => { },
  logout: () => { },
  clearError: () => { },
  checkAuthStatus: async () => { }
});

// Provider组件
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 登录函数
  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const { token, role, id } = await authService.login(credentials.email, credentials.password);
      const user: User = { id: id ? String(id) : credentials.email, email: credentials.email, role: role as 'user' | 'admin' };
      localStorageUtils.saveUser(credentials.email, token);
      localStorage.setItem('userRole', role);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error instanceof Error ? error.message : '登录失败'
      });
      throw error; // 抛出错误，阻止 onSuccess 被调用
    }
  };

  // 注册函数
  const register = async (data: RegisterData) => {
    if (data.password !== data.confirmPassword) {
      dispatch({ type: 'LOGIN_FAILURE', payload: '两次输入的密码不一致' });
      throw new Error('两次输入的密码不一致');
    }

    try {
      dispatch({ type: 'LOGIN_START' });
      await authService.register(data.email, data.password);
      // 注册成功后自动登录
      const { token, role, id } = await authService.login(data.email, data.password);
      const user: User = { id: id ? String(id) : data.email, email: data.email, role: role as 'user' | 'admin' };
      localStorageUtils.saveUser(data.email, token);
      localStorage.setItem('userRole', role);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error instanceof Error ? error.message : '注册失败'
      });
      throw error;
    }
  };

  // 登出函数
  const logout = () => {
    authService.logout();
    localStorageUtils.clearUser();
    dispatch({ type: 'LOGOUT' });
  };

  // 清除错误
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // 检查认证状态
  const checkAuthStatus = async () => {
    try {
      const authStatus = await authService.checkAuthStatus();
      dispatch({ type: 'CHECK_AUTH_STATUS', payload: authStatus });
    } catch (error) {
      dispatch({ type: 'CHECK_AUTH_STATUS', payload: { isAuthenticated: false } });
    }
  };

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        state,
        login,
        register,
        logout,
        clearError,
        checkAuthStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 自定义Hook
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}