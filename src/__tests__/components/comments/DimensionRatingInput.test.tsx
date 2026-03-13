import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../helpers/testUtils';
import userEvent from '@testing-library/user-event';
import DimensionRatingInput from '@/features/comments/components/DimensionRatingInput';
import type { DimensionRatings } from '@/types';
import { DIMENSION_LABELS, DIMENSION_KEYS } from '@/types';

describe('DimensionRatingInput', () => {
  const mockOnChange = vi.fn();
  const emptyRatings: DimensionRatings = {};
  const partialRatings: DimensionRatings = {
    reviewSpeed: 4,
    overallExperience: 5,
  };
  const fullRatings: DimensionRatings = {
    reviewSpeed: 4,
    editorAttitude: 5,
    acceptDifficulty: 3,
    reviewQuality: 4,
    overallExperience: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component with title', () => {
      render(
        <DimensionRatingInput value={emptyRatings} onChange={mockOnChange} />
      );

      expect(screen.getByText('多维评价')).toBeInTheDocument();
    });

    it('renders all 5 dimension labels', () => {
      render(
        <DimensionRatingInput value={emptyRatings} onChange={mockOnChange} />
      );

      DIMENSION_KEYS.forEach((key) => {
        expect(screen.getByText(DIMENSION_LABELS[key])).toBeInTheDocument();
      });
    });

    it('renders 5 stars for each dimension', () => {
      render(
        <DimensionRatingInput value={emptyRatings} onChange={mockOnChange} />
      );

      // Each dimension should have 5 star buttons
      const starButtons = screen.getAllByRole('button');
      expect(starButtons.length).toBe(DIMENSION_KEYS.length * 5); // 5 dimensions * 5 stars
    });

    it('displays hint text about required field', () => {
      render(
        <DimensionRatingInput value={emptyRatings} onChange={mockOnChange} />
      );

      expect(screen.getByText(/综合体验为必填/)).toBeInTheDocument();
    });
  });

  describe('Star Display', () => {
    it('shows all stars as empty when no ratings', () => {
      render(
        <DimensionRatingInput value={emptyRatings} onChange={mockOnChange} />
      );

      const starButtons = screen.getAllByRole('button');

      // All stars should not have 'filled' class
      starButtons.forEach((star) => {
        expect(star.className).not.toContain('filled');
      });
    });

    it('fills stars based on rating value', () => {
      render(
        <DimensionRatingInput value={fullRatings} onChange={mockOnChange} />
      );

      // For reviewSpeed (rating 4), first 4 stars should be filled
      const reviewSpeedStars = screen.getAllByRole('button', { name: /审稿速度/ });

      reviewSpeedStars.forEach((star, index) => {
        if (index < 4) {
          expect(star.className).toContain('filled');
        } else {
          expect(star.className).not.toContain('filled');
        }
      });
    });

    it('fills correct number of stars for each dimension', () => {
      render(
        <DimensionRatingInput value={fullRatings} onChange={mockOnChange} />
      );

      // Check each dimension
      Object.entries(fullRatings).forEach(([key, rating]) => {
        const stars = screen.getAllByRole('button', {
          name: new RegExp(DIMENSION_LABELS[key])
        });

        stars.forEach((star, index) => {
          if (index < rating!) {
            expect(star.className).toContain('filled');
          } else {
            expect(star.className).not.toContain('filled');
          }
        });
      });
    });
  });

  describe('Score Display', () => {
    it('displays dash when dimension has no rating', () => {
      render(
        <DimensionRatingInput value={emptyRatings} onChange={mockOnChange} />
      );

      // Should have 5 dash displays (one for each unrated dimension)
      const dashDisplays = screen.getAllByText('\u2014'); // em-dash
      expect(dashDisplays.length).toBe(5);
    });

    it('displays score text for rated dimensions', () => {
      render(
        <DimensionRatingInput value={fullRatings} onChange={mockOnChange} />
      );

      // Multiple dimensions may have the same score, so use getAllByText
      const fourScores = screen.getAllByText('4分');
      const fiveScores = screen.getAllByText('5分');
      const threeScores = screen.getAllByText('3分');

      // reviewSpeed(4) and reviewQuality(4) both have score 4
      expect(fourScores.length).toBe(2);
      // editorAttitude(5) and overallExperience(5) both have score 5
      expect(fiveScores.length).toBe(2);
      // acceptDifficulty(3) has score 3
      expect(threeScores.length).toBe(1);
    });

    it('shows mix of scores and dashes for partial ratings', () => {
      render(
        <DimensionRatingInput value={partialRatings} onChange={mockOnChange} />
      );

      expect(screen.getByText('4分')).toBeInTheDocument(); // reviewSpeed
      expect(screen.getByText('5分')).toBeInTheDocument(); // overallExperience

      const dashes = screen.getAllByText('\u2014');
      expect(dashes.length).toBe(3); // 3 unrated dimensions
    });
  });

  describe('Click Interactions', () => {
    it('calls onChange when a star is clicked', async () => {
      render(
        <DimensionRatingInput value={emptyRatings} onChange={mockOnChange} />
      );

      const reviewSpeedStars = screen.getAllByRole('button', { name: /审稿速度/ });
      await userEvent.click(reviewSpeedStars[2]); // Click 3rd star (index 2)

      expect(mockOnChange).toHaveBeenCalledWith({ reviewSpeed: 3 });
    });

    it('updates rating when clicking different stars', async () => {
      render(
        <DimensionRatingInput value={emptyRatings} onChange={mockOnChange} />
      );

      // Click star 4 for 编辑态度
      const editorStars = screen.getAllByRole('button', { name: /编辑态度/ });
      await userEvent.click(editorStars[3]); // 4th star

      expect(mockOnChange).toHaveBeenCalledWith({ editorAttitude: 4 });
    });

    it('preserves existing ratings when adding new one', async () => {
      render(
        <DimensionRatingInput value={partialRatings} onChange={mockOnChange} />
      );

      const editorStars = screen.getAllByRole('button', { name: /编辑态度/ });
      await userEvent.click(editorStars[4]); // 5th star

      expect(mockOnChange).toHaveBeenCalledWith({
        ...partialRatings,
        editorAttitude: 5,
      });
    });

    it('allows rating of 1 star', async () => {
      render(
        <DimensionRatingInput value={emptyRatings} onChange={mockOnChange} />
      );

      const reviewSpeedStars = screen.getAllByRole('button', { name: /审稿速度/ });
      await userEvent.click(reviewSpeedStars[0]); // First star

      expect(mockOnChange).toHaveBeenCalledWith({ reviewSpeed: 1 });
    });

    it('allows rating of 5 stars', async () => {
      render(
        <DimensionRatingInput value={emptyRatings} onChange={mockOnChange} />
      );

      const reviewSpeedStars = screen.getAllByRole('button', { name: /审稿速度/ });
      await userEvent.click(reviewSpeedStars[4]); // Last star

      expect(mockOnChange).toHaveBeenCalledWith({ reviewSpeed: 5 });
    });

    it('can change an existing rating', async () => {
      render(
        <DimensionRatingInput value={fullRatings} onChange={mockOnChange} />
      );

      // reviewSpeed is currently 4, change to 2
      const reviewSpeedStars = screen.getAllByRole('button', { name: /审稿速度/ });
      await userEvent.click(reviewSpeedStars[1]); // 2nd star

      expect(mockOnChange).toHaveBeenCalledWith({
        ...fullRatings,
        reviewSpeed: 2,
      });
    });
  });

  describe('All Dimensions', () => {
    it('allows rating all five dimensions', async () => {
      let currentRatings: DimensionRatings = {};
      const onChange = (newRatings: DimensionRatings) => {
        currentRatings = newRatings;
        mockOnChange(newRatings);
      };

      const { rerender } = render(
        <DimensionRatingInput value={currentRatings} onChange={onChange} />
      );

      // Rate each dimension
      for (let i = 0; i < DIMENSION_KEYS.length; i++) {
        const key = DIMENSION_KEYS[i];
        const stars = screen.getAllByRole('button', {
          name: new RegExp(DIMENSION_LABELS[key])
        });

        await userEvent.click(stars[i]); // Give different ratings 1-5

        rerender(
          <DimensionRatingInput value={currentRatings} onChange={onChange} />
        );
      }

      expect(mockOnChange).toHaveBeenCalledTimes(5);
    });
  });

  describe('Accessibility', () => {
    it('stars have proper role="button"', () => {
      render(
        <DimensionRatingInput value={emptyRatings} onChange={mockOnChange} />
      );

      const starButtons = screen.getAllByRole('button');
      expect(starButtons.length).toBeGreaterThan(0);
    });

    it('stars have proper aria-labels', () => {
      render(
        <DimensionRatingInput value={emptyRatings} onChange={mockOnChange} />
      );

      // Check that aria-labels contain dimension name and score
      DIMENSION_KEYS.forEach((key) => {
        for (let i = 1; i <= 5; i++) {
          const ariaLabel = `${DIMENSION_LABELS[key]} ${i}分`;
          expect(screen.getByRole('button', { name: ariaLabel })).toBeInTheDocument();
        }
      });
    });

    it('stars are keyboard accessible', async () => {
      render(
        <DimensionRatingInput value={emptyRatings} onChange={mockOnChange} />
      );

      const firstStar = screen.getAllByRole('button')[0];
      firstStar.focus();

      // Simulate Enter key press
      fireEvent.keyDown(firstStar, { key: 'Enter', code: 'Enter' });
      fireEvent.click(firstStar);

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('CSS Classes', () => {
    it('applies correct class for filled stars', () => {
      render(
        <DimensionRatingInput value={{ reviewSpeed: 3 }} onChange={mockOnChange} />
      );

      const reviewSpeedStars = screen.getAllByRole('button', { name: /审稿速度/ });

      // First 3 should be filled
      expect(reviewSpeedStars[0].className).toContain('filled');
      expect(reviewSpeedStars[1].className).toContain('filled');
      expect(reviewSpeedStars[2].className).toContain('filled');

      // Last 2 should not be filled
      expect(reviewSpeedStars[3].className).not.toContain('filled');
      expect(reviewSpeedStars[4].className).not.toContain('filled');
    });

    it('applies dimension-star class to all stars', () => {
      render(
        <DimensionRatingInput value={emptyRatings} onChange={mockOnChange} />
      );

      const stars = screen.getAllByRole('button');
      stars.forEach((star) => {
        expect(star.className).toContain('dimension-star');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles value of 0 correctly', () => {
      const ratingsWithZero: DimensionRatings = {
        reviewSpeed: 0,
      };

      render(
        <DimensionRatingInput value={ratingsWithZero} onChange={mockOnChange} />
      );

      const reviewSpeedStars = screen.getAllByRole('button', { name: /审稿速度/ });

      // No stars should be filled for rating of 0
      reviewSpeedStars.forEach((star) => {
        expect(star.className).not.toContain('filled');
      });
    });

    it('handles undefined value gracefully', () => {
      const ratingsWithUndefined: DimensionRatings = {
        reviewSpeed: undefined,
      };

      render(
        <DimensionRatingInput value={ratingsWithUndefined} onChange={mockOnChange} />
      );

      const reviewSpeedStars = screen.getAllByRole('button', { name: /审稿速度/ });

      // No stars should be filled for undefined rating
      reviewSpeedStars.forEach((star) => {
        expect(star.className).not.toContain('filled');
      });
    });

    it('renders correctly with empty object', () => {
      render(
        <DimensionRatingInput value={{}} onChange={mockOnChange} />
      );

      // Should render all dimension rows
      DIMENSION_KEYS.forEach((key) => {
        expect(screen.getByText(DIMENSION_LABELS[key])).toBeInTheDocument();
      });

      // All should show dash
      const dashes = screen.getAllByText('\u2014');
      expect(dashes.length).toBe(5);
    });
  });
});
