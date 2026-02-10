import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

// 基础骨架屏
export const Skeleton: React.FC<SkeletonProps & { width?: string | number; height?: string | number }> = ({
  className = '',
  style,
  width,
  height,
}) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
    />
  );
};

// 文本骨架屏
interface SkeletonTextProps extends SkeletonProps {
  lines?: number;
  size?: 'sm' | 'md' | 'lg' | 'title';
  width?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  className = '',
  lines = 1,
  size = 'md',
  width,
  style,
}) => {
  const sizeClass = size === 'md' ? '' : `skeleton-text--${size}`;

  if (lines === 1) {
    return (
      <div
        className={`skeleton skeleton-text ${sizeClass} ${className}`}
        style={{ width, ...style }}
      />
    );
  }

  return (
    <div className="skeleton-text-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`skeleton skeleton-text ${sizeClass} ${className}`}
          style={{
            width: index === lines - 1 ? '70%' : '100%',
            ...style,
          }}
        />
      ))}
    </div>
  );
};

// 头像骨架屏
interface SkeletonAvatarProps extends SkeletonProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  className = '',
  size = 'md',
  style,
}) => {
  return (
    <div
      className={`skeleton skeleton-avatar skeleton-avatar--${size} ${className}`}
      style={style}
    />
  );
};

// 按钮骨架屏
interface SkeletonButtonProps extends SkeletonProps {
  size?: 'sm' | 'md' | 'lg';
}

export const SkeletonButton: React.FC<SkeletonButtonProps> = ({
  className = '',
  size = 'md',
  style,
}) => {
  const sizeClass = size === 'md' ? '' : `skeleton-button--${size}`;
  return (
    <div
      className={`skeleton skeleton-button ${sizeClass} ${className}`}
      style={style}
    />
  );
};

// 图片骨架屏
interface SkeletonImageProps extends SkeletonProps {
  aspectRatio?: 'video' | 'square';
}

export const SkeletonImage: React.FC<SkeletonImageProps> = ({
  className = '',
  aspectRatio = 'video',
  style,
}) => {
  const aspectClass = aspectRatio === 'square' ? 'skeleton-image--square' : '';
  return (
    <div
      className={`skeleton skeleton-image ${aspectClass} ${className}`}
      style={style}
    />
  );
};

// 卡片骨架屏
export const SkeletonCard: React.FC<SkeletonProps & { hasImage?: boolean }> = ({
  className = '',
  hasImage = false,
  style,
}) => {
  return (
    <div className={`skeleton-card ${className}`} style={style}>
      {hasImage && <SkeletonImage />}
      <div className="skeleton-card__header">
        <SkeletonAvatar size="md" />
        <div style={{ flex: 1 }}>
          <SkeletonText size="sm" width="60%" />
        </div>
      </div>
      <div className="skeleton-card__body">
        <SkeletonText size="title" />
        <SkeletonText lines={2} />
      </div>
      <div className="skeleton-card__footer">
        <SkeletonButton size="sm" />
        <SkeletonButton size="sm" />
      </div>
    </div>
  );
};

// 列表项骨架屏
export const SkeletonListItem: React.FC<SkeletonProps> = ({
  className = '',
  style,
}) => {
  return (
    <div className={`skeleton-list-item ${className}`} style={style}>
      <SkeletonAvatar size="md" />
      <div className="skeleton-list-item__content">
        <SkeletonText width="40%" />
        <SkeletonText size="sm" width="60%" />
      </div>
      <SkeletonButton size="sm" />
    </div>
  );
};

// 评论骨架屏
export const SkeletonComment: React.FC<SkeletonProps> = ({
  className = '',
  style,
}) => {
  return (
    <div className={`skeleton-comment ${className}`} style={style}>
      <div className="skeleton-comment__header">
        <SkeletonAvatar size="sm" />
        <div className="skeleton-comment__meta">
          <SkeletonText size="sm" width="120px" />
          <SkeletonText size="sm" width="80px" />
        </div>
      </div>
      <div className="skeleton-comment__body">
        <SkeletonText lines={2} />
      </div>
    </div>
  );
};

// 个人资料骨架屏
export const SkeletonProfile: React.FC<SkeletonProps> = ({
  className = '',
  style,
}) => {
  return (
    <div className={`skeleton-profile ${className}`} style={style}>
      <SkeletonAvatar size="xl" />
      <div className="skeleton-profile__info">
        <SkeletonText size="title" width="200px" />
        <SkeletonText width="150px" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
};

// 统计骨架屏
export const SkeletonStats: React.FC<SkeletonProps & { count?: number }> = ({
  className = '',
  count = 4,
  style,
}) => {
  return (
    <div className={`skeleton-stats ${className}`} style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-stat">
          <div className="skeleton skeleton-stat__value" />
          <div className="skeleton skeleton-stat__label" />
        </div>
      ))}
    </div>
  );
};

// 列表骨架屏
export const SkeletonList: React.FC<SkeletonProps & { count?: number }> = ({
  className = '',
  count = 3,
  style,
}) => {
  return (
    <div className={`skeleton-list ${className}`} style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonListItem key={index} />
      ))}
    </div>
  );
};

export default Skeleton;
