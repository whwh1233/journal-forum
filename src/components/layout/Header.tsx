import React from 'react';
import './Header.css';

interface HeaderProps {
  onAuthClick?: () => void;
  isAuthenticated?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onAuthClick, isAuthenticated }) => {
  return (
    <header className="header" role="banner">
      <div className="container">
        <h1 className="logo">期刊论坛</h1>
        <p className="tagline">学术期刊评价与交流平台</p>
        {onAuthClick && (
          <button
            className="auth-button"
            onClick={onAuthClick}
            aria-label={isAuthenticated ? '退出登录' : '登录或注册'}
          >
            {isAuthenticated ? '退出' : '登录/注册'}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;