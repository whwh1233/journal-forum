import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { JournalProvider } from '@/contexts/JournalContext';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SearchAndFilter from '@/features/journals/components/SearchAndFilter';
import JournalsGrid from '@/features/journals/components/JournalsGrid';
import AuthModal from '@/features/auth/components/AuthModal';
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
import './App.css';

// 首页内容组件
const HomePage: React.FC<{
  onAuthClick: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  userEmail?: string;
  isAdmin?: boolean;
}> = ({ onAuthClick, onLogout, isAuthenticated, userEmail, isAdmin }) => {
  return (
    <>
      <Header
        onAuthClick={onAuthClick}
        onLogout={onLogout}
        isAuthenticated={isAuthenticated}
        userEmail={userEmail}
        isAdmin={isAdmin}
      />
      <main className="main">
        <div className="container">
          <SearchAndFilter />
          <section className="journals-section">
            <h2>期刊列表</h2>
            <JournalsGrid />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};

// 管理员路由保护组件
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

// 内部组件用于访问auth context
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
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              onAuthClick={handleAuthClick}
              onLogout={handleLogout}
              isAuthenticated={authState.isAuthenticated}
              userEmail={authState.user?.email}
              isAdmin={isAdmin}
            />
          }
        />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<ProfileEditPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
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
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <JournalProvider>
        <div className="app">
          <AppContent />
        </div>
      </JournalProvider>
    </AuthProvider>
  );
}

export default App;
