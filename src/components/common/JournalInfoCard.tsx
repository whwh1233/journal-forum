import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Star, Heart, ExternalLink } from 'lucide-react';
import { DIMENSION_LABELS, DIMENSION_KEYS } from '../../types';
import './JournalInfoCard.css';

interface JournalInfoCardProps {
  journal: {
    journalId: string;
    name: string;
    issn?: string;
    levels?: string[];
    ratingCache?: {
      rating: number;
      reviewSpeed?: number;
      editorAttitude?: number;
      acceptDifficulty?: number;
      reviewQuality?: number;
      overallExperience?: number;
    };
    articleCount?: number;
    introduction?: string;
  };
  isFavorited?: boolean;
  onFavoriteToggle?: () => void;
  className?: string;
  defaultExpanded?: boolean;
}

const JournalInfoCard: React.FC<JournalInfoCardProps> = ({
  journal,
  isFavorited = false,
  onFavoriteToggle,
  className = '',
  defaultExpanded = false
}) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleViewComments = () => {
    navigate(`/journals/${journal.journalId}`);
  };

  const reviewCount = journal.articleCount || 0; // fallback usage since reviews count isn't directly on minimal Journal type
  const ratingValue = journal.ratingCache?.rating || 0;

  return (
    <div className={`journal-info-card ${expanded ? 'expanded' : 'collapsed'} ${className}`}>
      {/* 可折叠头部 */}
      <div className="card-header" onClick={() => setExpanded(!expanded)}>
        <div className="header-main">
          <h4 className="journal-title" title={journal.name}>
            {journal.name}
          </h4>
          <div className="journal-meta">
            {journal.levels && journal.levels.length > 0 && (
              <span className="category-badge">{journal.levels[0]}{journal.levels.length > 1 && ' +'}</span>
            )}
            {journal.issn && <span className="issn">ISSN: {journal.issn}</span>}
          </div>
        </div>
        <div className="header-actions">
          <div className="rating-badge">
            <Star size={14} fill="currentColor" />
            <span>{ratingValue.toFixed(1)}</span>
          </div>
          <span className="review-count">{reviewCount} 记录文章</span>
          <button
            className="expand-toggle"
            aria-label={expanded ? '收起详情' : '展开详情'}
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* 展开内容 */}
      {expanded && (
        <div className="card-body">
          {/* 维度评分 */}
          <div className="dimensions-section">
            <div className="dimensions-title">评分维度</div>
            <div className="dimensions-grid">
              {DIMENSION_KEYS.map(key => {
                const value = (journal.ratingCache as any)?.[key] || 0;
                return (
                  <div key={key} className="dimension-item">
                    <div className="dimension-header">
                      <span className="dimension-label">{DIMENSION_LABELS[key]}</span>
                      <span className="dimension-value">{value.toFixed(1)}</span>
                    </div>
                    <div className="bar-container">
                      <div
                        className="bar-fill"
                        style={{ width: `${(value / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 描述 */}
          {journal.introduction && (
            <p className="description" title={journal.introduction}>
              {journal.introduction.length > 100 ? journal.introduction.substring(0, 100) + '...' : journal.introduction}
            </p>
          )}

          {/* 操作按钮 */}
          <div className="card-actions">
            {onFavoriteToggle && (
              <button
                className={`action-btn favorite-btn ${isFavorited ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onFavoriteToggle(); }}
                title={isFavorited ? '取消收藏' : '收藏期刊'}
              >
                <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
                <span>{isFavorited ? '已收藏' : '收藏'}</span>
              </button>
            )}
            <button
              className="action-btn view-btn"
              onClick={(e) => { e.stopPropagation(); handleViewComments(); }}
            >
              <ExternalLink size={16} />
              <span>查看详情</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalInfoCard;
