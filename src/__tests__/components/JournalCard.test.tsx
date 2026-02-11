import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../helpers/testUtils';
import JournalCard from '../../features/journals/components/JournalCard';
import { mockJournal } from '../helpers/testUtils';

describe('JournalCard', () => {
  const mockOnClick = vi.fn();
  const mockOnFavorite = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render journal information', () => {
    render(
      <JournalCard
        journal={mockJournal}
        onClick={mockOnClick}
        onFavorite={mockOnFavorite}
        isFavorited={false}
      />
    );

    expect(screen.getByText(mockJournal.title)).toBeInTheDocument();
    expect(screen.getByText(mockJournal.issn)).toBeInTheDocument();
    expect(screen.getByText(mockJournal.description)).toBeInTheDocument();
  });

  it('should display rating with stars', () => {
    render(
      <JournalCard
        journal={mockJournal}
        onClick={mockOnClick}
        onFavorite={mockOnFavorite}
        isFavorited={false}
      />
    );

    // 验证评分显示
    const ratingText = screen.getByText(mockJournal.rating.toString());
    expect(ratingText).toBeInTheDocument();
  });

  it('should display category badge', () => {
    render(
      <JournalCard
        journal={mockJournal}
        onClick={mockOnClick}
        onFavorite={mockOnFavorite}
        isFavorited={false}
      />
    );

    // 验证分类显示
    expect(screen.getByText(/计算机/)).toBeInTheDocument();
  });

  it('should call onClick when card is clicked', () => {
    render(
      <JournalCard
        journal={mockJournal}
        onClick={mockOnClick}
        onFavorite={mockOnFavorite}
        isFavorited={false}
      />
    );

    const card = screen.getByText(mockJournal.title).closest('.journal-card');
    if (card) {
      fireEvent.click(card);
      expect(mockOnClick).toHaveBeenCalledWith(mockJournal);
    }
  });

  it('should call onFavorite when favorite button is clicked', () => {
    render(
      <JournalCard
        journal={mockJournal}
        onClick={mockOnClick}
        onFavorite={mockOnFavorite}
        isFavorited={false}
      />
    );

    const favoriteButton = screen.getByRole('button', { name: /收藏/ });
    fireEvent.click(favoriteButton);

    expect(mockOnFavorite).toHaveBeenCalledWith(mockJournal.id);
    // onClick不应该被调用（事件传播被停止）
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should show different favorite button state when favorited', () => {
    const { rerender } = render(
      <JournalCard
        journal={mockJournal}
        onClick={mockOnClick}
        onFavorite={mockOnFavorite}
        isFavorited={false}
      />
    );

    const favoriteButton = screen.getByRole('button', { name: /收藏/ });
    expect(favoriteButton).toHaveClass('favorite-button');

    // 重新渲染为已收藏状态
    rerender(
      <JournalCard
        journal={mockJournal}
        onClick={mockOnClick}
        onFavorite={mockOnFavorite}
        isFavorited={true}
      />
    );

    const favoritedButton = screen.getByRole('button', { name: /已收藏/ });
    expect(favoritedButton).toHaveClass('favorite-button', 'favorited');
  });

  it('should truncate long description', () => {
    const longDescriptionJournal = {
      ...mockJournal,
      description: 'A'.repeat(200), // 很长的描述
    };

    render(
      <JournalCard
        journal={longDescriptionJournal}
        onClick={mockOnClick}
        onFavorite={mockOnFavorite}
        isFavorited={false}
      />
    );

    const description = screen.getByText(/A+/);
    // 验证描述被截断（通常会显示省略号）
    expect(description.textContent?.length).toBeLessThan(200);
  });

  it('should handle journal with zero rating', () => {
    const noRatingJournal = {
      ...mockJournal,
      rating: 0,
    };

    render(
      <JournalCard
        journal={noRatingJournal}
        onClick={mockOnClick}
        onFavorite={mockOnFavorite}
        isFavorited={false}
      />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should have correct category mapping', () => {
    const categories = [
      { category: 'computer-science', expectedText: '计算机科学' },
      { category: 'biology', expectedText: '生物学' },
      { category: 'physics', expectedText: '物理学' },
    ];

    categories.forEach(({ category, expectedText }) => {
      const { unmount } = render(
        <JournalCard
          journal={{ ...mockJournal, category }}
          onClick={mockOnClick}
          onFavorite={mockOnFavorite}
          isFavorited={false}
        />
      );

      expect(screen.getByText(new RegExp(expectedText))).toBeInTheDocument();
      unmount();
    });
  });

  it('should maintain data structure consistency', () => {
    // 这个测试确保期刊对象有所有必需的字段
    const requiredFields = ['id', 'title', 'issn', 'category', 'rating', 'description'];

    requiredFields.forEach(field => {
      expect(mockJournal).toHaveProperty(field);
    });
  });
});
