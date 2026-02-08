import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './AdminLayout.css';

interface AdminLayoutProps {
  onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2 className="admin-title">管理后台</h2>
        </div>

        <nav className="admin-nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">&#128202;</span>
            <span className="admin-nav-text">仪表盘</span>
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">&#128101;</span>
            <span className="admin-nav-text">用户管理</span>
          </NavLink>

          <NavLink
            to="/admin/journals"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">&#128214;</span>
            <span className="admin-nav-text">期刊管理</span>
          </NavLink>

          <NavLink
            to="/admin/comments"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">&#128172;</span>
            <span className="admin-nav-text">评论管理</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-back-button" onClick={handleBackToHome}>
            <span className="admin-nav-icon">&#127968;</span>
            <span className="admin-nav-text">返回首页</span>
          </button>
          <button className="admin-logout-button" onClick={handleLogout}>
            <span className="admin-nav-icon">&#128682;</span>
            <span className="admin-nav-text">退出登录</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
