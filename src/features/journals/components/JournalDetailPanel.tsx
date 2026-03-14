import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Journal, RatingSummary } from '@/types';
import { getRatingSummary } from '@/services/commentService';
import DimensionRatingDisplay from '@/features/comments/components/DimensionRatingDisplay';
import CommentList from '@/features/comments/components/CommentList';
import { X, FileEdit, BookOpen } from 'lucide-react';
import './JournalDetailPanel.css';

interface JournalDetailPanelProps {
  journal: Journal | null;
  isOpen: boolean;
  onClose: () => void;
}

const JournalDetailPanel: React.FC<JournalDetailPanelProps> = ({ journal, isOpen, onClose }) => {
  const navigate = useNavigate();
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);
  const [coverError, setCoverError] = useState(false);

  const handleRecordSubmission = () => {
    if (journal) {
      onClose();
      navigate(`/submissions?journalId=${journal.journalId}`);
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

  useEffect(() => {
    if (journal && isOpen) {
      getRatingSummary(journal.journalId)
        .then(setRatingSummary)
        .catch(() => setRatingSummary(null));
      setCoverError(false);
    } else {
      setRatingSummary(null);
    }
  }, [journal?.journalId, isOpen]);

  if (!journal && !isOpen) return null;

  const rating = journal?.ratingCache?.rating || 0;
  const hasCover = journal?.coverImageUrl && !coverError;

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
              <FileEdit size={16} aria-hidden="true" />
              <span>记录投稿</span>
            </button>
            <button
              className="journal-panel-close"
              onClick={onClose}
              aria-label="关闭"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {journal && (
          <div className="journal-panel-body">
            {/* Hero: Cover + Info */}
            <div className="journal-panel-hero">
              <div className="journal-panel-cover">
                {hasCover ? (
                  <img
                    src={journal.coverImageUrl}
                    alt={journal.name}
                    onError={() => setCoverError(true)}
                    loading="lazy"
                  />
                ) : (
                  <div className="journal-panel-cover-default">
                    <BookOpen size={24} strokeWidth={1.5} aria-hidden="true" />
                    <span className="journal-panel-cover-char">{journal.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="journal-panel-hero-info">
                <div className="journal-panel-meta">
                  <span>{journal.issn ? `ISSN ${journal.issn}` : '无 ISSN'}</span>
                  {journal.cn && <span>CN {journal.cn}</span>}
                  {journal.publicationCycle && <span>{journal.publicationCycle}</span>}
                </div>
                <div className="journal-panel-tags">
                  {journal.levels && journal.levels.length > 0 ? (
                    journal.levels.map((lvl, idx) => (
                      <span
                        key={idx}
                        className={`journal-panel-tag ${lvl.includes('1') || lvl.includes('TOP') || lvl.includes('A') ? 'primary' : 'muted'}`}
                      >
                        {lvl}
                      </span>
                    ))
                  ) : (
                    <span className="journal-panel-tag muted">暂无分类</span>
                  )}
                </div>
                {journal.introduction && (
                  <div className="journal-panel-intro">
                    {journal.introduction.length > 80
                      ? journal.introduction.slice(0, 80) + '...'
                      : journal.introduction}
                  </div>
                )}
              </div>
            </div>

            {/* Metrics Bar */}
            <div className="journal-panel-metrics">
              <div className="journal-panel-metric">
                <div className="journal-panel-metric-label">影响因子</div>
                <div className="journal-panel-metric-value">
                  {journal.impactFactor?.toFixed(2) || '—'}
                </div>
              </div>
              <div className="journal-panel-metric">
                <div className="journal-panel-metric-label">用户评分</div>
                <div className="journal-panel-metric-value">
                  {(ratingSummary?.rating ?? rating) > 0
                    ? (ratingSummary?.rating ?? rating).toFixed(1)
                    : '—'}
                </div>
              </div>
              <div className="journal-panel-metric">
                <div className="journal-panel-metric-label">文献量</div>
                <div className="journal-panel-metric-value">
                  {journal.articleCount
                    ? journal.articleCount >= 1000
                      ? (journal.articleCount / 1000).toFixed(1) + 'k'
                      : journal.articleCount
                    : '—'}
                </div>
              </div>
              <div className="journal-panel-metric">
                <div className="journal-panel-metric-label">被引频次</div>
                <div className="journal-panel-metric-value">
                  {journal.avgCitations?.toFixed(1) || '—'}
                </div>
              </div>
            </div>

            {/* Dimension Ratings */}
            {ratingSummary && Object.keys(ratingSummary.dimensionAverages).length > 0 && (
              <DimensionRatingDisplay
                dimensionRatings={ratingSummary.dimensionAverages}
                mode="summary"
                ratingCount={ratingSummary.ratingCount}
              />
            )}

            {/* Description */}
            {journal.introduction && (
              <div className="journal-panel-description">
                <h3>期刊简介</h3>
                <p>{journal.introduction}</p>
              </div>
            )}

            {/* Comments */}
            <CommentList journalId={journal.journalId} />
          </div>
        )}
      </div>
    </>
  );
};

export default JournalDetailPanel;
