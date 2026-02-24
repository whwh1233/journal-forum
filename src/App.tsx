import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { JournalProvider } from '@/contexts/JournalContext';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthModalProvider, useAuthModal } from '@/contexts/AuthModalContext';
import AppLayout from '@/components/layout/AppLayout';
import SearchAndFilter from '@/features/journals/components/SearchAndFilter';
import JournalsGrid from '@/features/journals/components/JournalsGrid';
import AuthModal from '@/features/auth/components/AuthModal';
import ToastContainer from '@/components/common/Toast';
import {
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
 */
const HomeContent: React.FC = () => {
  return (
    <div className="home-content">
      <div className="container">
        <SearchAndFilter />
        <section className="journals-section">
          <h2>期刊列表</h2>
          <JournalsGrid />
        </section>
      </div>
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
  const { isAuthModalOpen, closeAuthModal } = useAuthModal();

  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
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

            {/* 管理后台路由 */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <UserManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/journals"
              element={
                <AdminRoute>
                  <JournalManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/comments"
              element={
                <AdminRoute>
                  <CommentManagement />
                </AdminRoute>
              }
            />
          </Route>
        </Routes>

      {/* 全局弹窗和通知 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onAuthSuccess={() => {}}
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
          <AuthModalProvider>
            <div className="app">
              <AppContent />
            </div>
          </AuthModalProvider>
        </ToastProvider>
      </JournalProvider>
    </AuthProvider>
  );
}

export default App;
