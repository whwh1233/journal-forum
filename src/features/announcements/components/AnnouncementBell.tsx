import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Check, Loader } from 'lucide-react';
import { useAnnouncement } from '@/contexts/AnnouncementContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import AnnouncementItem from './AnnouncementItem';
import AnnouncementModal from './AnnouncementModal';
import { NotificationItem } from '../../notifications/components/NotificationItem';
import { NotificationModal } from '../../notifications/components/NotificationModal';
import type { Announcement } from '../types/announcement';
import type { Notification as NotificationType } from '../../notifications/types/notification';
import './AnnouncementBell.css';

const AnnouncementBell: React.FC = () => {
  const {
    announcements,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useAnnouncement();

  const {
    notifications,
    unreadCount: notifUnreadCount,
    markAsRead: markNotifAsRead,
    markAllAsRead: markAllNotifAsRead,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [activeTab, setActiveTab] = useState<'notifications' | 'announcements'>('notifications');
  const [selectedNotification, setSelectedNotification] = useState<NotificationType | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const totalUnread = unreadCount + notifUnreadCount;

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
      setSelectedAnnouncement(announcement);
      setIsOpen(false);
    },
    [markAsRead]
  );

  // 关闭公告 Modal
  const handleCloseModal = useCallback(() => {
    setSelectedAnnouncement(null);
  }, []);

  // 点击通知项
  const handleNotificationClick = (notification: NotificationType) => {
    if (!notification.isRead) {
      markNotifAsRead(notification.id);
    }
    setSelectedNotification(notification);
  };

  // 全部已读（基于当前 tab）
  const handleMarkAllRead = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (activeTab === 'notifications') {
        await markAllNotifAsRead();
      } else {
        await markAllAsRead();
      }
    },
    [activeTab, markAllNotifAsRead, markAllAsRead]
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

  // 当前 tab 的未读数
  const currentTabUnread = activeTab === 'notifications' ? notifUnreadCount : unreadCount;

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
        {totalUnread > 0 && (
          <span className="announcement-bell__badge">
            {formatCount(totalUnread)}
          </span>
        )}
      </button>

      {isOpen && (
        <div ref={dropdownRef} className="announcement-bell__dropdown">
          <div className="announcement-bell__header">
            <div className="announcement-bell__title">
              <span>消息中心</span>
              {totalUnread > 0 && (
                <span className="announcement-bell__count">{totalUnread}</span>
              )}
            </div>
            {currentTabUnread > 0 && (
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

          <div className="announcement-bell__tabs">
            <button
              className={`announcement-bell__tab ${activeTab === 'notifications' ? 'announcement-bell__tab--active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              通知
              {notifUnreadCount > 0 && (
                <span className="announcement-bell__tab-badge">
                  {notifUnreadCount > 99 ? '99+' : notifUnreadCount}
                </span>
              )}
            </button>
            <button
              className={`announcement-bell__tab ${activeTab === 'announcements' ? 'announcement-bell__tab--active' : ''}`}
              onClick={() => setActiveTab('announcements')}
            >
              公告
              {unreadCount > 0 && (
                <span className="announcement-bell__tab-badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'notifications' ? (
            <div className="announcement-bell__list">
              {notifications.length === 0 ? (
                <div className="announcement-bell__empty">
                  <Bell size={32} strokeWidth={1.5} />
                  <p>暂无通知</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <NotificationItem key={n.id} notification={n} onClick={handleNotificationClick} />
                ))
              )}
            </div>
          ) : (
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
          )}
        </div>
      )}

      {selectedAnnouncement && (
        <AnnouncementModal
          announcement={selectedAnnouncement}
          mode="detail"
          onClose={handleCloseModal}
        />
      )}

      {selectedNotification && (
        <NotificationModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />
      )}
    </div>
  );
};

export default AnnouncementBell;
