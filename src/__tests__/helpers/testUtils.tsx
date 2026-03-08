import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { JournalProvider } from '../../contexts/JournalContext';

// 包装所有provider的测试wrapper
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <JournalProvider>{children}</JournalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

// 自定义render函数
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// 只包装Router的简单wrapper
const RouterWrapper = ({ children }: { children: React.ReactNode }) => {
  return <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</BrowserRouter>;
};

const renderWithRouter = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: RouterWrapper, ...options });

// Mock用户数据
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  status: 'active',
};

export const mockAdminUser = {
  id: 2,
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
  status: 'active',
};

// Mock期刊数据
export const mockJournal = {
  id: 1,
  title: 'Test Journal',
  issn: '1234-5678',
  category: 'computer-science',
  rating: 4.5,
  description: 'Test journal description',
  reviews: [],
  createdAt: new Date().toISOString(),
};

// Mock评论数据
export const mockComment = {
  id: '1-1234567890-abc123',
  userId: 1,
  userName: 'Test User',
  journalId: 1,
  parentId: null,
  content: 'This is a test comment',
  rating: 5,
  createdAt: new Date().toISOString(),
  isDeleted: false,
};

// Mock API响应
export const createMockResponse = <T,>(data: T, success = true) => ({
  success,
  data,
});

export const createMockErrorResponse = (message: string) => ({
  success: false,
  message,
});

// 等待异步操作
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// 导出所有
export * from '@testing-library/react';
export { customRender as render, renderWithRouter };
