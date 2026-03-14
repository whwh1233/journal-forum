import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import JournalDetailPanel from '@/features/journals/components/JournalDetailPanel';
import { Journal, RatingSummary } from '@/types';
import { getRatingSummary } from '@/services/commentService';

// Mock the services
vi.mock('@/services/commentService', () => ({
  getRatingSummary: vi.fn()
}));

// Mock the child components
vi.mock('@/components/common/StarRating', () => ({
  default: ({ rating, showText }: { rating: number; showText?: boolean }) => (
    <div data-testid="star-rating">
      {showText ? `${rating} stars` : rating}
    </div>
  )
}));

vi.mock('@/features/comments/components/DimensionRatingDisplay', () => ({
  default: ({ dimensionRatings, mode, ratingCount }: any) => (
    <div data-testid="dimension-rating-display">
      <span>Mode: {mode}</span>
      <span>Count: {ratingCount}</span>
    </div>
  )
}));

vi.mock('@/features/comments/components/CommentList', () => ({
  default: ({ journalId }: { journalId: string }) => (
    <div data-testid="comment-list">Comment List for {journalId}</div>
  )
}));

const mockJournal: Journal = {
  journalId: 'test-journal-1',
  name: 'Test Journal',
  issn: '1234-5678',
  cn: 'CN 10-1234/G',
  publicationCycle: 'Monthly',
  levels: ['SCI', 'EI'],
  introduction: 'This is a test journal introduction.',
  impactFactor: 3.5,
  articleCount: 1000,
  avgCitations: 15.2,
  ratingCache: {
    journalId: 'test-journal-1',
    rating: 4.2,
    ratingCount: 50
  }
};

const mockRatingSummary: RatingSummary = {
  journalId: 'test-journal-1',
  rating: 4.2,
  ratingCount: 50,
  dimensionAverages: {
    reviewSpeed: 4.0,
    editorAttitude: 4.5,
    acceptDifficulty: 3.8,
    reviewQuality: 4.2,
    overallExperience: 4.3
  },
  dimensionLabels: {
    reviewSpeed: 'Review Speed',
    editorAttitude: 'Editor Attitude',
    acceptDifficulty: 'Accept Difficulty',
    reviewQuality: 'Review Quality',
    overallExperience: 'Overall Experience'
  }
};

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('JournalDetailPanel', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRatingSummary).mockResolvedValue(mockRatingSummary);
  });

  it('should not render when journal is null and not open', () => {
    const { container } = render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={null}
          isOpen={false}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    expect(container.innerHTML).toBe('');
  });

  it('should render journal name in header when open', () => {
    render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Journal')).toBeInTheDocument();
  });

  it('should display ISSN', () => {
    render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('ISSN')).toBeInTheDocument();
    expect(screen.getByText('1234-5678')).toBeInTheDocument();
  });

  it('should display CN when provided', () => {
    render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('CN')).toBeInTheDocument();
    expect(screen.getByText('CN 10-1234/G')).toBeInTheDocument();
  });

  it('should display publication cycle when provided', () => {
    render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('should display discipline levels', () => {
    render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('SCI, EI')).toBeInTheDocument();
  });

  it('should display journal introduction', () => {
    render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('This is a test journal introduction.')).toBeInTheDocument();
  });

  it('should display extra statistics when available', () => {
    render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('3.5')).toBeInTheDocument(); // Impact Factor
    expect(screen.getByText('1000')).toBeInTheDocument(); // Article Count
    expect(screen.getByText('15.2')).toBeInTheDocument(); // Avg Citations
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    const closeButton = screen.getByLabelText('关闭');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when overlay is clicked', () => {
    const { container } = render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    const overlay = container.querySelector('.journal-panel-overlay');
    if (overlay) {
      fireEvent.click(overlay);
    }

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when Escape key is pressed', () => {
    render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should navigate to submissions page when record submission button is clicked', () => {
    render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    const recordButton = screen.getByLabelText('记录投稿');
    fireEvent.click(recordButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/submissions?journalId=test-journal-1');
  });

  it('should render CommentList component', () => {
    render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    expect(screen.getByTestId('comment-list')).toBeInTheDocument();
    expect(screen.getByText('Comment List for test-journal-1')).toBeInTheDocument();
  });

  it('should render StarRating component', () => {
    render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    expect(screen.getByTestId('star-rating')).toBeInTheDocument();
  });

  it('should fetch and display dimension ratings', async () => {
    render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('dimension-rating-display')).toBeInTheDocument();
    });
  });

  it('should have correct aria attributes for accessibility', () => {
    const { container } = render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    const panel = container.querySelector('.journal-panel');
    expect(panel).toHaveAttribute('role', 'dialog');
    expect(panel).toHaveAttribute('aria-modal', 'true');
    expect(panel).toHaveAttribute('aria-label', 'Test Journal');
  });

  it('should add open class when isOpen is true', () => {
    const { container } = render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    const panel = container.querySelector('.journal-panel');
    expect(panel).toHaveClass('open');
  });

  it('should handle journal without optional fields', () => {
    const minimalJournal: Journal = {
      journalId: 'minimal-journal',
      name: 'Minimal Journal'
    };

    render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={minimalJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Minimal Journal')).toBeInTheDocument();
    expect(screen.getByText('无')).toBeInTheDocument(); // ISSN fallback
    expect(screen.getByText('暂无')).toBeInTheDocument(); // Levels fallback
    expect(screen.getByText('暂无简介')).toBeInTheDocument(); // Introduction fallback
  });

  it('should disable body scroll when open', () => {
    render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore body scroll when closed', () => {
    const { rerender } = render(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={true}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    rerender(
      <BrowserRouter>
        <JournalDetailPanel
          journal={mockJournal}
          isOpen={false}
          onClose={mockOnClose}
        />
      </BrowserRouter>
    );

    expect(document.body.style.overflow).toBe('');
  });
});
