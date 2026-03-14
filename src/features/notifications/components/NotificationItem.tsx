import React from 'react';
import type { Notification } from '../types/notification';
import './NotificationItem.css';

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

const TYPE_LABELS: Record<string, string> = {
  comment_reply: '回复',
  post_comment: '评论',
  post_comment_reply: '回复',
  like: '点赞',
  new_follower: '关注',
  follow_new_content: '动态',
  journal_new_comment: '期刊',
  badge_earned: '徽章',
  comment_deleted: '删除',
  submission_status: '投稿',
  system: '系统'
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
  const { content, isRead, type, createdAt } = notification;

  return (
    <div
      className={`notification-item ${!isRead ? 'notification-item--unread' : ''}`}
      onClick={() => onClick(notification)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(notification); }}
    >
      <div className={`notification-item__indicator ${!isRead ? 'notification-item__indicator--unread' : 'notification-item__indicator--read'}`} />
      <div className="notification-item__body">
        <div className="notification-item__title">{content.title}</div>
        {content.body && (
          <div className="notification-item__preview">
            {content.body.length > 80 ? content.body.substring(0, 80) + '...' : content.body}
          </div>
        )}
        <div className="notification-item__meta">
          <span className="notification-item__type-tag">{TYPE_LABELS[type] || type}</span>
          <span className="notification-item__time">{formatRelativeTime(createdAt)}</span>
        </div>
      </div>
    </div>
  );
};
