import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Info, AlertTriangle, CheckCircle, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAnnouncement } from '@/contexts/AnnouncementContext';
import type { Announcement, ColorScheme } from '../types/announcement';
import './AnnouncementBanner.css';

// 自动轮播间隔
const AUTO_ADVANCE_INTERVAL = 5000;

// 颜色方案对应的图标
const colorSchemeIcons: Record<ColorScheme, React.ReactNode> = {
  info: <Info size={16} />,
  success: <CheckCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  danger: <AlertCircle size={16} />,
};

// 颜色方案对应的标签
const colorSchemeLabels: Record<ColorScheme, string> = {
  info: '公告',
  success: '好消息',
  warning: '注意',
  danger: '重要',
};

interface AnnouncementBannerProps {
  onBannerClick?: (announcement: Announcement) => void;
}

const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ onBannerClick }) => {
  const { banners } = useAnnouncement();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 过滤已关闭的横幅
  const visibleBanners = banners.filter((b) => {
    const dismissed = sessionStorage.getItem(`dismissed-banner-${b.id}`);
    return !dismissed && !dismissedIds.has(b.id);
  });

  // 自动轮播
  const startAutoAdvance = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (visibleBanners.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % visibleBanners.length);
      }, AUTO_ADVANCE_INTERVAL);
    }
  }, [visibleBanners.length]);

  const stopAutoAdvance = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isPaused && visibleBanners.length > 1) {
      startAutoAdvance();
    }
    return () => stopAutoAdvance();
  }, [isPaused, startAutoAdvance, stopAutoAdvance, visibleBanners.length]);

  // 索引边界检查
  useEffect(() => {
    if (currentIndex >= visibleBanners.length && visibleBanners.length > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, visibleBanners.length]);

  // 关闭横幅
  const handleClose = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    sessionStorage.setItem(`dismissed-banner-${id}`, 'true');
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  // 点击横幅
  const handleBannerClick = (announcement: Announcement) => {
    onBannerClick?.(announcement);
  };

  // 前一个
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + visibleBanners.length) % visibleBanners.length);
  };

  // 后一个
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % visibleBanners.length);
  };

  if (visibleBanners.length === 0) {
    return null;
  }

  const currentBanner = visibleBanners[currentIndex % visibleBanners.length];
  if (!currentBanner) {
    return null;
  }

  const colorScheme = currentBanner.colorScheme || 'info';

  return (
    <div
      className={`announcement-banner announcement-banner--${colorScheme}`}
      role="alert"
      aria-live="polite"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={() => handleBannerClick(currentBanner)}
    >
      <div className="announcement-banner__content">
        <div className="announcement-banner__icon">
          {colorSchemeIcons[colorScheme]}
        </div>
        <span className="announcement-banner__label">
          {colorSchemeLabels[colorScheme]}
        </span>
        <span className="announcement-banner__title">{currentBanner.title}</span>
      </div>

      <div className="announcement-banner__controls">
        {visibleBanners.length > 1 && (
          <>
            <button
              className="announcement-banner__nav"
              onClick={handlePrev}
              aria-label="上一条"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="announcement-banner__dots">
              {visibleBanners.map((_, index) => (
                <span
                  key={index}
                  className={`announcement-banner__dot ${
                    index === currentIndex % visibleBanners.length ? 'announcement-banner__dot--active' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                />
              ))}
            </div>
            <button
              className="announcement-banner__nav"
              onClick={handleNext}
              aria-label="下一条"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
        <button
          className="announcement-banner__close"
          onClick={(e) => handleClose(e, currentBanner.id)}
          aria-label="关闭公告"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
