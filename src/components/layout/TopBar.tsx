import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import ThemeSwitcher from './ThemeSwitcher';
import UserDropdown from '@/components/common/UserDropdown';
import './TopBar.css';

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const { state: authState } = useAuthContext();
  const { openAuthModal } = useAuthModal();

  const user = authState.user;
  const isAuthenticated = authState.isAuthenticated;
  const userInitial = user ? (user.name || user.email)[0].toUpperCase() : '';
  const userName = user?.name || user?.email || '';

  return (
    <div className="top-bar">
      <div className="top-bar-right">
        <ThemeSwitcher />

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
