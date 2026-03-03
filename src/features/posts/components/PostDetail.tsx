import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import DOMPurify from 'dompurify';
import {
  Heart,
  Bookmark,
  Bell,
  Flag,
  Eye,
  MessageCircle,
  Calendar,
  User,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { Post, CATEGORY_LABELS } from '../types/post';
import { postService } from '../services/postService';
import './PostDetail.css';
import 'highlight.js/styles/github-dark.css'; // Code syntax highlighting theme

interface PostDetailProps {
  postId?: number;
  post?: Post;
  onLike?: () => void;
  onFavorite?: () => void;
  onFollow?: () => void;
  onReport?: () => void;
}

const PostDetail: React.FC<PostDetailProps> = ({
  postId,
  post: initialPost,
  onLike,
  onFavorite,
  onFollow,
  onReport
}) => {
  const [post, setPost] = useState<Post | null>(initialPost || null);
  const [loading, setLoading] = useState(!initialPost && !!postId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If post is provided, use it directly
    if (initialPost) {
      setPost(initialPost);
      return;
    }

    // Otherwise, fetch post by ID
    if (postId) {
      fetchPost();
    }
  }, [postId, initialPost]);

  const fetchPost = async () => {
    if (!postId) return;

    try {
      setLoading(true);
      setError(null);
      const fetchedPost = await postService.getPostById(postId);
      setPost(fetchedPost);

      // Increment view count
      await postService.incrementView(postId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载帖子失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Sanitize HTML to prevent XSS
  const sanitizeHTML = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                      'ul', 'ol', 'li', 'a', 'code', 'pre', 'blockquote', 'img', 'table',
                      'thead', 'tbody', 'tr', 'th', 'td'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="post-detail">
        <div className="post-detail-skeleton">
          <div className="post-detail-skeleton-header">
            <div className="post-detail-skeleton-title"></div>
            <div className="post-detail-skeleton-meta">
              <div className="post-detail-skeleton-avatar"></div>
              <div className="post-detail-skeleton-text"></div>
            </div>
          </div>
          <div className="post-detail-skeleton-content">
            <div className="post-detail-skeleton-line"></div>
            <div className="post-detail-skeleton-line"></div>
            <div className="post-detail-skeleton-line post-detail-skeleton-line--short"></div>
            <div className="post-detail-skeleton-line"></div>
            <div className="post-detail-skeleton-line"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="post-detail">
        <div className="post-detail-error">
          <AlertCircle size={48} />
          <h3>加载失败</h3>
          <p>{error}</p>
          <button onClick={fetchPost} className="post-detail-error-retry">
            重试
          </button>
        </div>
      </div>
    );
  }

  // No post
  if (!post) {
    return (
      <div className="post-detail">
        <div className="post-detail-error">
          <AlertCircle size={48} />
          <h3>帖子不存在</h3>
          <p>该帖子可能已被删除或不存在</p>
        </div>
      </div>
    );
  }

  return (
    <article className="post-detail">
      {/* Header Section */}
      <header className="post-detail-header">
        {/* Title */}
        <h1 className="post-detail-title">{post.title}</h1>

        {/* Meta Info */}
        <div className="post-detail-meta">
          <div className="post-detail-author">
            {post.userAvatar ? (
              <img src={post.userAvatar} alt={post.userName} className="post-detail-avatar" />
            ) : (
              <div className="post-detail-avatar post-detail-avatar--placeholder">
                <User size={20} />
              </div>
            )}
            <div className="post-detail-author-info">
              <span className="post-detail-author-name">{post.userName}</span>
              <div className="post-detail-time">
                <Calendar size={14} />
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="post-detail-meta-right">
            <span className={`post-detail-category ${getCategoryColor(post.category)}`}>
              {CATEGORY_LABELS[post.category]}
            </span>
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="post-detail-tags">
            {post.tags.map((tag, index) => (
              <span key={index} className="post-detail-tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="post-detail-stats">
          <span className="post-detail-stat">
            <Eye size={16} />
            <span>{post.viewCount} 浏览</span>
          </span>
          <span className="post-detail-stat">
            <Heart size={16} />
            <span>{post.likeCount} 点赞</span>
          </span>
          <span className="post-detail-stat">
            <MessageCircle size={16} />
            <span>{post.commentCount} 评论</span>
          </span>
        </div>
      </header>

      {/* Content Section */}
      <div className="post-detail-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            // Custom link rendering to open external links in new tab
            a: ({ node, ...props }) => (
              <a {...props} target="_blank" rel="noopener noreferrer" />
            ),
            // Custom image rendering
            img: ({ node, ...props }) => (
              <img {...props} loading="lazy" alt={props.alt || 'Image'} />
            )
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      {/* Associated Journal Card */}
      {post.journalId && post.journalTitle && (
        <div className="post-detail-journal">
          <div className="post-detail-journal-header">
            <h4>关联期刊</h4>
          </div>
          <a href={`/journals/${post.journalId}`} className="post-detail-journal-link">
            <span className="post-detail-journal-title">{post.journalTitle}</span>
            <ExternalLink size={16} />
          </a>
        </div>
      )}

      {/* Action Buttons */}
      <div className="post-detail-actions">
        <button
          className={`post-detail-action ${post.userLiked ? 'post-detail-action--active' : ''}`}
          onClick={onLike}
        >
          <Heart size={20} fill={post.userLiked ? 'currentColor' : 'none'} />
          <span>{post.userLiked ? '已点赞' : '点赞'}</span>
          <span className="post-detail-action-count">{post.likeCount}</span>
        </button>

        <button
          className={`post-detail-action ${post.userFavorited ? 'post-detail-action--active' : ''}`}
          onClick={onFavorite}
        >
          <Bookmark size={20} fill={post.userFavorited ? 'currentColor' : 'none'} />
          <span>{post.userFavorited ? '已收藏' : '收藏'}</span>
          <span className="post-detail-action-count">{post.favoriteCount}</span>
        </button>

        <button
          className={`post-detail-action ${post.userFollowed ? 'post-detail-action--active' : ''}`}
          onClick={onFollow}
        >
          <Bell size={20} fill={post.userFollowed ? 'currentColor' : 'none'} />
          <span>{post.userFollowed ? '已关注' : '关注'}</span>
          <span className="post-detail-action-count">{post.followCount}</span>
        </button>

        <button
          className="post-detail-action post-detail-action--report"
          onClick={onReport}
        >
          <Flag size={20} />
          <span>举报</span>
        </button>
      </div>
    </article>
  );
};

export default PostDetail;
