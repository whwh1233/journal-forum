import React, { useEffect, useRef } from 'react';
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useAnnouncement } from '@/contexts/AnnouncementContext';
import type { Announcement, ColorScheme } from '../types/announcement';
import './AnnouncementModal.css';

// 颜色方案对应的图标
const colorSchemeIcons: Record<ColorScheme, React.ReactNode> = {
  info: <Info size={28} />,
  success: <CheckCircle size={28} />,
  warning: <AlertTriangle size={28} />,
  danger: <AlertCircle size={28} />,
};

// 颜色方案对应的标签
const typeLabels: Record<string, string> = {
  normal: '系统公告',
  urgent: '紧急通知',
  banner: '重要公告',
};

// 格式化时间
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface AnnouncementModalProps {
  announcement: Announcement | null;
  mode: 'urgent' | 'detail';
  onClose: () => void;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  announcement,
  mode,
  onClose,
}) => {
  const { dismissUrgent, markAsRead } = useAnnouncement();
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // 渲染 Markdown 内容
  const renderContent = (content: string) => {
    const rawHtml = marked.parse(content, { async: false }) as string;
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ADD_ATTR: ['target', 'rel'],
    });
    // 为外部链接添加 target="_blank" 和 rel="noopener"
    const processedHtml = cleanHtml.replace(
      /<a href="(https?:\/\/[^"]+)"/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer"'
    );
    return { __html: processedHtml };
  };

  // Focus trap for urgent mode
  useEffect(() => {
    if (mode === 'urgent' && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [mode]);

  // Escape key handler (only for detail mode)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mode === 'detail') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mode, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // 处理关闭/确认
  const handleAction = async () => {
    if (!announcement) return;

    if (mode === 'urgent') {
      await dismissUrgent(announcement.id);
    } else {
      await markAsRead(announcement.id);
    }
    onClose();
  };

  // 点击遮罩层（仅 detail 模式可关闭）
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (mode === 'detail' && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!announcement) return null;

  const colorScheme = announcement.colorScheme || 'info';

  return (
    <div
      className="announcement-modal__overlay"
      onClick={handleOverlayClick}
      role={mode === 'urgent' ? 'alertdialog' : 'dialog'}
      aria-modal="true"
      aria-labelledby="announcement-modal-title"
    >
      <div ref={modalRef} className="announcement-modal">
        {/* Color stripe */}
        <div className={`announcement-modal__stripe announcement-modal__stripe--${colorScheme}`} />

        {/* Close button (detail mode only) */}
        {mode === 'detail' && (
          <button
            className="announcement-modal__close"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        )}

        {/* Icon */}
        <div className={`announcement-modal__icon announcement-modal__icon--${colorScheme}`}>
          {colorSchemeIcons[colorScheme]}
        </div>

        {/* Type label */}
        <span className={`announcement-modal__type announcement-modal__type--${colorScheme}`}>
          {typeLabels[announcement.type] || '公告'}
        </span>

        {/* Title */}
        <h2 id="announcement-modal-title" className="announcement-modal__title">
          {announcement.title}
        </h2>

        {/* Content */}
        <div
          className="announcement-modal__content"
          dangerouslySetInnerHTML={renderContent(announcement.content)}
        />

        {/* Meta */}
        <div className="announcement-modal__meta">
          <span>{formatDateTime(announcement.createdAt)}</span>
          {announcement.creatorName && (
            <>
              <span className="announcement-modal__separator">·</span>
              <span>{announcement.creatorName}</span>
            </>
          )}
        </div>

        {/* Action button */}
        <button
          ref={firstFocusableRef}
          className={`announcement-modal__button announcement-modal__button--${colorScheme}`}
          onClick={handleAction}
        >
          {mode === 'urgent' ? '我知道了' : '关闭'}
        </button>
      </div>
    </div>
  );
};

export default AnnouncementModal;
