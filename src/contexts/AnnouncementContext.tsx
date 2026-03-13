import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import {
  getBanners,
  getAnnouncements,
  getUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
} from '../features/announcements/services/announcementService';
import { useAuth } from '../hooks/useAuth';
import type { Announcement } from '../features/announcements/types/announcement';

// 轮询间隔：5分钟
const POLLING_INTERVAL = 5 * 60 * 1000;

interface AnnouncementContextType {
  banners: Announcement[];
  announcements: Announcement[];
  unreadCount: number;
  loading: boolean;
  refreshBanners: () => Promise<void>;
  refreshAnnouncements: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissUrgent: (id: string) => Promise<void>;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(
  undefined
);

export const AnnouncementProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [banners, setBanners] = useState<Announcement[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 刷新横幅公告
  const refreshBanners = useCallback(async () => {
    try {
      const data = await getBanners();
      setBanners(data);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    }
  }, []);

  // 刷新公告列表和未读数
  const refreshAnnouncements = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const [listData, count] = await Promise.all([
        getAnnouncements(1, 50),
        getUnreadCount(),
      ]);
      setAnnouncements(listData.announcements);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // 标记单条已读
  const markAsRead = useCallback(
    async (id: string) => {
      if (!isAuthenticated) return;

      try {
        await apiMarkAsRead(id, false);
        // 乐观更新
        setAnnouncements((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, isRead: true, readAt: new Date().toISOString() } : a
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark as read:', error);
        // 失败时回滚
        await refreshAnnouncements();
      }
    },
    [isAuthenticated, refreshAnnouncements]
  );

  // 标记全部已读
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await apiMarkAllAsRead();
      // 乐观更新
      setAnnouncements((prev) =>
        prev.map((a) => ({ ...a, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      await refreshAnnouncements();
    }
  }, [isAuthenticated, refreshAnnouncements]);

  // 关闭紧急公告
  const dismissUrgent = useCallback(
    async (id: string) => {
      if (!isAuthenticated) return;

      try {
        await apiMarkAsRead(id, true);
        // 乐观更新
        setAnnouncements((prev) =>
          prev.map((a) =>
            a.id === id
              ? { ...a, isRead: true, dismissed: true, readAt: new Date().toISOString() }
              : a
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to dismiss urgent:', error);
        await refreshAnnouncements();
      }
    },
    [isAuthenticated, refreshAnnouncements]
  );

  // 轮询刷新
  const pollRefresh = useCallback(async () => {
    // 只在页面可见时刷新
    if (document.visibilityState !== 'visible') return;

    await refreshBanners();
    if (isAuthenticated) {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Polling failed:', error);
      }
    }
  }, [isAuthenticated, refreshBanners]);

  // 初始化和认证状态变化
  useEffect(() => {
    refreshBanners();

    if (isAuthenticated) {
      refreshAnnouncements();
    } else {
      setAnnouncements([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, refreshBanners, refreshAnnouncements]);

  // 设置轮询
  useEffect(() => {
    pollingRef.current = setInterval(pollRefresh, POLLING_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [pollRefresh]);

  return (
    <AnnouncementContext.Provider
      value={{
        banners,
        announcements,
        unreadCount,
        loading,
        refreshBanners,
        refreshAnnouncements,
        markAsRead,
        markAllAsRead,
        dismissUrgent,
      }}
    >
      {children}
    </AnnouncementContext.Provider>
  );
};

export const useAnnouncement = () => {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error('useAnnouncement must be used within an AnnouncementProvider');
  }
  return context;
};

export default AnnouncementContext;
