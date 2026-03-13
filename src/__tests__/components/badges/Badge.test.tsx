import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '@/features/badges/components/Badge';
import type { Badge as BadgeType } from '@/types';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Award: ({ size }: { size: number }) => <span data-testid="icon-award" data-size={size}>Award</span>,
  Star: ({ size }: { size: number }) => <span data-testid="icon-star" data-size={size}>Star</span>,
  MessageCircle: ({ size }: { size: number }) => <span data-testid="icon-message" data-size={size}>MessageCircle</span>,
}));

const createMockBadge = (overrides?: Partial<BadgeType>): BadgeType => ({
  id: 1,
  code: 'first_comment',
  name: '初次发言',
  description: '发表第一条评论',
  icon: 'MessageCircle',
  color: '#3b82f6',
  category: 'activity',
  type: 'auto',
  priority: 1,
  isActive: true,
  createdAt: '2024-01-01',
  ...overrides,
});

describe('Badge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders badge with icon and name', () => {
      const badge = createMockBadge();
      render(<Badge badge={badge} />);

      expect(screen.getByText('初次发言')).toBeInTheDocument();
      expect(screen.getByTestId('icon-message')).toBeInTheDocument();
    });

    it('renders badge without name when showName is false', () => {
      const badge = createMockBadge();
      render(<Badge badge={badge} showName={false} />);

      expect(screen.queryByText('初次发言')).not.toBeInTheDocument();
      expect(screen.getByTestId('icon-message')).toBeInTheDocument();
    });

    it('applies badge color as CSS variable', () => {
      const badge = createMockBadge({ color: '#ef4444' });
      const { container } = render(<Badge badge={badge} />);

      const badgeElement = container.querySelector('.badge');
      expect(badgeElement).toHaveStyle('--badge-color: #ef4444');
    });

    it('shows tooltip when showTooltip is true', () => {
      const badge = createMockBadge({ description: '这是一个测试描述' });
      const { container } = render(<Badge badge={badge} showTooltip={true} />);

      const badgeElement = container.querySelector('.badge');
      expect(badgeElement).toHaveAttribute('title', '这是一个测试描述');
    });

    it('hides tooltip when showTooltip is false', () => {
      const badge = createMockBadge();
      const { container } = render(<Badge badge={badge} showTooltip={false} />);

      const badgeElement = container.querySelector('.badge');
      expect(badgeElement).not.toHaveAttribute('title');
    });
  });

  describe('size variants', () => {
    it('renders small size with correct icon size', () => {
      const badge = createMockBadge();
      const { container } = render(<Badge badge={badge} size="sm" />);

      expect(container.querySelector('.badge--sm')).toBeInTheDocument();
      expect(screen.getByTestId('icon-message')).toHaveAttribute('data-size', '14');
    });

    it('renders medium size with correct icon size (default)', () => {
      const badge = createMockBadge();
      const { container } = render(<Badge badge={badge} size="md" />);

      expect(container.querySelector('.badge--md')).toBeInTheDocument();
      expect(screen.getByTestId('icon-message')).toHaveAttribute('data-size', '18');
    });

    it('renders large size with correct icon size', () => {
      const badge = createMockBadge();
      const { container } = render(<Badge badge={badge} size="lg" />);

      expect(container.querySelector('.badge--lg')).toBeInTheDocument();
      expect(screen.getByTestId('icon-message')).toHaveAttribute('data-size', '24');
    });
  });

  describe('new badge indicator', () => {
    it('shows new indicator when isNew is true', () => {
      const badge = createMockBadge();
      const { container } = render(<Badge badge={badge} isNew={true} />);

      expect(container.querySelector('.badge--new')).toBeInTheDocument();
      expect(container.querySelector('.badge__new-dot')).toBeInTheDocument();
    });

    it('hides new indicator when isNew is false', () => {
      const badge = createMockBadge();
      const { container } = render(<Badge badge={badge} isNew={false} />);

      expect(container.querySelector('.badge--new')).not.toBeInTheDocument();
      expect(container.querySelector('.badge__new-dot')).not.toBeInTheDocument();
    });
  });

  describe('icon rendering', () => {
    it('renders the correct icon based on badge.icon prop', () => {
      const badge = createMockBadge({ icon: 'Star' });
      render(<Badge badge={badge} />);

      expect(screen.getByTestId('icon-star')).toBeInTheDocument();
    });

    it('renders Award icon as default', () => {
      const badge = createMockBadge({ icon: 'Award' });
      render(<Badge badge={badge} />);

      expect(screen.getByTestId('icon-award')).toBeInTheDocument();
    });
  });

  describe('default props', () => {
    it('uses default values for optional props', () => {
      const badge = createMockBadge();
      const { container } = render(<Badge badge={badge} />);

      // Default size is 'md'
      expect(container.querySelector('.badge--md')).toBeInTheDocument();
      // Default showName is true
      expect(screen.getByText('初次发言')).toBeInTheDocument();
      // Default showTooltip is true
      expect(container.querySelector('.badge')).toHaveAttribute('title');
      // Default isNew is false
      expect(container.querySelector('.badge--new')).not.toBeInTheDocument();
    });
  });
});
