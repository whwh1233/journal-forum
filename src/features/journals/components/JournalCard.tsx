import React from 'react';
import { Journal } from '@/types';
import { categoryMap } from '@/services/journalService';
import StarRating from '@/components/common/StarRating';
import FavoriteButton from '@/features/favorite/components/FavoriteButton';
import './JournalCard.css';

interface JournalCardProps {
  journal: Journal;
  onClick: () => void;
}

const JournalCard: React.FC<JournalCardProps> = ({ journal, onClick }) => {
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <article
      className="journal-card"
      onClick={onClick}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={0}
      aria-label={`查看期刊: ${journal.title}`}
    >
      <div className="journal-header">
        <h3 className="journal-title">{journal.title}</h3>
        <p className="journal-issn">ISSN: {journal.issn}</p>
        <span className="journal-category" aria-label={`学科分类: ${categoryMap[journal.category]}`}>
          {categoryMap[journal.category]}
        </span>
      </div>
      <div className="journal-body">
        <div className="journal-rating">
          <StarRating rating={journal.rating} showText={true} />
        </div>
        <p className="journal-description">{journal.description}</p>
      </div>
      <div className="journal-actions">
        <FavoriteButton journalId={journal.id} />
      </div>
    </article>
  );
};

export default JournalCard;