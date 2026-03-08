import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useJournals } from '@/hooks/useJournals';
import { Journal } from '@/types';
import JournalCard from './JournalCard';
import JournalDetailPanel from './JournalDetailPanel';
import { Loader2 } from 'lucide-react';
import './JournalsGrid.css';

const JournalsGrid: React.FC = () => {
  const { filteredJournals, loading, loadingMore, error, hasMore, loadMoreJournals } = useJournals();
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleJournalClick = (journal: Journal) => {
    setSelectedJournal(journal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJournal(null);
  };

  // 无限滚动 - Intersection Observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !loadingMore) {
      loadMoreJournals();
    }
  }, [hasMore, loadingMore, loadMoreJournals]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  if (loading) {
    return (
      <div className="loading">
        <Loader2 className="loading-spinner" size={24} />
        <span>加载中...</span>
      </div>
    );
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
            key={journal.journalId}
            journal={journal}
            onClick={() => handleJournalClick(journal)}
          />
        ))}
      </div>

      {/* 加载更多触发器 */}
      <div ref={loadMoreRef} className="load-more-trigger">
        {loadingMore && (
          <div className="loading-more">
            <Loader2 className="loading-spinner" size={20} />
            <span>加载更多...</span>
          </div>
        )}
        {!hasMore && filteredJournals.length > 0 && (
          <div className="no-more">已加载全部期刊</div>
        )}
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