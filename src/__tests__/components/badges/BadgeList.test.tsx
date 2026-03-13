import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import BadgeList from '@/features/badges/components/BadgeList';
import type { Badge as BadgeType } from '@/types';

// Mock the Badge component
vi.mock('@/features/badges/components/Badge', () => ({
  default: ({ badge, size, showName, showTooltip, isNew }: {
    badge: BadgeType;
    size: string;
    showName: boolean;
    showTooltip: boolean;
    isNew?: boolean;
  }) => (
    <div
      data-testid={`badge-${badge.id}`}
      data-size={size}
      data-show-name={showName}
      data-show-tooltip={showTooltip}
      data-is-new={isNew}
    >
      {badge.name}
    </div>
  ),
}));

const createMockBadge = (id: number, name: string, isNew = false): BadgeType => ({
  id,
  code: `badge_${id}`,
  name,
  description: `Description for ${name}`,
  icon: 'Award',
  color: '#3b82f6',
  category: 'activity',
  type: 'auto',
  priority: id,
  isActive: true,
  createdAt: '2024-01-01',
  isNew,
});

describe('BadgeList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('empty state', () => {
    it('returns null when badges array is empty', () => {
      const { container } = render(<BadgeList badges={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when badges is undefined', () => {
      const { container } = render(<BadgeList badges={undefined as unknown as BadgeType[]} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('rendering badges', () => {
    it('renders all badges when count is less than maxDisplay', () => {
      const badges = [
        createMockBadge(1, '徽章1'),
        createMockBadge(2, '徽章2'),
      ];
      render(<BadgeList badges={badges} maxDisplay={3} />);

      expect(screen.getByTestId('badge-1')).toBeInTheDocument();
      expect(screen.getByTestId('badge-2')).toBeInTheDocument();
    });

    it('renders only maxDisplay badges when count exceeds limit', () => {
      const badges = [
        createMockBadge(1, '徽章1'),
        createMockBadge(2, '徽章2'),
        createMockBadge(3, '徽章3'),
        createMockBadge(4, '徽章4'),
      ];
      render(<BadgeList badges={badges} maxDisplay={2} />);

      expect(screen.getByTestId('badge-1')).toBeInTheDocument();
      expect(screen.getByTestId('badge-2')).toBeInTheDocument();
      expect(screen.queryByTestId('badge-3')).not.toBeInTheDocument();
      expect(screen.queryByTestId('badge-4')).not.toBeInTheDocument();
    });

    it('uses default maxDisplay of 3', () => {
      const badges = [
        createMockBadge(1, '徽章1'),
        createMockBadge(2, '徽章2'),
        createMockBadge(3, '徽章3'),
        createMockBadge(4, '徽章4'),
        createMockBadge(5, '徽章5'),
      ];
      render(<BadgeList badges={badges} />);

      expect(screen.getByTestId('badge-1')).toBeInTheDocument();
      expect(screen.getByTestId('badge-2')).toBeInTheDocument();
      expect(screen.getByTestId('badge-3')).toBeInTheDocument();
      expect(screen.queryByTestId('badge-4')).not.toBeInTheDocument();
    });
  });

  describe('remaining count indicator', () => {
    it('shows remaining count when badges exceed maxDisplay', () => {
      const badges = [
        createMockBadge(1, '徽章1'),
        createMockBadge(2, '徽章2'),
        createMockBadge(3, '徽章3'),
        createMockBadge(4, '徽章4'),
        createMockBadge(5, '徽章5'),
      ];
      render(<BadgeList badges={badges} maxDisplay={3} />);

      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('does not show remaining count when badges equal maxDisplay', () => {
      const badges = [
        createMockBadge(1, '徽章1'),
        createMockBadge(2, '徽章2'),
        createMockBadge(3, '徽章3'),
      ];
      render(<BadgeList badges={badges} maxDisplay={3} />);

      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    });

    it('does not show remaining count when badges are less than maxDisplay', () => {
      const badges = [
        createMockBadge(1, '徽章1'),
        createMockBadge(2, '徽章2'),
      ];
      render(<BadgeList badges={badges} maxDisplay={5} />);

      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    });
  });

  describe('prop passing to Badge component', () => {
    it('passes size prop to Badge components', () => {
      const badges = [createMockBadge(1, '徽章1')];
      render(<BadgeList badges={badges} size="lg" />);

      expect(screen.getByTestId('badge-1')).toHaveAttribute('data-size', 'lg');
    });

    it('uses default size of sm', () => {
      const badges = [createMockBadge(1, '徽章1')];
      render(<BadgeList badges={badges} />);

      expect(screen.getByTestId('badge-1')).toHaveAttribute('data-size', 'sm');
    });

    it('always passes showName as false', () => {
      const badges = [createMockBadge(1, '徽章1')];
      render(<BadgeList badges={badges} />);

      expect(screen.getByTestId('badge-1')).toHaveAttribute('data-show-name', 'false');
    });

    it('passes showTooltip prop to Badge components', () => {
      const badges = [createMockBadge(1, '徽章1')];
      render(<BadgeList badges={badges} showTooltip={false} />);

      expect(screen.getByTestId('badge-1')).toHaveAttribute('data-show-tooltip', 'false');
    });

    it('uses default showTooltip of true', () => {
      const badges = [createMockBadge(1, '徽章1')];
      render(<BadgeList badges={badges} />);

      expect(screen.getByTestId('badge-1')).toHaveAttribute('data-show-tooltip', 'true');
    });

    it('passes isNew from badge data', () => {
      const badges = [createMockBadge(1, '徽章1', true)];
      render(<BadgeList badges={badges} />);

      expect(screen.getByTestId('badge-1')).toHaveAttribute('data-is-new', 'true');
    });
  });

  describe('CSS class', () => {
    it('renders with badge-list class', () => {
      const badges = [createMockBadge(1, '徽章1')];
      const { container } = render(<BadgeList badges={badges} />);

      expect(container.querySelector('.badge-list')).toBeInTheDocument();
    });

    it('renders more indicator with badge-list__more class', () => {
      const badges = [
        createMockBadge(1, '徽章1'),
        createMockBadge(2, '徽章2'),
      ];
      const { container } = render(<BadgeList badges={badges} maxDisplay={1} />);

      expect(container.querySelector('.badge-list__more')).toBeInTheDocument();
    });
  });
});
