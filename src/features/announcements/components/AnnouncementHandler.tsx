import React, { useState, useEffect, useCallback } from 'react';
import { useAnnouncement } from '@/contexts/AnnouncementContext';
import { useAuth } from '@/hooks/useAuth';
import AnnouncementBanner from './AnnouncementBanner';
import AnnouncementModal from './AnnouncementModal';
import type { Announcement } from '../types/announcement';

/**
 * AnnouncementHandler 组件
 * 统一处理：
 * 1. 紧急公告自动弹出队列
 * 2. Banner 点击打开详情
 * 3. Modal 显示状态管理
 */
const AnnouncementHandler: React.FC = () => {
  const { announcements } = useAnnouncement();
  const { isAuthenticated } = useAuth();

  // Modal 状态
  const [modalAnnouncement, setModalAnnouncement] = useState<Announcement | null>(null);
  const [modalMode, setModalMode] = useState<'urgent' | 'detail'>('detail');

  // 紧急公告队列
  const [urgentQueue, setUrgentQueue] = useState<Announcement[]>([]);
  const [processedUrgentIds, setProcessedUrgentIds] = useState<Set<string>>(new Set());

  // 检测并添加新的紧急公告到队列
  useEffect(() => {
    if (!isAuthenticated) return;

    const newUrgent = announcements.filter(
      (a) =>
        a.type === 'urgent' &&
        !a.isRead &&
        !a.dismissed &&
        !processedUrgentIds.has(a.id)
    );

    if (newUrgent.length > 0) {
      setUrgentQueue((prev) => [...prev, ...newUrgent]);
      setProcessedUrgentIds((prev) => {
        const next = new Set(prev);
        newUrgent.forEach((a) => next.add(a.id));
        return next;
      });
    }
  }, [announcements, isAuthenticated, processedUrgentIds]);

  // 处理紧急公告队列
  useEffect(() => {
    if (urgentQueue.length > 0 && !modalAnnouncement) {
      const [first, ...rest] = urgentQueue;
      setModalAnnouncement(first);
      setModalMode('urgent');
      setUrgentQueue(rest);
    }
  }, [urgentQueue, modalAnnouncement]);

  // Banner 点击
  const handleBannerClick = useCallback((announcement: Announcement) => {
    setModalAnnouncement(announcement);
    setModalMode('detail');
  }, []);

  // 关闭 Modal
  const handleCloseModal = useCallback(() => {
    setModalAnnouncement(null);
  }, []);

  return (
    <>
      <AnnouncementBanner onBannerClick={handleBannerClick} />

      {modalAnnouncement && (
        <AnnouncementModal
          announcement={modalAnnouncement}
          mode={modalMode}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default AnnouncementHandler;
