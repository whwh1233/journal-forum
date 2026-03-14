import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import JournalInfoCard from '@/components/common/JournalInfoCard';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const renderCard = (props: any = {}) => {
  const defaultProps = {
    journal: {
      journalId: '1',
      name: 'Nature',
      issn: '0028-0836',
      levels: ['SCI'],
      introduction: '顶级综合性科学期刊',
      articleCount: 120,
      ratingCache: {
        rating: 4.5,
        reviewSpeed: 4.0,
        editorAttitude: 4.5,
        acceptDifficulty: 4.8,
        reviewQuality: 4.6,
        overallExperience: 4.5
      }
    },
    ...props
  };
  return render(
    <BrowserRouter>
      <JournalInfoCard {...defaultProps} />
    </BrowserRouter>
  );
};

describe('JournalInfoCard', () => {
  const mockOnFavoriteToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('渲染测试', () => {
    it('should render journal title', () => {
      renderCard();
      expect(screen.getByText('Nature')).toBeInTheDocument();
    });

    it('should render ISSN', () => {
      renderCard();
      expect(screen.getByText(/ISSN: 0028-0836/)).toBeInTheDocument();
    });

    it('should render category/level', () => {
      renderCard();
      expect(screen.getByText('SCI')).toBeInTheDocument();
    });

    it('should render rating', () => {
      renderCard();
      // Rating is rendered as "4.5" next to a Star icon
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('should render review count', () => {
      renderCard();
      // Component shows "120 记录文章"
      expect(screen.getByText('120 记录文章')).toBeInTheDocument();
    });

    it('should render description when expanded', () => {
      // Card is collapsed by default, need to expand it
      renderCard({ defaultExpanded: true });
      expect(screen.getByText(/顶级综合性科学期刊/)).toBeInTheDocument();
    });

    it('should not render description when collapsed', () => {
      renderCard();
      // Card is collapsed by default, description should not be visible
      expect(screen.queryByText(/顶级综合性科学期刊/)).not.toBeInTheDocument();
    });

    it('should not truncate title in header (uses CSS)', () => {
      const longTitleJournal = {
        journalId: '1',
        name: 'A Very Long Journal Title That Exceeds Fifty Characters And Should Be Truncated',
        ratingCache: { rating: 4.5 }
      };
      renderCard({ journal: longTitleJournal });
      // Component uses title attribute for full name, CSS handles truncation
      expect(screen.getByTitle('A Very Long Journal Title That Exceeds Fifty Characters And Should Be Truncated')).toBeInTheDocument();
    });
  });

  describe('维度评分', () => {
    it('should render all 5 dimension labels when expanded', () => {
      renderCard({ defaultExpanded: true });

      expect(screen.getByText('审稿速度')).toBeInTheDocument();
      expect(screen.getByText('编辑态度')).toBeInTheDocument();
      expect(screen.getByText('录用难度')).toBeInTheDocument();
      expect(screen.getByText('审稿质量')).toBeInTheDocument();
      expect(screen.getByText('综合体验')).toBeInTheDocument();
    });

    it('should display dimension values when expanded', () => {
      renderCard({ defaultExpanded: true });

      // Check that dimension values are displayed (4.0, 4.5, 4.8, 4.6, 4.5)
      expect(screen.getByText('4.0')).toBeInTheDocument();
      expect(screen.getByText('4.8')).toBeInTheDocument();
      expect(screen.getByText('4.6')).toBeInTheDocument();
    });

    it('should handle missing dimension values', () => {
      const journal = {
        journalId: '1',
        name: 'Test Journal',
        ratingCache: {
          rating: 3.0,
          reviewSpeed: 3.0
          // other dimensions undefined
        }
      };
      renderCard({ journal, defaultExpanded: true });

      // Should still render all 5 dimension labels
      expect(screen.getByText('审稿速度')).toBeInTheDocument();
      // "3.0" might appear multiple times (rating badge + dimension value), use getAllByText
      expect(screen.getAllByText('3.0').length).toBeGreaterThanOrEqual(1);
      // Missing dimensions should show "0.0"
      const zeros = screen.getAllByText('0.0');
      expect(zeros.length).toBe(4); // 4 missing dimensions
    });
  });

  describe('导航功能', () => {
    it('should toggle expanded state when header is clicked', async () => {
      const user = userEvent.setup();
      renderCard();

      // Initially collapsed
      expect(screen.queryByText('审稿速度')).not.toBeInTheDocument();

      // Click header to expand
      const header = screen.getByText('Nature').closest('.card-header');
      await user.click(header!);

      // Now expanded
      expect(screen.getByText('审稿速度')).toBeInTheDocument();
    });

    it('should navigate to journal detail when view button is clicked', async () => {
      const user = userEvent.setup();
      renderCard({ defaultExpanded: true });

      // Component has a "查看详情" button
      const viewButton = screen.getByText('查看详情').closest('button');
      await user.click(viewButton!);

      expect(mockNavigate).toHaveBeenCalledWith('/journals/1');
    });
  });

  describe('收藏功能', () => {
    it('should not render favorite button when onFavoriteToggle is not provided', () => {
      renderCard({ defaultExpanded: true });
      expect(screen.queryByText('收藏')).not.toBeInTheDocument();
      expect(screen.queryByText('已收藏')).not.toBeInTheDocument();
    });

    it('should render unfavorited state when isFavorited is false', () => {
      renderCard({
        isFavorited: false,
        onFavoriteToggle: mockOnFavoriteToggle,
        defaultExpanded: true
      });

      expect(screen.getByText('收藏')).toBeInTheDocument();
    });

    it('should render favorited state when isFavorited is true', () => {
      renderCard({
        isFavorited: true,
        onFavoriteToggle: mockOnFavoriteToggle,
        defaultExpanded: true
      });

      expect(screen.getByText('已收藏')).toBeInTheDocument();
    });

    it('should call onFavoriteToggle when favorite button is clicked', async () => {
      const user = userEvent.setup();
      renderCard({
        isFavorited: false,
        onFavoriteToggle: mockOnFavoriteToggle,
        defaultExpanded: true
      });

      const favoriteBtn = screen.getByText('收藏').closest('button');
      await user.click(favoriteBtn!);

      expect(mockOnFavoriteToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('样式类', () => {
    it('should apply custom className', () => {
      const { container } = renderCard({ className: 'custom-class' });
      expect(container.querySelector('.journal-info-card.custom-class')).toBeInTheDocument();
    });

    it('should have active class on favorite button when favorited', () => {
      renderCard({
        isFavorited: true,
        onFavoriteToggle: mockOnFavoriteToggle,
        defaultExpanded: true
      });

      // The button has class "action-btn favorite-btn active"
      const favoriteBtn = screen.getByText('已收藏').closest('button');
      expect(favoriteBtn).toHaveClass('active');
    });
  });
});
