import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  onAuthClick?: () => void;
  onLogout?: () => void;
  isAuthenticated?: boolean;
  userEmail?: string;
  isAdmin?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onAuthClick,
  onLogout,
  isAuthenticated,
  userEmail,
  isAdmin
}) => {
  const navigate = useNavigate();

  // 获取用户首字母作为头像
  const getUserInitial = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  return (
    <header className="header" role="banner">
      <div className="header-container">
        {/* 左侧: Logo 和副标题 */}
        <div className="header-left">
          <h1 className="logo">期刊论坛</h1>
          <p className="tagline">学术期刊评价与交流平台</p>
        </div>

        {/* 右侧: 用户区域 */}
        <div className="header-right">
          {isAuthenticated && userEmail ? (
            <div className="user-menu">
              <div className="user-avatar">
                {getUserInitial(userEmail)}
              </div>
              <span className="user-email">{userEmail}</span>
              <button
                className="dashboard-button"
                onClick={handleDashboardClick}
                aria-label="个人中心"
              >
                个人中心
              </button>
              {isAdmin && (
                <button
                  className="admin-button"
                  onClick={handleAdminClick}
                  aria-label="管理后台"
                >
                  管理后台
                </button>
              )}
              <button
                className="logout-button"
                onClick={onLogout}
                aria-label="退出登录"
              >
                退出
              </button>
            </div>
          ) : (
            onAuthClick && (
              <button
                className="auth-button"
                onClick={onAuthClick}
                aria-label="登录或注册"
              >
                登录/注册
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
