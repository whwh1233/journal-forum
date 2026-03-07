import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import JournalInfoCard from '@/components/common/JournalInfoCard';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('JournalInfoCard', () => {
  const mockJournal = {
    id: 1,
    title: 'Nature',
    issn: '0028-0836',
    category: 'SCI',
    rating: 4.5,
    reviews: 120,
    description: '顶级综合性科学期刊',
    dimensionAverages: {
      reviewSpeed: 4.0,
      editorAttitude: 4.5,
      acceptDifficulty: 4.8,
      reviewQuality: 4.6,
      overallExperience: 4.5
    }
  };

  const mockOnFavoriteToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('渲染测试', () => {
    it('should render journal title', () => {
      render(<JournalInfoCard journal={mockJournal} />);
      expect(screen.getByText('Nature')).toBeInTheDocument();
    });

    it('should render ISSN', () => {
      render(<JournalInfoCard journal={mockJournal} />);
      expect(screen.getByText(/ISSN: 0028-0836/)).toBeInTheDocument();
    });

    it('should render category', () => {
      render(<JournalInfoCard journal={mockJournal} />);
      expect(screen.getByText('SCI')).toBeInTheDocument();
    });

    it('should render rating', () => {
      render(<JournalInfoCard journal={mockJournal} />);
      // Rating displays as "⭐ 4.5"
      expect(screen.getByText(/⭐ 4.5/)).toBeInTheDocument();
    });

    it('should render review count', () => {
      render(<JournalInfoCard journal={mockJournal} />);
      expect(screen.getByText('120 条评论')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      render(<JournalInfoCard journal={mockJournal} />);
      expect(screen.getByText('顶级综合性科学期刊')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      const journalWithoutDesc = { ...mockJournal, description: undefined };
      render(<JournalInfoCard journal={journalWithoutDesc} />);
      expect(screen.queryByText('顶级综合性科学期刊')).not.toBeInTheDocument();
    });

    it('should truncate long title', () => {
      const longTitleJournal = {
        ...mockJournal,
        title: 'A Very Long Journal Title That Exceeds Fifty Characters And Should Be Truncated'
      };
      render(<JournalInfoCard journal={longTitleJournal} />);
      // Title should be truncated with ...
      expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument();
    });
  });

  describe('维度评分', () => {
    it('should render all 5 dimension labels', () => {
      render(<JournalInfoCard journal={mockJournal} />);

      expect(screen.getByText('审稿速度')).toBeInTheDocument();
      expect(screen.getByText('编辑态度')).toBeInTheDocument();
      expect(screen.getByText('录用难度')).toBeInTheDocument();
      expect(screen.getByText('审稿质量')).toBeInTheDocument();
      expect(screen.getByText('综合体验')).toBeInTheDocument();
    });

    it('should display dimension values', () => {
      render(<JournalInfoCard journal={mockJournal} />);

      // Check that dimension values are displayed (4.0, 4.5, 4.8, 4.6, 4.5)
      const dimensionValues = screen.getAllByText(/^[0-4]\.[0-9]$/);
      expect(dimensionValues.length).toBe(5);
    });

    it('should handle missing dimension values', () => {
      const journalWithMissingDimensions = {
        ...mockJournal,
        dimensionAverages: {
          reviewSpeed: 3.0
          // Other dimensions missing
        }
      };
      render(<JournalInfoCard journal={journalWithMissingDimensions} />);

      // Should still render all 5 dimensions with 0.0 for missing ones
      expect(screen.getByText('审稿速度')).toBeInTheDocument();
      expect(screen.getByText('3.0')).toBeInTheDocument();
    });
  });

  describe('导航功能', () => {
    it('should navigate to journal detail when title is clicked', async () => {
      const user = userEvent.setup();
      render(<JournalInfoCard journal={mockJournal} />);

      const title = screen.getByText('Nature');
      await user.click(title);

      expect(mockNavigate).toHaveBeenCalledWith('/journals/1');
    });

    it('should navigate to journal detail when view comments button is clicked', async () => {
      const user = userEvent.setup();
      render(<JournalInfoCard journal={mockJournal} />);

      const viewButton = screen.getByRole('button', { name: /查看评论/i });
      await user.click(viewButton);

      expect(mockNavigate).toHaveBeenCalledWith('/journals/1');
    });
  });

  describe('收藏功能', () => {
    it('should not render favorite button when onFavoriteToggle is not provided', () => {
      render(<JournalInfoCard journal={mockJournal} />);
      expect(screen.queryByTitle('收藏')).not.toBeInTheDocument();
      expect(screen.queryByTitle('取消收藏')).not.toBeInTheDocument();
    });

    it('should render unfavorited state when isFavorited is false', () => {
      render(
        <JournalInfoCard
          journal={mockJournal}
          isFavorited={false}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );
      const favoriteBtn = screen.getByTitle('收藏');
      expect(favoriteBtn).toHaveTextContent('☆');
    });

    it('should render favorited state when isFavorited is true', () => {
      render(
        <JournalInfoCard
          journal={mockJournal}
          isFavorited={true}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );
      const favoriteBtn = screen.getByTitle('取消收藏');
      expect(favoriteBtn).toHaveTextContent('★');
    });

    it('should call onFavoriteToggle when favorite button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <JournalInfoCard
          journal={mockJournal}
          isFavorited={false}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      const favoriteBtn = screen.getByTitle('收藏');
      await user.click(favoriteBtn);

      expect(mockOnFavoriteToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('样式类', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <JournalInfoCard journal={mockJournal} className="custom-class" />
      );
      expect(container.querySelector('.journal-info-card.custom-class')).toBeInTheDocument();
    });

    it('should have active class on favorite button when favorited', () => {
      render(
        <JournalInfoCard
          journal={mockJournal}
          isFavorited={true}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );
      const favoriteBtn = screen.getByTitle('取消收藏');
      expect(favoriteBtn).toHaveClass('active');
    });
  });
});
