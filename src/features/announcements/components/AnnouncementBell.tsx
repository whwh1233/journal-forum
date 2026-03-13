import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Check, Loader } from 'lucide-react';
import { useAnnouncement } from '@/contexts/AnnouncementContext';
import AnnouncementItem from './AnnouncementItem';
import type { Announcement } from '../types/announcement';
import './AnnouncementBell.css';

interface AnnouncementBellProps {
  onAnnouncementClick?: (announcement: Announcement) => void;
}

const AnnouncementBell: React.FC<AnnouncementBellProps> = ({ onAnnouncementClick }) => {
  const {
    announcements,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useAnnouncement();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Escape 键关闭
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // 点击公告项
  const handleItemClick = useCallback(
    async (announcement: Announcement) => {
      if (!announcement.isRead) {
        await markAsRead(announcement.id);
      }
      onAnnouncementClick?.(announcement);
      setIsOpen(false);
    },
    [markAsRead, onAnnouncementClick]
  );

  // 全部已读
  const handleMarkAllRead = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      await markAllAsRead();
    },
    [markAllAsRead]
  );

  // 切换下拉
  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  // 格式化未读数
  const formatCount = (count: number) => {
    if (count > 99) return '99+';
    return count.toString();
  };

  return (
    <div className="announcement-bell">
      <button
        ref={buttonRef}
        className="announcement-bell__button"
        onClick={toggleDropdown}
        aria-label="公告通知"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="announcement-bell__badge">
            {formatCount(unreadCount)}
          </span>
        )}
      </button>

      {isOpen && (
        <div ref={dropdownRef} className="announcement-bell__dropdown">
          <div className="announcement-bell__header">
            <div className="announcement-bell__title">
              <span>公告通知</span>
              {unreadCount > 0 && (
                <span className="announcement-bell__count">{unreadCount}</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                className="announcement-bell__mark-all"
                onClick={handleMarkAllRead}
                disabled={loading}
              >
                {loading ? <Loader size={14} className="spinning" /> : <Check size={14} />}
                <span>全部已读</span>
              </button>
            )}
          </div>

          <div className="announcement-bell__list">
            {announcements.length === 0 ? (
              <div className="announcement-bell__empty">
                <Bell size={32} strokeWidth={1.5} />
                <p>暂无公告</p>
              </div>
            ) : (
              announcements.map((announcement) => (
                <AnnouncementItem
                  key={announcement.id}
                  announcement={announcement}
                  onClick={handleItemClick}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementBell;
