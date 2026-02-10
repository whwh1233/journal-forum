import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { JournalProvider } from '@/contexts/JournalContext';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import MainLayout from '@/components/layout/MainLayout';
import SearchAndFilter from '@/features/journals/components/SearchAndFilter';
import JournalsGrid from '@/features/journals/components/JournalsGrid';
import AuthModal from '@/features/auth/components/AuthModal';
import ToastContainer from '@/components/common/Toast';
import PageTransition from '@/components/common/PageTransition';
import {
  AdminLayout,
  Dashboard,
  UserManagement,
  JournalManagement,
  CommentManagement
} from '@/features/admin';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import ProfileEditPage from '@/features/profile/pages/ProfileEditPage';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import FollowListPage from '@/features/follow/pages/FollowListPage';
import './App.css';

/**
 * 首页内容组件
 * 只包含首页特有的内容，布局由 MainLayout 提供
 */
const HomeContent: React.FC = () => {
  return (
    <div className="container">
      <SearchAndFilter />
      <section className="journals-section">
        <h2>期刊列表</h2>
        <JournalsGrid />
      </section>
    </div>
  );
};

/**
 * 管理员路由保护组件
 */
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuthContext();

  if (!state.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (state.user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/**
 * 登录用户路由保护组件
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuthContext();

  if (!state.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/**
 * 主应用内容
 */
const AppContent: React.FC = () => {
  const { state: authState, logout } = useAuthContext();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleAuthClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    logout();
  };

  const handleAuthSuccess = () => {
    console.log('Authentication successful');
  };

  const isAdmin = authState.user?.role === 'admin';

  return (
    <>
      <PageTransition>
        <Routes>
          {/* 使用 MainLayout 的普通页面路由 */}
          <Route
            element={
              <MainLayout
                onAuthClick={handleAuthClick}
                onLogout={handleLogout}
                isAuthenticated={authState.isAuthenticated}
                userEmail={authState.user?.email}
                isAdmin={isAdmin}
              />
            }
          >
            {/* 首页 */}
            <Route path="/" element={<HomeContent />} />

            {/* 用户资料页 */}
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/profile/:userId/follows" element={<FollowListPage />} />

            {/* 需要登录的页面 */}
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <ProfileEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 管理后台 - 使用独立的 AdminLayout */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout onLogout={handleLogout} />
              </AdminRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="journals" element={<JournalManagement />} />
            <Route path="comments" element={<CommentManagement />} />
          </Route>
        </Routes>
      </PageTransition>

      {/* 全局弹窗和通知 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
      <ToastContainer />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <JournalProvider>
        <ToastProvider>
          <div className="app">
            <AppContent />
          </div>
        </ToastProvider>
      </JournalProvider>
    </AuthProvider>
  );
}

export default App;
