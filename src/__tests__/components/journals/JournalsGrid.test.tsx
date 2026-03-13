import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import JournalsGrid from '@/features/journals/components/JournalsGrid';
import { Journal } from '@/types';

// Mock the useJournals hook
const mockLoadMoreJournals = vi.fn();
vi.mock('@/hooks/useJournals', () => ({
  useJournals: vi.fn()
}));

// Mock JournalCard component
vi.mock('@/features/journals/components/JournalCard', () => ({
  default: ({ journal, onClick }: { journal: Journal; onClick: () => void }) => (
    <div
      data-testid={`journal-card-${journal.journalId}`}
      className="journal-card"
      onClick={onClick}
    >
      <span>{journal.name}</span>
    </div>
  )
}));

// Mock JournalDetailPanel component
vi.mock('@/features/journals/components/JournalDetailPanel', () => ({
  default: ({ journal, isOpen, onClose }: { journal: Journal | null; isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div data-testid="journal-detail-panel">
        <span>Detail Panel: {journal?.name}</span>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  )
}));

const mockJournals: Journal[] = [
  {
    journalId: 'journal-1',
    name: 'Test Journal 1',
    issn: '1234-5678',
    levels: ['SCI'],
    ratingCache: { journalId: 'journal-1', rating: 4.5, ratingCount: 10 }
  },
  {
    journalId: 'journal-2',
    name: 'Test Journal 2',
    issn: '2345-6789',
    levels: ['EI'],
    ratingCache: { journalId: 'journal-2', rating: 3.8, ratingCount: 5 }
  },
  {
    journalId: 'journal-3',
    name: 'Test Journal 3',
    issn: '3456-7890',
    levels: ['CSSCI'],
    ratingCache: { journalId: 'journal-3', rating: 4.2, ratingCount: 15 }
  }
];

describe('JournalsGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    const { useJournals } = require('@/hooks/useJournals');
    useJournals.mockReturnValue({
      filteredJournals: [],
      loading: true,
      loadingMore: false,
      error: null,
      hasMore: true,
      loadMoreJournals: mockLoadMoreJournals
    });

    render(
      <BrowserRouter>
        <JournalsGrid />
      </BrowserRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render error state', () => {
    const { useJournals } = require('@/hooks/useJournals');
    useJournals.mockReturnValue({
      filteredJournals: [],
      loading: false,
      loadingMore: false,
      error: 'Failed to load journals',
      hasMore: true,
      loadMoreJournals: mockLoadMoreJournals
    });

    render(
      <BrowserRouter>
        <JournalsGrid />
      </BrowserRouter>
    );

    expect(screen.getByText(/Error: Failed to load journals/)).toBeInTheDocument();
  });

  it('should render no results state when journals array is empty', () => {
    const { useJournals } = require('@/hooks/useJournals');
    useJournals.mockReturnValue({
      filteredJournals: [],
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: false,
      loadMoreJournals: mockLoadMoreJournals
    });

    render(
      <BrowserRouter>
        <JournalsGrid />
      </BrowserRouter>
    );

    expect(screen.getByText('No matching journals found.')).toBeInTheDocument();
  });

  it('should render journal cards', () => {
    const { useJournals } = require('@/hooks/useJournals');
    useJournals.mockReturnValue({
      filteredJournals: mockJournals,
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: true,
      loadMoreJournals: mockLoadMoreJournals
    });

    render(
      <BrowserRouter>
        <JournalsGrid />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Journal 1')).toBeInTheDocument();
    expect(screen.getByText('Test Journal 2')).toBeInTheDocument();
    expect(screen.getByText('Test Journal 3')).toBeInTheDocument();
  });

  it('should render correct number of journal cards', () => {
    const { useJournals } = require('@/hooks/useJournals');
    useJournals.mockReturnValue({
      filteredJournals: mockJournals,
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: true,
      loadMoreJournals: mockLoadMoreJournals
    });

    render(
      <BrowserRouter>
        <JournalsGrid />
      </BrowserRouter>
    );

    const cards = screen.getAllByTestId(/journal-card-/);
    expect(cards).toHaveLength(3);
  });

  it('should open detail panel when journal card is clicked', async () => {
    const { useJournals } = require('@/hooks/useJournals');
    useJournals.mockReturnValue({
      filteredJournals: mockJournals,
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: true,
      loadMoreJournals: mockLoadMoreJournals
    });

    render(
      <BrowserRouter>
        <JournalsGrid />
      </BrowserRouter>
    );

    const card = screen.getByTestId('journal-card-journal-1');
    fireEvent.click(card);

    await waitFor(() => {
      expect(screen.getByTestId('journal-detail-panel')).toBeInTheDocument();
      expect(screen.getByText('Detail Panel: Test Journal 1')).toBeInTheDocument();
    });
  });

  it('should close detail panel when close button is clicked', async () => {
    const { useJournals } = require('@/hooks/useJournals');
    useJournals.mockReturnValue({
      filteredJournals: mockJournals,
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: true,
      loadMoreJournals: mockLoadMoreJournals
    });

    render(
      <BrowserRouter>
        <JournalsGrid />
      </BrowserRouter>
    );

    // Open the panel
    const card = screen.getByTestId('journal-card-journal-1');
    fireEvent.click(card);

    await waitFor(() => {
      expect(screen.getByTestId('journal-detail-panel')).toBeInTheDocument();
    });

    // Close the panel
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('journal-detail-panel')).not.toBeInTheDocument();
    });
  });

  it('should show loading more indicator when loadingMore is true', () => {
    const { useJournals } = require('@/hooks/useJournals');
    useJournals.mockReturnValue({
      filteredJournals: mockJournals,
      loading: false,
      loadingMore: true,
      error: null,
      hasMore: true,
      loadMoreJournals: mockLoadMoreJournals
    });

    render(
      <BrowserRouter>
        <JournalsGrid />
      </BrowserRouter>
    );

    expect(screen.getByText('Loading more...')).toBeInTheDocument();
  });

  it('should show end of list message when no more journals', () => {
    const { useJournals } = require('@/hooks/useJournals');
    useJournals.mockReturnValue({
      filteredJournals: mockJournals,
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: false,
      loadMoreJournals: mockLoadMoreJournals
    });

    render(
      <BrowserRouter>
        <JournalsGrid />
      </BrowserRouter>
    );

    expect(screen.getByText('All journals loaded')).toBeInTheDocument();
  });

  it('should have journals-grid class for CSS styling', () => {
    const { useJournals } = require('@/hooks/useJournals');
    useJournals.mockReturnValue({
      filteredJournals: mockJournals,
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: true,
      loadMoreJournals: mockLoadMoreJournals
    });

    const { container } = render(
      <BrowserRouter>
        <JournalsGrid />
      </BrowserRouter>
    );

    expect(container.querySelector('.journals-grid')).toBeInTheDocument();
  });

  it('should use journal journalId as key for each card', () => {
    const { useJournals } = require('@/hooks/useJournals');
    useJournals.mockReturnValue({
      filteredJournals: mockJournals,
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: true,
      loadMoreJournals: mockLoadMoreJournals
    });

    render(
      <BrowserRouter>
        <JournalsGrid />
      </BrowserRouter>
    );

    expect(screen.getByTestId('journal-card-journal-1')).toBeInTheDocument();
    expect(screen.getByTestId('journal-card-journal-2')).toBeInTheDocument();
    expect(screen.getByTestId('journal-card-journal-3')).toBeInTheDocument();
  });

  it('should handle clicking different journal cards', async () => {
    const { useJournals } = require('@/hooks/useJournals');
    useJournals.mockReturnValue({
      filteredJournals: mockJournals,
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: true,
      loadMoreJournals: mockLoadMoreJournals
    });

    render(
      <BrowserRouter>
        <JournalsGrid />
      </BrowserRouter>
    );

    // Click first journal
    fireEvent.click(screen.getByTestId('journal-card-journal-1'));
    await waitFor(() => {
      expect(screen.getByText('Detail Panel: Test Journal 1')).toBeInTheDocument();
    });

    // Close panel
    fireEvent.click(screen.getByText('Close'));

    // Click second journal
    fireEvent.click(screen.getByTestId('journal-card-journal-2'));
    await waitFor(() => {
      expect(screen.getByText('Detail Panel: Test Journal 2')).toBeInTheDocument();
    });
  });

  it('should have load more trigger element', () => {
    const { useJournals } = require('@/hooks/useJournals');
    useJournals.mockReturnValue({
      filteredJournals: mockJournals,
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: true,
      loadMoreJournals: mockLoadMoreJournals
    });

    const { container } = render(
      <BrowserRouter>
        <JournalsGrid />
      </BrowserRouter>
    );

    expect(container.querySelector('.load-more-trigger')).toBeInTheDocument();
  });
});
