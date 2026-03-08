import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../helpers/testUtils';
import JournalCard from '../../features/journals/components/JournalCard';
import { mockJournal } from '../helpers/testUtils';

describe('JournalCard', () => {
  const mockOnClick = vi.fn();


  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render journal information', () => {
    render(
      <JournalCard
        journal={mockJournal as any}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText(mockJournal.name)).toBeInTheDocument();
    expect(screen.getByText(mockJournal.issn)).toBeInTheDocument();
    expect(screen.getByText(mockJournal.introduction)).toBeInTheDocument();
  });

  it('should display rating with stars', () => {
    render(
      <JournalCard
        journal={mockJournal as any}
        onClick={mockOnClick}
      />
    );

    // 验证评分显示
    const ratingText = screen.getByText(mockJournal.ratingCache.rating.toString());
    expect(ratingText).toBeInTheDocument();
  });

  it('should display category badge', () => {
    render(
      <JournalCard
        journal={mockJournal as any}
        onClick={mockOnClick}
      />
    );

    // 验证分类显示
    expect(screen.getByText(/计算机/)).toBeInTheDocument();
  });

  it('should call onClick when card is clicked', () => {
    render(
      <JournalCard
        journal={mockJournal as any}
        onClick={mockOnClick}
      />
    );

    const card = screen.getByText(mockJournal.name).closest('.journal-card');
    if (card) {
      fireEvent.click(card);
      expect(mockOnClick).toHaveBeenCalledWith(mockJournal);
    }
  });



  it('should truncate long description', () => {
    const longDescriptionJournal = {
      ...mockJournal,
      introduction: 'A'.repeat(200), // 很长的描述
    };

    render(
      <JournalCard
        journal={longDescriptionJournal as any}
        onClick={mockOnClick}
      />
    );

    const description = screen.getByText(/A+/);
    // 验证描述被截断（通常会显示省略号）
    expect(description.textContent?.length).toBeLessThan(200);
  });

  it('should handle journal with zero rating', () => {
    const noRatingJournal = {
      ...mockJournal,
      ratingCache: { rating: 0, ratingCount: 0 },
    };

    render(
      <JournalCard
        journal={noRatingJournal as any}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should have correct category mapping', () => {
    const categories = [
      { levels: ['计算机科学'], expectedText: '计算机科学' },
      { levels: ['生物学'], expectedText: '生物学' },
      { levels: ['物理学'], expectedText: '物理学' },
    ];

    categories.forEach(({ levels, expectedText }) => {
      const { unmount } = render(
        <JournalCard
          journal={{ ...mockJournal, levels } as any}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText(new RegExp(expectedText))).toBeInTheDocument();
      unmount();
    });
  });

  it('should maintain data structure consistency', () => {
    // 这个测试确保期刊对象有所有必需的字段
    const requiredFields = ['journalId', 'name', 'issn', 'levels', 'ratingCache', 'introduction'];

    requiredFields.forEach(field => {
      expect(mockJournal).toHaveProperty(field);
    });
  });
});
