import React, { useEffect, useRef } from 'react';
import { PlusCircle, AlertCircle, RefreshCw, Inbox } from 'lucide-react';
import { Post } from '../types/post';
import PostCard from './PostCard';
import './PostList.css';

interface PostListProps {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  onCreatePost?: () => void;
  onPostClick?: (id: number) => void;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  loading,
  error,
  hasMore,
  onLoadMore,
  onRetry,
  onCreatePost,
  onPostClick
}) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, onLoadMore]);

  // Skeleton loading cards
  const renderSkeletons = () => {
    return (
      <div className="post-list-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="post-skeleton">
            <div className="post-skeleton-header">
              <div className="post-skeleton-avatar"></div>
              <div className="post-skeleton-text post-skeleton-text--short"></div>
              <div className="post-skeleton-badge"></div>
            </div>
            <div className="post-skeleton-title"></div>
            <div className="post-skeleton-content">
              <div className="post-skeleton-text"></div>
              <div className="post-skeleton-text"></div>
              <div className="post-skeleton-text post-skeleton-text--short"></div>
            </div>
            <div className="post-skeleton-tags">
              <div className="post-skeleton-tag"></div>
              <div className="post-skeleton-tag"></div>
              <div className="post-skeleton-tag"></div>
            </div>
            <div className="post-skeleton-footer">
              <div className="post-skeleton-stats">
                <div className="post-skeleton-stat"></div>
                <div className="post-skeleton-stat"></div>
                <div className="post-skeleton-stat"></div>
              </div>
              <div className="post-skeleton-time"></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Empty state
  const renderEmptyState = () => {
    return (
      <div className="post-list-empty">
        <div className="post-list-empty-icon">
          <Inbox size={64} strokeWidth={1.5} />
        </div>
        <h3 className="post-list-empty-title">暂无帖子</h3>
        <p className="post-list-empty-description">
          这里还没有任何帖子，成为第一个发帖的人吧！
        </p>
        {onCreatePost && (
          <button className="post-list-empty-button" onClick={onCreatePost}>
            <PlusCircle size={20} />
            <span>发布第一篇帖子</span>
          </button>
        )}
      </div>
    );
  };

  // Error state
  const renderErrorState = () => {
    return (
      <div className="post-list-error">
        <div className="post-list-error-icon">
          <AlertCircle size={48} strokeWidth={2} />
        </div>
        <h3 className="post-list-error-title">加载失败</h3>
        <p className="post-list-error-message">{error}</p>
        <button className="post-list-error-button" onClick={onRetry}>
          <RefreshCw size={18} />
          <span>重试</span>
        </button>
      </div>
    );
  };

  // Loading state (initial)
  if (loading && posts.length === 0) {
    return renderSkeletons();
  }

  // Error state (initial)
  if (error && posts.length === 0) {
    return renderErrorState();
  }

  // Empty state
  if (!loading && posts.length === 0) {
    return renderEmptyState();
  }

  return (
    <div className="post-list">
      {/* Posts grid */}
      <div className="post-list-grid">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onClick={onPostClick} />
        ))}
      </div>

      {/* Loading more indicator */}
      {loading && posts.length > 0 && (
        <div className="post-list-loading-more">
          <div className="post-list-spinner"></div>
          <span>加载更多...</span>
        </div>
      )}

      {/* Error loading more */}
      {error && posts.length > 0 && (
        <div className="post-list-error-inline">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="post-list-retry-button" onClick={onRetry}>
            <RefreshCw size={16} />
            重试
          </button>
        </div>
      )}

      {/* Observer target for infinite scroll */}
      {hasMore && !loading && !error && (
        <div ref={observerTarget} className="post-list-observer" />
      )}

      {/* End of list indicator */}
      {!hasMore && posts.length > 0 && (
        <div className="post-list-end">
          <div className="post-list-end-line"></div>
          <span className="post-list-end-text">已加载全部帖子</span>
          <div className="post-list-end-line"></div>
        </div>
      )}
    </div>
  );
};

export default PostList;
