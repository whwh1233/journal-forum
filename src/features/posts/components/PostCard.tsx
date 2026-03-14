import React from 'react';
import { Eye, Heart, MessageCircle, Calendar, User } from 'lucide-react';
import { Post, CATEGORY_LABELS, TagInfo } from '../types/post';
import './PostCard.css';

interface PostCardProps {
  post: Post;
  onClick?: (id: number) => void;
  compact?: boolean;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')             // headings
    .replace(/\*\*(.+?)\*\*/gs, '$1')      // bold
    .replace(/\*(.+?)\*/gs, '$1')          // italic
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '') // inline/block code
    .replace(/^>\s+/gm, '')                // blockquote
    .replace(/^[-*+]\s+/gm, '')            // unordered list
    .replace(/^\d+\.\s+/gm, '')            // ordered list
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')    // links (keep text)
    .replace(/!\[.*?\]\(.+?\)/g, '')        // images (remove)
    .replace(/\n+/g, ' ')                  // newlines → space
    .trim();
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick, compact = false }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(post.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes <= 1 ? '刚刚' : `${diffMinutes} 分钟前`;
      }
      return `${diffHours} 小时前`;
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
  };

  const truncateContent = (content: string, maxLength: number) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      experience: 'category-experience',
      discussion: 'category-discussion',
      question: 'category-question',
      news: 'category-news',
      review: 'category-review',
      other: 'category-other'
    };
    return colors[category] || 'category-other';
  };

  return (
    <article
      className={`post-card ${compact ? 'post-card--compact' : ''} ${post.isPinned ? 'post-card--pinned' : ''}`}
      onClick={handleClick}
    >
      {/* Pinned Badge */}
      {post.isPinned && !compact && (
        <div className="post-pinned-badge">
          置顶
        </div>
      )}

      {/* Header: Author Info + Category */}
      <div className="post-card-header">
        <div className="post-author">
          {post.userAvatar ? (
            <img src={post.userAvatar} alt={post.userName} className="post-author-avatar" />
          ) : (
            <div className="post-author-avatar post-author-avatar--placeholder">
              <User size={16} />
            </div>
          )}
          <span className="post-author-name">{post.userName}</span>
        </div>
        <span className={`post-category-badge ${getCategoryColor(post.postCategory?.slug || post.category)}`}>
          {post.postCategory?.name || CATEGORY_LABELS[post.category]}
        </span>
      </div>

      {/* Title */}
      <h3 className={`post-card-title ${compact ? 'post-card-title--compact' : ''}`}>
        {post.title}
      </h3>

      {/* Content Summary (not in compact mode) */}
      {!compact && (
        <p className="post-card-content">
          {truncateContent(stripMarkdown(post.content), 150)}
        </p>
      )}

      {/* Tags */}
      {(() => {
        const tagsAssoc = post.tags_assoc;
        if (tagsAssoc && tagsAssoc.length > 0) {
          const maxShow = compact ? 2 : 4;
          return (
            <div className="post-card-tags">
              {tagsAssoc.slice(0, maxShow).map((tag: TagInfo) => (
                <span
                  key={tag.id}
                  className={`post-card-tag ${tag.status === 'pending' ? 'post-card-tag--pending' : ''}`}
                  title={tag.status === 'pending' ? '审核中' : undefined}
                >
                  {tag.name}
                </span>
              ))}
              {tagsAssoc.length > maxShow && (
                <span className="post-card-tag post-card-tag--more">
                  +{tagsAssoc.length - maxShow}
                </span>
              )}
            </div>
          );
        }
        // Fallback to old string tags
        if (post.tags && post.tags.length > 0) {
          const maxShow = compact ? 2 : 4;
          return (
            <div className="post-card-tags">
              {post.tags.slice(0, maxShow).map((tag, index) => (
                <span key={index} className="post-card-tag">
                  {tag}
                </span>
              ))}
              {post.tags.length > maxShow && (
                <span className="post-card-tag post-card-tag--more">
                  +{post.tags.length - maxShow}
                </span>
              )}
            </div>
          );
        }
        return null;
      })()}

      {/* Footer: Stats + Time */}
      <div className="post-card-footer">
        <div className="post-card-stats">
          <span className="post-stat">
            <Eye size={compact ? 14 : 16} />
            <span>{post.viewCount}</span>
          </span>
          <span className={`post-stat ${post.userLiked ? 'post-stat--active' : ''}`}>
            <Heart size={compact ? 14 : 16} />
            <span>{post.likeCount}</span>
          </span>
          <span className="post-stat">
            <MessageCircle size={compact ? 14 : 16} />
            <span>{post.commentCount}</span>
          </span>
        </div>
        <div className="post-card-time">
          <Calendar size={compact ? 12 : 14} />
          <span>{formatDate(post.createdAt)}</span>
        </div>
      </div>

      {/* Associated Journal (if exists) */}
      {post.journalId && post.journalTitle && !compact && (
        <div className="post-card-journal">
          <span className="post-card-journal-label">关联期刊:</span>
          <span className="post-card-journal-title">{post.journalTitle}</span>
        </div>
      )}
    </article>
  );
};

export default PostCard;
