import React from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { usePageContext } from '@/contexts/PageContext';
import ThemePicker from '@/components/common/ThemePicker';
import UserDropdown from '@/components/common/UserDropdown';
import './TopBar.css';

const TopBar: React.FC = () => {
  const { state: authState } = useAuthContext();
  const { openAuthModal } = useAuthModal();
  const { title } = usePageContext();

  const user = authState.user;
  const isAuthenticated = authState.isAuthenticated;
  const userInitial = user ? (user.name || user.email)[0].toUpperCase() : '';
  const userName = user?.name || user?.email || '';

  return (
    <div className="top-bar">
      <h1 className="top-bar-title">{title}</h1>
      <div className="top-bar-right">
        <ThemePicker />

        {isAuthenticated ? (
          <UserDropdown userName={userName} userInitial={userInitial} />
        ) : (
          <button className="top-bar-login-btn" onClick={openAuthModal}>
            登录 / 注册
          </button>
        )}
      </div>
    </div>
  );
};

export default TopBar;
