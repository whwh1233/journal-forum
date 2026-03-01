import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
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
        <ChevronDown className={`user-dropdown-icon ${isOpen ? 'open' : ''}`} size={12} />
      </button>

      {isOpen && (
        <div className="user-dropdown-menu" role="menu">
          <button
            className="user-dropdown-item"
            onClick={() => handleNavigate('/dashboard')}
            role="menuitem"
          >
            <User className="dropdown-icon" size={16} />
            个人中心
          </button>
          <button
            className="user-dropdown-item"
            onClick={() => handleNavigate('/profile/edit')}
            role="menuitem"
          >
            <Settings className="dropdown-icon" size={16} />
            账号设置
          </button>
          <div className="user-dropdown-divider" />
          <button
            className="user-dropdown-item logout"
            onClick={handleLogout}
            role="menuitem"
          >
            <LogOut className="dropdown-icon" size={16} />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
