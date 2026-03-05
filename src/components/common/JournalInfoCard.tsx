import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DIMENSION_LABELS, DIMENSION_KEYS } from '../../types';
import './JournalInfoCard.css';

interface JournalInfoCardProps {
  journal: {
    id: number;
    title: string;
    issn: string;
    category: string;
    rating: number;
    reviews: number;
    description?: string;
    dimensionAverages: {
      reviewSpeed?: number;
      editorAttitude?: number;
      acceptDifficulty?: number;
      reviewQuality?: number;
      overallExperience?: number;
    };
  };
  isFavorited?: boolean;
  onFavoriteToggle?: () => void;
  className?: string;
}

const JournalInfoCard: React.FC<JournalInfoCardProps> = ({
  journal,
  isFavorited = false,
  onFavoriteToggle,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleTitleClick = () => {
    navigate(`/journals/${journal.id}`);
  };

  const handleViewComments = () => {
    navigate(`/journals/${journal.id}`);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={`journal-info-card ${className}`}>
      {/* 区域1：顶部 - 基本信息 */}
      <div className="card-header">
        <div className="header-left">
          <h4
            className="journal-title"
            onClick={handleTitleClick}
            title={journal.title}
          >
            {truncateText(journal.title, 50)}
          </h4>
          <div className="journal-meta">
            <span className="issn">ISSN: {journal.issn}</span>
            <span className="separator">|</span>
            <span className="category">{journal.category}</span>
          </div>
        </div>
        <div className="header-right">
          <div className="rating">⭐ {journal.rating.toFixed(1)}</div>
          {onFavoriteToggle && (
            <button
              className={`favorite-btn ${isFavorited ? 'active' : ''}`}
              onClick={onFavoriteToggle}
              title={isFavorited ? '取消收藏' : '收藏'}
            >
              {isFavorited ? '★' : '☆'}
            </button>
          )}
        </div>
      </div>

      {/* 区域2：中间 - 5个维度评分 */}
      <div className="dimensions-section">
        {DIMENSION_KEYS.map(key => {
          const value = journal.dimensionAverages[key] || 0;
          return (
            <div key={key} className="dimension-bar">
              <span className="dimension-label">{DIMENSION_LABELS[key]}</span>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{ width: `${(value / 5) * 100}%` }}
                />
              </div>
              <span className="dimension-value">{value.toFixed(1)}</span>
            </div>
          );
        })}
      </div>

      {/* 区域3：底部 - 描述 + 操作 */}
      <div className="card-footer">
        {journal.description && (
          <p className="description" title={journal.description}>
            {journal.description}
          </p>
        )}
        <div className="actions">
          <span className="review-count">{journal.reviews} 条评论</span>
          <button className="view-comments-btn" onClick={handleViewComments}>
            查看评论
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalInfoCard;
