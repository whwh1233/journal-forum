import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Journal, RatingSummary } from '@/types';
import { getRatingSummary } from '@/services/commentService';
import StarRating from '@/components/common/StarRating';
import DimensionRatingDisplay from '@/features/comments/components/DimensionRatingDisplay';
import CommentList from '@/features/comments/components/CommentList';
import { X, FileEdit } from 'lucide-react';
import './JournalDetailPanel.css';

interface JournalDetailPanelProps {
  journal: Journal | null;
  isOpen: boolean;
  onClose: () => void;
}

const JournalDetailPanel: React.FC<JournalDetailPanelProps> = ({ journal, isOpen, onClose }) => {
  const navigate = useNavigate();
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);

  const handleRecordSubmission = () => {
    if (journal) {
      onClose(); // 关闭面板
      navigate(`/submissions?journalId=${journal.journalId}`); // 跳转到投稿追踪页并传递期刊 ID
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 获取多维评分汇总
  useEffect(() => {
    if (journal && isOpen) {
      getRatingSummary(journal.journalId)
        .then(setRatingSummary)
        .catch(() => setRatingSummary(null));
    } else {
      setRatingSummary(null);
    }
  }, [journal?.journalId, isOpen]);

  if (!journal && !isOpen) return null;

  // 获取评分 (处理可能是缓存的情况)
  const rating = journal?.ratingCache?.rating || 0;

  return (
    <>
      <div
        className={`journal-panel-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`journal-panel ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={journal?.name}
      >
        <div className="journal-panel-header">
          <h2 className="journal-panel-title">{journal?.name}</h2>
          <div className="journal-panel-actions">
            <button
              className="btn-record-submission"
              onClick={handleRecordSubmission}
              aria-label="记录投稿"
              title="记录到投稿追踪"
            >
              <FileEdit size={18} aria-hidden="true" />
              <span>记录投稿</span>
            </button>
            <button
              className="journal-panel-close"
              onClick={onClose}
              aria-label="关闭"
            >
              <X size={24} aria-hidden="true" />
            </button>
          </div>
        </div>

        {journal && (
          <div className="journal-panel-body">
            <div className="journal-detail-header">
              <div className="journal-detail-meta">
                <div className="detail-item">
                  <span className="detail-label">ISSN</span>
                  <span className="detail-value">{journal.issn || '无'}</span>
                </div>
                {journal.cn && (
                  <div className="detail-item">
                    <span className="detail-label">CN</span>
                    <span className="detail-value">{journal.cn}</span>
                  </div>
                )}
                {journal.publicationCycle && (
                  <div className="detail-item">
                    <span className="detail-label">出版周期</span>
                    <span className="detail-value">{journal.publicationCycle}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">学科领域</span>
                  <span className="detail-value">
                    {journal.levels && journal.levels.length > 0
                      ? journal.levels.join(', ')
                      : '暂无'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">评分</span>
                  <span className="detail-value">
                    <StarRating rating={ratingSummary?.rating ?? rating} showText={true} />
                  </span>
                </div>
              </div>
            </div>

            {ratingSummary && Object.keys(ratingSummary.dimensionAverages).length > 0 && (
              <DimensionRatingDisplay
                dimensionRatings={ratingSummary.dimensionAverages}
                mode="summary"
                ratingCount={ratingSummary.ratingCount}
              />
            )}

            <div className="journal-detail-description">
              <h3>期刊简介</h3>
              <p>{journal.introduction || '暂无简介'}</p>
            </div>

            {/* 额外的信息区域设计 */}
            <div className="journal-detail-extra-info">
              {journal.impactFactor && (
                <div className="extra-stat">
                  <span className="stat-label">影响因子</span>
                  <span className="stat-value">{journal.impactFactor}</span>
                </div>
              )}
              {journal.articleCount && (
                <div className="extra-stat">
                  <span className="stat-label">文献量</span>
                  <span className="stat-value">{journal.articleCount}</span>
                </div>
              )}
              {journal.avgCitations && (
                <div className="extra-stat">
                  <span className="stat-label">均被引频次</span>
                  <span className="stat-value">{journal.avgCitations}</span>
                </div>
              )}
            </div>

            <CommentList journalId={journal.journalId} />
          </div>
        )}
      </div>
    </>
  );
};

export default JournalDetailPanel;

