import React, { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import type { Notification } from '../types/notification';
import './NotificationModal.css';

interface NotificationModalProps {
  notification: Notification;
  onClose: () => void;
}

function getEntityLink(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null;

  const routes: Record<string, string> = {
    journal: `/journals/${entityId}`,
    comment: `/journals/${entityId}`,
    post: `/posts/${entityId}`,
    post_comment: `/posts/${entityId}`,
    badge: `/profile`,
    submission: `/submissions`
  };

  return routes[entityType] || null;
}

function getExtraFields(notification: Notification): Array<{ label: string; value: string }> {
  const { content } = notification;
  const extras: Array<{ label: string; value: string }> = [];

  if (content.journalTitle) extras.push({ label: '期刊', value: content.journalTitle });
  if (content.postTitle) extras.push({ label: '帖子', value: content.postTitle });
  if (content.badgeName) extras.push({ label: '徽章', value: content.badgeName });
  if (content.badgeDescription) extras.push({ label: '描述', value: content.badgeDescription });
  if (content.status) extras.push({ label: '状态', value: content.status });
  if (content.submissionTitle) extras.push({ label: '稿件', value: content.submissionTitle });
  if (content.reason) extras.push({ label: '原因', value: content.reason });
  if (content.commentContent) extras.push({ label: '评论内容', value: content.commentContent });

  return extras;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ notification, onClose }) => {
  const link = getEntityLink(notification.entityType, notification.entityId);
  const extras = getExtraFields(notification);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="notification-modal__overlay" onClick={onClose}>
      <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notification-modal__header">
          <h3 className="notification-modal__title">{notification.content.title}</h3>
          <button className="notification-modal__close" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="notification-modal__body">
          {notification.content.body && (
            <div className="notification-modal__content">{notification.content.body}</div>
          )}
          {extras.length > 0 && (
            <div className="notification-modal__extras">
              {extras.map((extra, i) => (
                <div key={i} className="notification-modal__extra-item">
                  <span className="notification-modal__extra-label">{extra.label}:</span>
                  {extra.value}
                </div>
              ))}
            </div>
          )}
          <div className="notification-modal__meta">
            <span>{new Date(notification.createdAt).toLocaleString('zh-CN')}</span>
            {link && (
              <a href={link} className="notification-modal__link" onClick={onClose}>
                查看原文 <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
