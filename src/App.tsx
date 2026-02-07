import React, { useState } from 'react';
import { JournalProvider } from '@/contexts/JournalContext';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SearchAndFilter from '@/features/journals/components/SearchAndFilter';
import JournalsGrid from '@/features/journals/components/JournalsGrid';
import AuthModal from '@/features/auth/components/AuthModal';
import './App.css';

// 内部组件用于访问auth context
const AppContent: React.FC = () => {
  const { state: authState } = useAuthContext();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleAuthClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    // 认证成功后的处理
    console.log('Authentication successful');
  };

  return (
    <>
      <Header
        onAuthClick={handleAuthClick}
        isAuthenticated={authState.isAuthenticated}
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