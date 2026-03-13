import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import BadgeWall from '@/features/badges/components/BadgeWall';
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
      data-category={badge.category}
    >
      {badge.name}
    </div>
  ),
}));

const createMockBadge = (
  id: number,
  name: string,
  category: 'activity' | 'identity' | 'honor' = 'activity',
  isNew = false
): BadgeType => ({
  id,
  code: `badge_${id}`,
  name,
  description: `Description for ${name}`,
  icon: 'Award',
  color: '#3b82f6',
  category,
  type: 'auto',
  priority: id,
  isActive: true,
  createdAt: '2024-01-01',
  isNew,
});

describe('BadgeWall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('empty state', () => {
    it('shows empty message when badges array is empty', () => {
      render(<BadgeWall badges={[]} />);
      expect(screen.getByText('暂无徽章，继续加油！')).toBeInTheDocument();
    });

    it('shows empty message when badges is undefined', () => {
      render(<BadgeWall badges={undefined as unknown as BadgeType[]} />);
      expect(screen.getByText('暂无徽章，继续加油！')).toBeInTheDocument();
    });

    it('has empty class modifier on empty state', () => {
      const { container } = render(<BadgeWall badges={[]} />);
      expect(container.querySelector('.badge-wall--empty')).toBeInTheDocument();
    });
  });

  describe('title', () => {
    it('shows default title', () => {
      const badges = [createMockBadge(1, '徽章1')];
      render(<BadgeWall badges={badges} />);
      expect(screen.getByText('我的徽章')).toBeInTheDocument();
    });

    it('shows custom title', () => {
      const badges = [createMockBadge(1, '徽章1')];
      render(<BadgeWall badges={badges} title="用户徽章" />);
      expect(screen.getByText('用户徽章')).toBeInTheDocument();
      expect(screen.queryByText('我的徽章')).not.toBeInTheDocument();
    });
  });

  describe('badge rendering', () => {
    it('renders all badges', () => {
      const badges = [
        createMockBadge(1, '徽章1'),
        createMockBadge(2, '徽章2'),
        createMockBadge(3, '徽章3'),
      ];
      render(<BadgeWall badges={badges} />);

      expect(screen.getByTestId('badge-1')).toBeInTheDocument();
      expect(screen.getByTestId('badge-2')).toBeInTheDocument();
      expect(screen.getByTestId('badge-3')).toBeInTheDocument();
    });

    it('passes correct props to Badge component', () => {
      const badges = [createMockBadge(1, '徽章1', 'activity', true)];
      render(<BadgeWall badges={badges} />);

      const badge = screen.getByTestId('badge-1');
      expect(badge).toHaveAttribute('data-size', 'md');
      expect(badge).toHaveAttribute('data-show-name', 'true');
      expect(badge).toHaveAttribute('data-show-tooltip', 'true');
      expect(badge).toHaveAttribute('data-is-new', 'true');
    });
  });

  describe('category grouping', () => {
    it('groups badges by category', () => {
      const badges = [
        createMockBadge(1, '活跃徽章1', 'activity'),
        createMockBadge(2, '身份徽章1', 'identity'),
        createMockBadge(3, '荣誉徽章1', 'honor'),
        createMockBadge(4, '活跃徽章2', 'activity'),
      ];
      render(<BadgeWall badges={badges} />);

      expect(screen.getByText('活跃度徽章')).toBeInTheDocument();
      expect(screen.getByText('身份徽章')).toBeInTheDocument();
      expect(screen.getByText('荣誉徽章')).toBeInTheDocument();
    });

    it('renders badges under correct category sections', () => {
      const badges = [
        createMockBadge(1, '活跃徽章1', 'activity'),
        createMockBadge(2, '身份徽章1', 'identity'),
      ];
      const { container } = render(<BadgeWall badges={badges} />);

      // Check category structure
      const categories = container.querySelectorAll('.badge-wall__category');
      expect(categories.length).toBe(2);
    });

    it('handles unknown category gracefully', () => {
      const badges = [{
        ...createMockBadge(1, '未知类别徽章'),
        category: 'unknown' as any,
      }];
      render(<BadgeWall badges={badges} />);

      // Should fallback to category code
      expect(screen.getByText('unknown')).toBeInTheDocument();
    });

    it('handles badges without category', () => {
      const badges = [{
        ...createMockBadge(1, '无类别徽章'),
        category: undefined as any,
      }];
      render(<BadgeWall badges={badges} />);

      // Should fallback to 'other'
      expect(screen.getByText('other')).toBeInTheDocument();
    });
  });

  describe('category labels', () => {
    it('displays correct label for activity category', () => {
      const badges = [createMockBadge(1, '徽章1', 'activity')];
      render(<BadgeWall badges={badges} />);
      expect(screen.getByText('活跃度徽章')).toBeInTheDocument();
    });

    it('displays correct label for identity category', () => {
      const badges = [createMockBadge(1, '徽章1', 'identity')];
      render(<BadgeWall badges={badges} />);
      expect(screen.getByText('身份徽章')).toBeInTheDocument();
    });

    it('displays correct label for honor category', () => {
      const badges = [createMockBadge(1, '徽章1', 'honor')];
      render(<BadgeWall badges={badges} />);
      expect(screen.getByText('荣誉徽章')).toBeInTheDocument();
    });
  });

  describe('CSS classes', () => {
    it('renders with badge-wall class', () => {
      const badges = [createMockBadge(1, '徽章1')];
      const { container } = render(<BadgeWall badges={badges} />);
      expect(container.querySelector('.badge-wall')).toBeInTheDocument();
    });

    it('renders title with badge-wall__title class', () => {
      const badges = [createMockBadge(1, '徽章1')];
      const { container } = render(<BadgeWall badges={badges} />);
      expect(container.querySelector('.badge-wall__title')).toBeInTheDocument();
    });

    it('renders category sections with badge-wall__category class', () => {
      const badges = [createMockBadge(1, '徽章1')];
      const { container } = render(<BadgeWall badges={badges} />);
      expect(container.querySelector('.badge-wall__category')).toBeInTheDocument();
    });

    it('renders category titles with badge-wall__category-title class', () => {
      const badges = [createMockBadge(1, '徽章1')];
      const { container } = render(<BadgeWall badges={badges} />);
      expect(container.querySelector('.badge-wall__category-title')).toBeInTheDocument();
    });

    it('renders badges container with badge-wall__badges class', () => {
      const badges = [createMockBadge(1, '徽章1')];
      const { container } = render(<BadgeWall badges={badges} />);
      expect(container.querySelector('.badge-wall__badges')).toBeInTheDocument();
    });
  });

  describe('multiple badges per category', () => {
    it('renders multiple badges in same category', () => {
      const badges = [
        createMockBadge(1, '活跃徽章1', 'activity'),
        createMockBadge(2, '活跃徽章2', 'activity'),
        createMockBadge(3, '活跃徽章3', 'activity'),
      ];
      render(<BadgeWall badges={badges} />);

      expect(screen.getByTestId('badge-1')).toBeInTheDocument();
      expect(screen.getByTestId('badge-2')).toBeInTheDocument();
      expect(screen.getByTestId('badge-3')).toBeInTheDocument();
    });

    it('only creates one category section per unique category', () => {
      const badges = [
        createMockBadge(1, '活跃徽章1', 'activity'),
        createMockBadge(2, '活跃徽章2', 'activity'),
      ];
      const { container } = render(<BadgeWall badges={badges} />);

      const categories = container.querySelectorAll('.badge-wall__category');
      expect(categories.length).toBe(1);
    });
  });
});
