import React, { useState } from 'react';
import { useJournals } from '@/hooks/useJournals';
import { Journal } from '@/types';
import JournalCard from './JournalCard';
import JournalDetailPanel from './JournalDetailPanel';
import './JournalsGrid.css';

const JournalsGrid: React.FC = () => {
  const { filteredJournals, loading, error } = useJournals();
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleJournalClick = (journal: Journal) => {
    setSelectedJournal(journal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJournal(null);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return <div className="error">错误: {error}</div>;
  }

  if (filteredJournals.length === 0) {
    return <div className="no-results">没有找到符合条件的期刊。</div>;
  }

  return (
    <>
      <div className="journals-grid">
        {filteredJournals.map((journal) => (
          <JournalCard
            key={journal.id}
            journal={journal}
            onClick={() => handleJournalClick(journal)}
          />
        ))}
      </div>
      <JournalDetailPanel
        journal={selectedJournal}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default JournalsGrid;