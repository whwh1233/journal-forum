import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { Home, User, Settings, Shield, LogOut, Lock, BarChart2, Users, BookOpen, MessageSquare, ChevronRight, Award, Database } from 'lucide-react';
import './SideNav.css';

interface SideNavProps {
  expanded: boolean;
  onToggle: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ expanded, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: authState, logout } = useAuthContext();
  const { openAuthModal } = useAuthModal();

  const isAdmin = location.pathname.startsWith('/admin');
  const isAuthenticated = authState.isAuthenticated;
  const user = authState.user;
  const userInitial = user ? (user.name || user.email)[0].toUpperCase() : '';
  const userName = user?.name || user?.email || '';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navCls = `side-nav${expanded ? ' expanded' : ''}`;

  return (
    <nav className={navCls} aria-label={isAdmin ? '管理员导航' : '主导航'}>

      {/* 展开/折叠切换按钮 */}
      <button className="side-nav-toggle" onClick={onToggle} title={expanded ? '收起侧边栏' : '展开侧边栏'}>
        {expanded && <span className="side-nav-brand">期刊论坛</span>}
        <ChevronRight
          className="side-nav-toggle-icon"
          size={20}
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--duration-normal)'
          }}
          aria-hidden="true"
        />
      </button>

      {/* 主导航区 */}
      <div className="side-nav-top">

        {isAdmin ? (
          <>
            <NavLink to="/admin" end className={({ isActive }) => `side-nav-item${isActive ? ' active' : ''}`} title={expanded ? undefined : '仪表盘'}>
              <BarChart2 className="side-nav-icon" size={20} />
              <span className="side-nav-label">仪表盘</span>
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `side-nav-item${isActive ? ' active' : ''}`} title={expanded ? undefined : '用户管理'}>
              <Users className="side-nav-icon" size={20} />
              <span className="side-nav-label">用户管理</span>
            </NavLink>
            <NavLink to="/admin/journals" className={({ isActive }) => `side-nav-item${isActive ? ' active' : ''}`} title={expanded ? undefined : '期刊管理'}>
              <BookOpen className="side-nav-icon" size={20} />
              <span className="side-nav-label">期刊管理</span>
            </NavLink>
            <NavLink to="/admin/comments" className={({ isActive }) => `side-nav-item${isActive ? ' active' : ''}`} title={expanded ? undefined : '评论管理'}>
              <MessageSquare className="side-nav-icon" size={20} />
              <span className="side-nav-label">评论管理</span>
            </NavLink>
            <NavLink to="/admin/badges" className={({ isActive }) => `side-nav-item${isActive ? ' active' : ''}`} title={expanded ? undefined : '荣誉系统'}>
              <Award className="side-nav-icon" size={20} />
              <span className="side-nav-label">荣誉系统</span>
            </NavLink>
            {user?.role === 'superadmin' && (
              <NavLink to="/admin/database" className={({ isActive }) => `side-nav-item${isActive ? ' active' : ''}`} title={expanded ? undefined : '数据库管理'}>
                <Database className="side-nav-icon" size={20} />
                <span className="side-nav-label">数据库管理</span>
              </NavLink>
            )}
            <div className="side-nav-divider" />
            <NavLink to="/" className="side-nav-item" title={expanded ? undefined : '返回首页'}>
              <Home className="side-nav-icon" size={20} />
              <span className="side-nav-label">返回首页</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/" end className={({ isActive }) => `side-nav-item${isActive ? ' active' : ''}`} title={expanded ? undefined : '首页'}>
              <Home className="side-nav-icon" size={20} />
              <span className="side-nav-label">首页</span>
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/dashboard" className={({ isActive }) => `side-nav-item${isActive ? ' active' : ''}`} title={expanded ? undefined : '个人中心'}>
                <User className="side-nav-icon" size={20} />
                <span className="side-nav-label">个人中心</span>
              </NavLink>
            )}
            {isAuthenticated && (
              <div className="side-nav-divider" />
            )}
            {isAuthenticated && (
              <NavLink to="/profile/edit" className={({ isActive }) => `side-nav-item${isActive ? ' active' : ''}`} title={expanded ? undefined : '账号设置'}>
                <Settings className="side-nav-icon" size={20} />
                <span className="side-nav-label">账号设置</span>
              </NavLink>
            )}
            {isAuthenticated && (
              <NavLink to="/badges" className={({ isActive }) => `side-nav-item${isActive ? ' active' : ''}`} title={expanded ? undefined : '荣誉殿堂'}>
                <Award className="side-nav-icon" size={20} />
                <span className="side-nav-label">荣誉殿堂</span>
              </NavLink>
            )}
            {isAuthenticated && (user?.role === 'admin' || user?.role === 'superadmin') && (
              <NavLink to="/admin" className={({ isActive }) => `side-nav-item${isActive ? ' active' : ''}`} title={expanded ? undefined : '管理后台'}>
                <Shield className="side-nav-icon" size={20} />
                <span className="side-nav-label">管理后台</span>
              </NavLink>
            )}
          </>
        )}
      </div>

      {/* 底部用户区 */}
      <div className="side-nav-bottom">
        {isAuthenticated && (
          <button
            className="side-nav-item side-nav-btn"
            onClick={handleLogout}
            title={expanded ? undefined : '退出登录'}
          >
            <LogOut className="side-nav-icon" size={20} />
            <span className="side-nav-label">退出登录</span>
          </button>
        )}

        {isAuthenticated ? (
          <button
            className="side-nav-user side-nav-btn"
            onClick={() => navigate('/dashboard')}
            title={expanded ? undefined : userName}
          >
            <div className="side-nav-avatar">{userInitial}</div>
            <span className="side-nav-user-name">{userName}</span>
          </button>
        ) : (
          <button
            className="side-nav-item side-nav-btn"
            onClick={openAuthModal}
            title={expanded ? undefined : '登录'}
          >
            <Lock className="side-nav-icon" size={20} />
            <span className="side-nav-label">登录</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default SideNav;
