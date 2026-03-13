import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BadgePicker from '@/features/badges/components/BadgePicker';
import * as badgeService from '@/services/badgeService';
import type { Badge as BadgeType, MyBadgesResponse } from '@/types';

// Mock the badge service
vi.mock('@/services/badgeService', () => ({
  getMyBadges: vi.fn(),
  setPinnedBadges: vi.fn(),
}));

// Mock the Badge component
vi.mock('@/features/badges/components/Badge', () => ({
  default: ({ badge, size, showName }: {
    badge: BadgeType;
    size: string;
    showName: boolean;
  }) => (
    <div
      data-testid={`badge-${badge.id}`}
      data-size={size}
      data-show-name={showName}
    >
      {badge.name}
    </div>
  ),
}));

const createMockBadge = (id: number, name: string): BadgeType => ({
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
});

describe('BadgePicker', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows loading indicator while fetching badges', async () => {
      vi.mocked(badgeService.getMyBadges).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<BadgePicker onSave={mockOnSave} />);

      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no badges available', async () => {
      vi.mocked(badgeService.getMyBadges).mockResolvedValue({
        badges: [],
        pinnedBadges: [],
        hasNewBadges: false,
      });

      render(<BadgePicker onSave={mockOnSave} />);

      await waitFor(() => {
        expect(screen.getByText('暂无可展示的徽章')).toBeInTheDocument();
      });
    });
  });

  describe('badge display', () => {
    it('renders all available badges', async () => {
      const badges = [
        createMockBadge(1, '徽章1'),
        createMockBadge(2, '徽章2'),
        createMockBadge(3, '徽章3'),
      ];

      vi.mocked(badgeService.getMyBadges).mockResolvedValue({
        badges,
        pinnedBadges: [],
        hasNewBadges: false,
      });

      render(<BadgePicker onSave={mockOnSave} />);

      await waitFor(() => {
        expect(screen.getByTestId('badge-1')).toBeInTheDocument();
        expect(screen.getByTestId('badge-2')).toBeInTheDocument();
        expect(screen.getByTestId('badge-3')).toBeInTheDocument();
      });
    });

    it('shows selection count indicator', async () => {
      vi.mocked(badgeService.getMyBadges).mockResolvedValue({
        badges: [createMockBadge(1, '徽章1')],
        pinnedBadges: [],
        hasNewBadges: false,
      });

      render(<BadgePicker onSave={mockOnSave} />);

      await waitFor(() => {
        expect(screen.getByText('0/3')).toBeInTheDocument();
      });
    });

    it('shows header title', async () => {
      vi.mocked(badgeService.getMyBadges).mockResolvedValue({
        badges: [createMockBadge(1, '徽章1')],
        pinnedBadges: [],
        hasNewBadges: false,
      });

      render(<BadgePicker onSave={mockOnSave} />);

      await waitFor(() => {
        expect(screen.getByText('选择置顶徽章')).toBeInTheDocument();
      });
    });

    it('shows hint text', async () => {
      vi.mocked(badgeService.getMyBadges).mockResolvedValue({
        badges: [createMockBadge(1, '徽章1')],
        pinnedBadges: [],
        hasNewBadges: false,
      });

      render(<BadgePicker onSave={mockOnSave} />);

      await waitFor(() => {
        expect(screen.getByText('选择最多 3 个徽章在评论区和用户列表中展示')).toBeInTheDocument();
      });
    });
  });

  describe('badge selection', () => {
    it('selects badge on click', async () => {
      const user = userEvent.setup();
      const badges = [createMockBadge(1, '徽章1')];

      vi.mocked(badgeService.getMyBadges).mockResolvedValue({
        badges,
        pinnedBadges: [],
        hasNewBadges: false,
      });

      render(<BadgePicker onSave={mockOnSave} />);

      await waitFor(() => {
        expect(screen.getByTestId('badge-1')).toBeInTheDocument();
      });

      const badgeItem = screen.getByTestId('badge-1').closest('.badge-picker__item');
      expect(badgeItem).toBeInTheDocument();
      await user.click(badgeItem!);

      await waitFor(() => {
        expect(screen.getByText('1/3')).toBeInTheDocument();
      });
    });

    it('deselects badge on second click', async () => {
      const user = userEvent.setup();
      const badges = [createMockBadge(1, '徽章1')];

      vi.mocked(badgeService.getMyBadges).mockResolvedValue({
        badges,
        pinnedBadges: [createMockBadge(1, '徽章1')],
        hasNewBadges: false,
      });

      render(<BadgePicker onSave={mockOnSave} />);

      await waitFor(() => {
        expect(screen.getByText('1/3')).toBeInTheDocument();
      });

      const badgeItem = screen.getByTestId('badge-1').closest('.badge-picker__item');
      await user.click(badgeItem!);

      await waitFor(() => {
        expect(screen.getByText('0/3')).toBeInTheDocument();
      });
    });

    it('prevents selecting more than 3 badges', async () => {
      const user = userEvent.setup();
      const badges = [
        createMockBadge(1, '徽章1'),
        createMockBadge(2, '徽章2'),
        createMockBadge(3, '徽章3'),
        createMockBadge(4, '徽章4'),
      ];

      vi.mocked(badgeService.getMyBadges).mockResolvedValue({
        badges,
        pinnedBadges: [
          createMockBadge(1, '徽章1'),
          createMockBadge(2, '徽章2'),
          createMockBadge(3, '徽章3'),
        ],
        hasNewBadges: false,
      });

      render(<BadgePicker onSave={mockOnSave} />);

      await waitFor(() => {
        expect(screen.getByText('3/3')).toBeInTheDocument();
      });

      // Try to select a 4th badge
      const badgeItem = screen.getByTestId('badge-4').closest('.badge-picker__item');
      await user.click(badgeItem!);

      // Count should still be 3
      expect(screen.getByText('3/3')).toBeInTheDocument();
    });

    it('loads initial pinned badges as selected', async () => {
      const badges = [
        createMockBadge(1, '徽章1'),
        createMockBadge(2, '徽章2'),
      ];

      vi.mocked(badgeService.getMyBadges).mockResolvedValue({
        badges,
        pinnedBadges: [createMockBadge(1, '徽章1')],
        hasNewBadges: false,
      });

      const { container } = render(<BadgePicker onSave={mockOnSave} />);

      await waitFor(() => {
        expect(screen.getByText('1/3')).toBeInTheDocument();
      });

      // Check that badge 1 has selected class
      const badge1Item = screen.getByTestId('badge-1').closest('.badge-picker__item');
      expect(badge1Item).toHaveClass('badge-picker__item--selected');
    });

    it('shows check icon on selected badges', async () => {
      const badges = [createMockBadge(1, '徽章1')];

      vi.mocked(badgeService.getMyBadges).mockResolvedValue({
        badges,
        pinnedBadges: [createMockBadge(1, '徽章1')],
        hasNewBadges: false,
      });

      const { container } = render(<BadgePicker onSave={mockOnSave} />);

      await waitFor(() => {
        expect(container.querySelector('.badge-picker__check')).toBeInTheDocument();
      });
    });
  });

  describe('saving', () => {
    it('calls setPinnedBadges with selected badge IDs on save', async () => {
      const user = userEvent.setup();
      const badges = [createMockBadge(1, '徽章1'), createMockBadge(2, '徽章2')];

      vi.mocked(badgeService.getMyBadges).mockResolvedValue({
        badges,
        pinnedBadges: [createMockBadge(1, '徽章1')],
        hasNewBadges: false,
      });
      vi.mocked(badgeService.setPinnedBadges).mockResolvedValue([]);

      render(<BadgePicker onSave={mockOnSave} />);

      await waitFor(() => {
        expect(screen.getByText('保存设置')).toBeInTheDocument();
      });

      await user.click(screen.getByText('保存设置'));

      await waitFor(() => {
        expect(badgeService.setPinnedBadges).toHaveBeenCalledWith([1]);
      });
    });

    it('calls onSave callback after successful save', async () => {
      const user = userEvent.setup();
      const badges = [createMockBadge(1, '徽章1')];

      vi.mocked(badgeService.getMyBadges).mockResolvedValue({
        badges,
        pinnedBadges: [],
        hasNewBadges: false,
      });
      vi.mocked(badgeService.setPinnedBadges).mockResolvedValue([]);

      render(<BadgePicker onSave={mockOnSave} />);

      await waitFor(() => {
        expect(screen.getByText('保存设置')).toBeInTheDocument();
      });

      await user.click(screen.getByText('保存设置'));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('shows saving state while saving', async () => {
      const user = userEvent.setup();
      const badges = [createMockBadge(1, '徽章1')];

      vi.mocked(badgeService.getMyBadges).mockResolvedValue({
        badges,
        pinnedBadges: [],
        hasNewBadges: false,
      });
      vi.mocked(badgeService.setPinnedBadges).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 1000))
      );

      render(<BadgePicker onSave={mockOnSave} />);

      await waitFor(() => {
        expect(screen.getByText('保存设置')).toBeInTheDocument();
      });

      await user.click(screen.getByText('保存设置'));

      expect(screen.getByText('保存中...')).toBeInTheDocument();
    });

    it('disables save button while saving', async () => {
      const user = userEvent.setup();
      const badges = [createMockBadge(1, '徽章1')];

      vi.mocked(badgeService.getMyBadges).mockResolvedValue({
        badges,
        pinnedBadges: [],
        hasNewBadges: false,
      });
      vi.mocked(badgeService.setPinnedBadges).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 1000))
      );

      render(<BadgePicker onSave={mockOnSave} />);

      await waitFor(() => {
        expect(screen.getByText('保存设置')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('保存设置');
      await user.click(saveButton);

      expect(screen.getByText('保存中...').closest('button')).toBeDisabled();
    });

    it('handles save error gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const badges = [createMockBadge(1, '徽章1')];

      vi.mocked(badgeService.getMyBadges).mockResolvedValue({
        badges,
        pinnedBadges: [],
        hasNewBadges: false,
      });
      vi.mocked(badgeService.setPinnedBadges).mockRejectedValue(new Error('Save failed'));

      render(<BadgePicker onSave={mockOnSave} />);

      await waitFor(() => {
        expect(screen.getByText('保存设置')).toBeInTheDocument();
      });

      await user.click(screen.getByText('保存设置'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error saving pinned badges:', expect.any(Error));
      });

      expect(mockOnSave).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('initial selected badges', () => {
    it('uses initialSelected prop for initial selection', async () => {
      const badges = [
        createMockBadge(1, '徽章1'),
        createMockBadge(2, '徽章2'),
      ];

      vi.mocked(badgeService.getMyBadges).mockResolvedValue({
        badges,
        pinnedBadges: [],
        hasNewBadges: false,
      });

      render(<BadgePicker onSave={mockOnSave} initialSelected={[2]} />);

      await waitFor(() => {
        expect(screen.getByText('1/3')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('handles load error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(badgeService.getMyBadges).mockRejectedValue(new Error('Load failed'));

      render(<BadgePicker onSave={mockOnSave} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading badges:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});
