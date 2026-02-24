import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import './UserDropdown.css';

interface UserDropdownProps {
  userName: string;
  userInitial: string;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ userName, userInitial }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { logout } = useAuthContext();

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // ESC 键关闭菜单
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      <button
        className="user-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="user-dropdown-avatar">{userInitial}</div>
        <span className="user-dropdown-name">{userName}</span>
        <svg className={`user-dropdown-icon ${isOpen ? 'open' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className="user-dropdown-menu" role="menu">
          <button
            className="user-dropdown-item"
            onClick={() => handleNavigate('/dashboard')}
            role="menuitem"
          >
            <span className="dropdown-icon">&#128100;</span>
            个人中心
          </button>
          <button
            className="user-dropdown-item"
            onClick={() => handleNavigate('/profile/edit')}
            role="menuitem"
          >
            <span className="dropdown-icon">&#9881;</span>
            账号设置
          </button>
          <div className="user-dropdown-divider" />
          <button
            className="user-dropdown-item logout"
            onClick={handleLogout}
            role="menuitem"
          >
            <span className="dropdown-icon">&#128682;</span>
            退出登录
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
