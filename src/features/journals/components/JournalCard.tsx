import React, { useState } from 'react';
import { Journal } from '@/types';
import FavoriteButton from '@/features/favorite/components/FavoriteButton';
import { BookOpen, MessageSquare, Star, TrendingUp } from 'lucide-react';
import './JournalCard.css';

interface JournalCardProps {
  journal: Journal;
  onClick: () => void;
}

// 默认封面图（渐变色块 + 首字母）
const DefaultCover: React.FC<{ name: string }> = ({ name }) => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue1 = hash % 360;
  const hue2 = (hue1 + 40) % 360;

  return (
    <div
      className="journal-cover-default"
      style={{
        background: `linear-gradient(135deg, hsl(${hue1}, 60%, 50%), hsl(${hue2}, 70%, 40%))`
      }}
    >
      <BookOpen size={28} strokeWidth={1.5} />
      <span className="journal-cover-initial">{name.charAt(0)}</span>
    </div>
  );
};

const JournalCard: React.FC<JournalCardProps> = ({ journal, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  const rating = journal.ratingCache?.rating || 0;
  const ratingCount = journal.ratingCache?.ratingCount || 0;
  const hasCover = journal.coverImageUrl && !imgError;

  return (
    <article
      className="journal-card scheme-e-production"
      onClick={onClick}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={0}
      aria-label={`查看期刊: ${journal.name}`}
    >
      <div className="card-layout">
        {/* 左侧封面 (1/3) */}
        <div className="card-cover-side">
          {hasCover ? (
            <>
              <div className={`card-cover-skeleton ${imgLoaded ? 'hidden' : ''}`}>
                <div className="card-cover-skeleton-shimmer" />
              </div>
              <img
                src={journal.coverImageUrl}
                alt={journal.name}
                className={`card-cover-img ${imgLoaded ? 'loaded' : ''}`}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                loading="lazy"
              />
            </>
          ) : (
            <DefaultCover name={journal.name} />
          )}
        </div>

        {/* 右侧内容 (2/3) */}
        <div className="card-content-side">
          {/* 收藏按钮 - 浮动右上角 */}
          <div className="card-favorite-float" onClick={(e) => e.stopPropagation()}>
            <FavoriteButton journalId={journal.journalId} showText={false} initialFavorited={journal.isFavorited} />
          </div>

          {/* 标题 - 最上方，限 2 行 */}
          <div className="card-header">
            <h3 className="card-title" title={journal.name}>{journal.name}</h3>
          </div>

          {/* 标签层 - 限 5 个 */}
          <div className="card-levels">
            {journal.levels?.slice(0, 5).map((lvl, index) => (
              <span key={index} className={`level-tag ${lvl.includes('1') || lvl.includes('TOP') ? 'primary-highlight' : ''}`}>
                {lvl}
              </span>
            ))}
            {journal.levels && journal.levels.length > 5 && (
              <span className="level-tag-more">+{journal.levels.length - 5}</span>
            )}
          </div>

          {/* 核心指标 - 中文标签 */}
          <div className="card-stats-row">
            <div className="journal-stat-box">
              <span className="journal-stat-label">影响因子</span>
              <span className="journal-stat-value journal-if-value">
                <BookOpen size={18} /> {journal.impactFactor?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="journal-stat-box">
              <span className="journal-stat-label">用户评分</span>
              <span className="journal-stat-value journal-rating-value">
                <Star size={18} fill="currentColor" /> {rating.toFixed(1)}
              </span>
            </div>
            <div className="journal-stat-box">
              <span className="journal-stat-label">讨论</span>
              <span className="journal-stat-value journal-comment-value">
                <MessageSquare size={18} /> {ratingCount}
              </span>
            </div>
          </div>

          {/* 底部信息 - 分类与 ISSN */}
          <div className="card-footer">
            <div className="footer-category">
              <TrendingUp size={14} className="icon" />
              <span className="category-text">{journal.category || '综合性期刊'}</span>
            </div>
            {journal.issn && (
              <div className="footer-issn">
                <span className="issn-label">ISSN:</span>
                <span>{journal.issn}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default JournalCard;
