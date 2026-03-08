import React, { useState } from 'react';
import { Journal } from '@/types';
import StarRating from '@/components/common/StarRating';
import FavoriteButton from '@/features/favorite/components/FavoriteButton';
import { BookOpen, MessageSquare } from 'lucide-react';
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
      className="journal-card"
      onClick={onClick}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={0}
      aria-label={`查看期刊: ${journal.name}`}
    >
      {/* 封面图区域 - 16:9 */}
      <div className="journal-cover">
        {hasCover ? (
          <img
            src={journal.coverImageUrl}
            alt={journal.name}
            className="journal-cover-img"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <DefaultCover name={journal.name} />
        )}
        <div className="journal-cover-actions" onClick={(e) => e.stopPropagation()}>
          <FavoriteButton journalId={journal.journalId} />
        </div>
      </div>

      {/* 内容区域 */}
      <div className="journal-content">
        <div className="journal-header">
          <h3 className="journal-title">{journal.name}</h3>
          {journal.issn && <p className="journal-issn">ISSN: {journal.issn}</p>}
        </div>

        {/* 评分 + 影响因子 */}
        <div className="journal-meta">
          <div className="journal-rating">
            <StarRating rating={rating} size="small" />
            {ratingCount > 0 && (
              <span className="journal-rating-count">({ratingCount})</span>
            )}
          </div>
          {journal.impactFactor !== undefined && journal.impactFactor > 0 && (
            <div className="journal-impact-factor">
              <span className="if-label">IF:</span>
              <span>{journal.impactFactor.toFixed(2)}</span>
            </div>
          )}
          {ratingCount > 0 && (
            <div className="journal-comments">
              <MessageSquare size={14} />
              <span>{ratingCount}</span>
            </div>
          )}
        </div>

        {/* 等级标签 */}
        {journal.levels && journal.levels.length > 0 && (
          <div className="journal-levels">
            {journal.levels.slice(0, 4).map((level, index) => (
              <span key={index} className="journal-level-tag">
                {level}
              </span>
            ))}
            {journal.levels.length > 4 && (
              <span className="journal-level-more">+{journal.levels.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default JournalCard;
