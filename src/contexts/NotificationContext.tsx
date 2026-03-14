import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Notification } from '../features/notifications/types/notification';
import * as notificationService from '../features/notifications/services/notificationService';

// 轮询间隔：60秒
const POLLING_INTERVAL = 60 * 1000;

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 刷新通知列表和未读数
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const [listResponse, count] = await Promise.all([
        notificationService.getNotifications(1, 20),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(listResponse.data.notifications);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // 标记单条已读
  const markAsRead = useCallback(
    async (id: string) => {
      if (!isAuthenticated) return;

      // 乐观更新
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await notificationService.markAsRead(id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
        // 失败时回滚
        await refreshNotifications();
      }
    },
    [isAuthenticated, refreshNotifications]
  );

  // 标记全部已读
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;

    const prevNotifications = notifications;
    const prevCount = unreadCount;

    // 乐观更新
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      // 失败时回滚
      setNotifications(prevNotifications);
      setUnreadCount(prevCount);
    }
  }, [isAuthenticated, notifications, unreadCount]);

  // 轮询刷新（只获取未读数）
  const pollRefresh = useCallback(async () => {
    if (!isAuthenticated || document.visibilityState !== 'visible') return;

    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Notification poll failed:', error);
    }
  }, [isAuthenticated]);

  // 初始化和认证状态变化
  useEffect(() => {
    if (isAuthenticated) {
      refreshNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, refreshNotifications]);

  // 设置轮询
  useEffect(() => {
    if (!isAuthenticated) return;

    pollingRef.current = setInterval(pollRefresh, POLLING_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isAuthenticated, pollRefresh]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
