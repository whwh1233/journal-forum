import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../helpers/testUtils';
import DimensionRatingDisplay from '@/features/comments/components/DimensionRatingDisplay';
import type { DimensionRatings } from '@/types';
import { DIMENSION_LABELS, DIMENSION_KEYS } from '@/types';

describe('DimensionRatingDisplay', () => {
  const fullRatings: DimensionRatings = {
    reviewSpeed: 4,
    editorAttitude: 5,
    acceptDifficulty: 3,
    reviewQuality: 4,
    overallExperience: 5,
  };

  const partialRatings: DimensionRatings = {
    reviewSpeed: 4,
    overallExperience: 5,
  };

  describe('Rendering - No Data', () => {
    it('returns null when dimensionRatings is null', () => {
      const { container } = render(
        <DimensionRatingDisplay dimensionRatings={null} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('returns null when dimensionRatings is undefined', () => {
      const { container } = render(
        <DimensionRatingDisplay dimensionRatings={undefined} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('returns null when all dimension values are undefined', () => {
      const emptyRatings: DimensionRatings = {
        reviewSpeed: undefined,
        editorAttitude: undefined,
        acceptDifficulty: undefined,
        reviewQuality: undefined,
        overallExperience: undefined,
      };

      const { container } = render(
        <DimensionRatingDisplay dimensionRatings={emptyRatings} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('returns null when all dimension values are null', () => {
      const nullRatings: DimensionRatings = {
        reviewSpeed: null as any,
        editorAttitude: null as any,
        acceptDifficulty: null as any,
        reviewQuality: null as any,
        overallExperience: null as any,
      };

      const { container } = render(
        <DimensionRatingDisplay dimensionRatings={nullRatings} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Compact Mode', () => {
    it('renders toggle button in compact mode by default', () => {
      render(<DimensionRatingDisplay dimensionRatings={fullRatings} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText(/多维评分/)).toBeInTheDocument();
    });

    it('shows collapsed icon when not expanded', () => {
      render(<DimensionRatingDisplay dimensionRatings={fullRatings} />);

      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-expanded')).toBe('false');
    });

    it('expands to show dimension grid when toggle is clicked', () => {
      render(<DimensionRatingDisplay dimensionRatings={fullRatings} />);

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      // Should now show all dimension labels
      expect(screen.getByText(DIMENSION_LABELS.reviewSpeed)).toBeInTheDocument();
      expect(screen.getByText(DIMENSION_LABELS.editorAttitude)).toBeInTheDocument();
      expect(screen.getByText(DIMENSION_LABELS.acceptDifficulty)).toBeInTheDocument();
      expect(screen.getByText(DIMENSION_LABELS.reviewQuality)).toBeInTheDocument();
      expect(screen.getByText(DIMENSION_LABELS.overallExperience)).toBeInTheDocument();
    });

    it('collapses when toggle is clicked again', () => {
      render(<DimensionRatingDisplay dimensionRatings={fullRatings} />);

      const toggleButton = screen.getByRole('button');

      // Expand
      fireEvent.click(toggleButton);
      expect(screen.getByText(DIMENSION_LABELS.reviewSpeed)).toBeInTheDocument();

      // Collapse
      fireEvent.click(toggleButton);
      expect(screen.queryByText(DIMENSION_LABELS.reviewSpeed)).not.toBeInTheDocument();
    });

    it('updates aria-expanded attribute when toggled', () => {
      render(<DimensionRatingDisplay dimensionRatings={fullRatings} />);

      const toggleButton = screen.getByRole('button');

      expect(toggleButton.getAttribute('aria-expanded')).toBe('false');

      fireEvent.click(toggleButton);
      expect(toggleButton.getAttribute('aria-expanded')).toBe('true');

      fireEvent.click(toggleButton);
      expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
    });

    it('displays rating values correctly', () => {
      render(<DimensionRatingDisplay dimensionRatings={fullRatings} />);

      fireEvent.click(screen.getByRole('button'));

      // Check for rating values (displayed as integers in compact mode)
      // Values appear in order: reviewSpeed(4), editorAttitude(5), acceptDifficulty(3), reviewQuality(4), overallExperience(5)
      const items = document.querySelectorAll('.dim-display__item-val');
      const values = Array.from(items).map((item) => item.textContent);
      expect(values).toContain('4');
      expect(values).toContain('5');
      expect(values).toContain('3');
    });

    it('only displays dimensions that have values', () => {
      render(<DimensionRatingDisplay dimensionRatings={partialRatings} />);

      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText(DIMENSION_LABELS.reviewSpeed)).toBeInTheDocument();
      expect(screen.getByText(DIMENSION_LABELS.overallExperience)).toBeInTheDocument();
      expect(screen.queryByText(DIMENSION_LABELS.editorAttitude)).not.toBeInTheDocument();
      expect(screen.queryByText(DIMENSION_LABELS.acceptDifficulty)).not.toBeInTheDocument();
      expect(screen.queryByText(DIMENSION_LABELS.reviewQuality)).not.toBeInTheDocument();
    });

    it('shows correct toggle icons', () => {
      render(<DimensionRatingDisplay dimensionRatings={fullRatings} />);

      // Check for collapsed icon
      expect(screen.getByText(/\u25b8/)).toBeInTheDocument(); // Unicode for right triangle

      fireEvent.click(screen.getByRole('button'));

      // Check for expanded icon
      expect(screen.getByText(/\u25be/)).toBeInTheDocument(); // Unicode for down triangle
    });
  });

  describe('Summary Mode', () => {
    it('renders summary header with title', () => {
      render(
        <DimensionRatingDisplay
          dimensionRatings={fullRatings}
          mode="summary"
        />
      );

      expect(screen.getByText(/多维评分/)).toBeInTheDocument();
    });

    it('displays all dimensions without needing to expand', () => {
      render(
        <DimensionRatingDisplay
          dimensionRatings={fullRatings}
          mode="summary"
        />
      );

      expect(screen.getByText(DIMENSION_LABELS.reviewSpeed)).toBeInTheDocument();
      expect(screen.getByText(DIMENSION_LABELS.editorAttitude)).toBeInTheDocument();
      expect(screen.getByText(DIMENSION_LABELS.acceptDifficulty)).toBeInTheDocument();
      expect(screen.getByText(DIMENSION_LABELS.reviewQuality)).toBeInTheDocument();
      expect(screen.getByText(DIMENSION_LABELS.overallExperience)).toBeInTheDocument();
    });

    it('displays rating count when provided', () => {
      render(
        <DimensionRatingDisplay
          dimensionRatings={fullRatings}
          mode="summary"
          ratingCount={42}
        />
      );

      expect(screen.getByText(/42 人评价/)).toBeInTheDocument();
    });

    it('does not display rating count when not provided', () => {
      render(
        <DimensionRatingDisplay
          dimensionRatings={fullRatings}
          mode="summary"
        />
      );

      expect(screen.queryByText(/人评价/)).not.toBeInTheDocument();
    });

    it('displays rating values with one decimal place in summary mode', () => {
      const ratingsWithDecimals: DimensionRatings = {
        reviewSpeed: 4.5,
        editorAttitude: 3.7,
        overallExperience: 5.0,
      };

      render(
        <DimensionRatingDisplay
          dimensionRatings={ratingsWithDecimals}
          mode="summary"
        />
      );

      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('3.7')).toBeInTheDocument();
      expect(screen.getByText('5.0')).toBeInTheDocument();
    });

    it('only displays dimensions that have values', () => {
      render(
        <DimensionRatingDisplay
          dimensionRatings={partialRatings}
          mode="summary"
        />
      );

      expect(screen.getByText(DIMENSION_LABELS.reviewSpeed)).toBeInTheDocument();
      expect(screen.getByText(DIMENSION_LABELS.overallExperience)).toBeInTheDocument();
      expect(screen.queryByText(DIMENSION_LABELS.editorAttitude)).not.toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('renders progress bar for each dimension', () => {
      render(
        <DimensionRatingDisplay
          dimensionRatings={fullRatings}
          mode="summary"
        />
      );

      // Check that there are dimension items with bars
      const items = document.querySelectorAll('.dim-display__item');
      expect(items.length).toBe(5); // All 5 dimensions

      items.forEach((item) => {
        const barWrap = item.querySelector('.dim-display__item-bar-wrap');
        const bar = item.querySelector('.dim-display__item-bar');
        expect(barWrap).toBeTruthy();
        expect(bar).toBeTruthy();
      });
    });

    it('calculates correct width for progress bars', () => {
      render(
        <DimensionRatingDisplay
          dimensionRatings={fullRatings}
          mode="summary"
        />
      );

      const bars = document.querySelectorAll('.dim-display__item-bar');

      // reviewSpeed: 4/5 = 80%
      // editorAttitude: 5/5 = 100%
      // acceptDifficulty: 3/5 = 60%
      // reviewQuality: 4/5 = 80%
      // overallExperience: 5/5 = 100%

      const expectedWidths = ['80%', '100%', '60%', '80%', '100%'];

      bars.forEach((bar, index) => {
        const style = (bar as HTMLElement).style.width;
        expect(style).toBe(expectedWidths[index]);
      });
    });
  });

  describe('CSS Classes', () => {
    it('applies compact class for compact mode', () => {
      const { container } = render(
        <DimensionRatingDisplay
          dimensionRatings={fullRatings}
          mode="compact"
        />
      );

      const display = container.querySelector('.dim-display--compact');
      expect(display).toBeTruthy();
    });

    it('applies summary class for summary mode', () => {
      const { container } = render(
        <DimensionRatingDisplay
          dimensionRatings={fullRatings}
          mode="summary"
        />
      );

      const display = container.querySelector('.dim-display--summary');
      expect(display).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles rating value of 0', () => {
      const ratingsWithZero: DimensionRatings = {
        reviewSpeed: 0,
        overallExperience: 5,
      };

      render(
        <DimensionRatingDisplay
          dimensionRatings={ratingsWithZero}
          mode="summary"
        />
      );

      // 0 should be treated as falsy, so reviewSpeed should not appear
      // But if 0 is a valid value, this behavior might need adjustment
      expect(screen.getByText(DIMENSION_LABELS.overallExperience)).toBeInTheDocument();
    });

    it('handles mixed null and undefined values', () => {
      const mixedRatings: DimensionRatings = {
        reviewSpeed: 4,
        editorAttitude: null as any,
        acceptDifficulty: undefined,
        reviewQuality: 3,
        overallExperience: 5,
      };

      render(
        <DimensionRatingDisplay
          dimensionRatings={mixedRatings}
          mode="summary"
        />
      );

      expect(screen.getByText(DIMENSION_LABELS.reviewSpeed)).toBeInTheDocument();
      expect(screen.getByText(DIMENSION_LABELS.reviewQuality)).toBeInTheDocument();
      expect(screen.getByText(DIMENSION_LABELS.overallExperience)).toBeInTheDocument();
      expect(screen.queryByText(DIMENSION_LABELS.editorAttitude)).not.toBeInTheDocument();
      expect(screen.queryByText(DIMENSION_LABELS.acceptDifficulty)).not.toBeInTheDocument();
    });

    it('renders with single dimension value', () => {
      const singleRating: DimensionRatings = {
        overallExperience: 5,
      };

      render(
        <DimensionRatingDisplay
          dimensionRatings={singleRating}
          mode="summary"
        />
      );

      expect(screen.getByText(DIMENSION_LABELS.overallExperience)).toBeInTheDocument();
      expect(document.querySelectorAll('.dim-display__item').length).toBe(1);
    });
  });
});
