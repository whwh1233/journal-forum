import React from 'react';
import { Journal } from '@/types';
import { categoryMap } from '@/services/journalService';
import StarRating from '@/components/common/StarRating';
import Modal from '@/components/common/Modal';
import CommentList from '@/features/comments/components/CommentList';
import './JournalDetailModal.css';

interface JournalDetailModalProps {
  journal: Journal | null;
  isOpen: boolean;
  onClose: () => void;
}

const JournalDetailModal: React.FC<JournalDetailModalProps> = ({ journal, isOpen, onClose }) => {
  if (!journal) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={journal.title}>
      <div className="journal-detail-content">
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
                <StarRating rating={journal.rating} showText={true} />
              </span>
            </div>
          </div>
        </div>
        <div className="journal-detail-description">
          <p>{journal.description}</p>
        </div>
        <CommentList journalId={journal.id} />
      </div>
    </Modal>
  );
};

export default JournalDetailModal;