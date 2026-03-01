import React, { useEffect, useState } from 'react';
import { Journal, RatingSummary } from '@/types';
import { categoryMap } from '@/services/journalService';
import { getRatingSummary } from '@/services/commentService';
import StarRating from '@/components/common/StarRating';
import DimensionRatingDisplay from '@/features/comments/components/DimensionRatingDisplay';
import CommentList from '@/features/comments/components/CommentList';
import { X } from 'lucide-react';
import './JournalDetailPanel.css';

interface JournalDetailPanelProps {
  journal: Journal | null;
  isOpen: boolean;
  onClose: () => void;
}

const JournalDetailPanel: React.FC<JournalDetailPanelProps> = ({ journal, isOpen, onClose }) => {
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);

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
      getRatingSummary(journal.id)
        .then(setRatingSummary)
        .catch(() => setRatingSummary(null));
    } else {
      setRatingSummary(null);
    }
  }, [journal?.id, isOpen]);

  if (!journal && !isOpen) return null;

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
        aria-label={journal?.title}
      >
        <div className="journal-panel-header">
          <h2 className="journal-panel-title">{journal?.title}</h2>
          <button
            className="journal-panel-close"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        {journal && (
          <div className="journal-panel-body">
            <div className="journal-detail-header">
              <div className="journal-detail-meta">
                <div className="detail-item">
                  <span className="detail-label">ISSN</span>
                  <span className="detail-value">{journal.issn}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">学科领域</span>
                  <span className="detail-value">{categoryMap[journal.category]}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">评分</span>
                  <span className="detail-value">
                    <StarRating rating={ratingSummary?.rating ?? journal.rating} showText={true} />
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
              <p>{journal.description}</p>
            </div>
            <CommentList journalId={journal.id} />
          </div>
        )}
      </div>
    </>
  );
};

export default JournalDetailPanel;

