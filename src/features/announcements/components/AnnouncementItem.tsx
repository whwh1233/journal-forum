import React from 'react';
import { Pin } from 'lucide-react';
import type { Announcement, ColorScheme } from '../types/announcement';
import './AnnouncementItem.css';

// 颜色方案对应的类型标签
const typeLabels: Record<string, string> = {
  normal: '公告',
  urgent: '紧急',
  banner: '横幅',
};

// 相对时间格式化
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHour < 24) return `${diffHour} 小时前`;
  if (diffDay < 30) return `${diffDay} 天前`;
  if (diffMonth < 12) return `${diffMonth} 个月前`;
  return `${diffYear} 年前`;
}

// 去除 Markdown 标记的简单实现
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '') // 标题
    .replace(/\*\*(.+?)\*\*/g, '$1') // 粗体
    .replace(/\*(.+?)\*/g, '$1') // 斜体
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 链接
    .replace(/`(.+?)`/g, '$1') // 行内代码
    .replace(/```[\s\S]*?```/g, '') // 代码块
    .replace(/>\s/g, '') // 引用
    .replace(/[-*+]\s/g, '') // 列表
    .replace(/\n/g, ' ')
    .trim();
}

interface AnnouncementItemProps {
  announcement: Announcement;
  onClick: (announcement: Announcement) => void;
}

const AnnouncementItem: React.FC<AnnouncementItemProps> = ({
  announcement,
  onClick,
}) => {
  const isUnread = !announcement.isRead;
  const colorScheme = announcement.colorScheme || 'info';
  const preview = stripMarkdown(announcement.content).slice(0, 100);

  return (
    <div
      className={`announcement-item ${isUnread ? 'announcement-item--unread' : ''}`}
      onClick={() => onClick(announcement)}
    >
      <div className="announcement-item__indicator">
        {isUnread && <span className="announcement-item__dot" />}
      </div>

      <div className="announcement-item__body">
        <div className="announcement-item__header">
          {announcement.isPinned && (
            <span className="announcement-item__pinned">
              <Pin size={12} />
            </span>
          )}
          <span className={`announcement-item__tag announcement-item__tag--${colorScheme}`}>
            {typeLabels[announcement.type] || '公告'}
          </span>
          <span className={`announcement-item__title ${isUnread ? 'announcement-item__title--unread' : ''}`}>
            {announcement.title}
          </span>
        </div>

        {preview && (
          <p className="announcement-item__preview">{preview}...</p>
        )}

        <div className="announcement-item__meta">
          <span>{formatRelativeTime(announcement.createdAt)}</span>
          {announcement.creatorName && (
            <>
              <span className="announcement-item__separator">·</span>
              <span>{announcement.creatorName}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementItem;
