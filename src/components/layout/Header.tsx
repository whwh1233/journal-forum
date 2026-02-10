import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  onAuthClick?: () => void;
  onLogout?: () => void;
  isAuthenticated?: boolean;
  userEmail?: string;
  isAdmin?: boolean;
}

interface NavItem {
  path: string;
  label: string;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onAuthClick,
  onLogout,
  isAuthenticated,
  userEmail,
  isAdmin
}) => {
  const location = useLocation();

  // Navigation items
  const navItems: NavItem[] = [
    { path: '/', label: '首页' },
    { path: '/dashboard', label: '个人中心', requireAuth: true },
    { path: '/admin', label: '管理后台', requireAuth: true, requireAdmin: true },
  ];

  // Filter nav items based on auth status
  const visibleNavItems = navItems.filter(item => {
    if (item.requireAuth && !isAuthenticated) return false;
    if (item.requireAdmin && !isAdmin) return false;
    return true;
  });

  // Check if a path is active
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Get user initial for avatar
  const getUserInitial = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <header className="header" role="banner">
      <div className="header-container">
        {/* Left: Logo and tagline */}
        <div className="header-left">
          <Link to="/" className="logo-link">
            <h1 className="logo">期刊论坛</h1>
          </Link>
          <p className="tagline">学术期刊评价与交流平台</p>
        </div>

        {/* Center: Navigation */}
        <nav className="header-nav" role="navigation" aria-label="主导航">
          <ul className="nav-list">
            {visibleNavItems.map((item) => (
              <li key={item.path} className="nav-item">
                <Link
                  to={item.path}
                  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                >
                  {item.label}
                  {isActive(item.path) && (
                    <span className="nav-indicator" aria-hidden="true" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right: User area */}
        <div className="header-right">
          {isAuthenticated && userEmail ? (
            <div className="user-menu">
              <Link to="/dashboard" className="user-info-link">
                <div className="user-avatar">
                  {getUserInitial(userEmail)}
                </div>
                <span className="user-email">{userEmail}</span>
              </Link>
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
