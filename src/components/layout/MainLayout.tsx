import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './MainLayout.css';

interface MainLayoutProps {
  onAuthClick: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  userEmail?: string;
  isAdmin?: boolean;
}

/**
 * MainLayout - 统一页面布局组件
 *
 * 页面结构规范：
 * ┌─────────────────────────────────┐
 * │           Header                │ ← 固定在顶部，包含导航
 * ├─────────────────────────────────┤
 * │                                 │
 * │           Main Content          │ ← 主内容区域，flex: 1
 * │         (通过 Outlet 渲染)       │
 * │                                 │
 * ├─────────────────────────────────┤
 * │           Footer                │ ← 固定在底部
 * └─────────────────────────────────┘
 *
 * 所有非管理后台页面都应使用此布局
 */
const MainLayout: React.FC<MainLayoutProps> = ({
  onAuthClick,
  onLogout,
  isAuthenticated,
  userEmail,
  isAdmin
}) => {
  return (
    <div className="main-layout">
      <Header
        onAuthClick={onAuthClick}
        onLogout={onLogout}
        isAuthenticated={isAuthenticated}
        userEmail={userEmail}
        isAdmin={isAdmin}
      />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
