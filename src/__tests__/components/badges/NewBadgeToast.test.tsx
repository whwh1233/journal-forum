import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import NewBadgeToast from '@/features/badges/components/NewBadgeToast';
import * as BadgeContext from '@/contexts/BadgeContext';
import type { Badge as BadgeType } from '@/types';

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock lucide-react
vi.mock('lucide-react', () => ({
  X: ({ size }: { size: number }) => <span data-testid="icon-x" data-size={size}>X</span>,
  Award: ({ size }: { size: number }) => <span data-testid="icon-award" data-size={size}>Award</span>,
  Star: ({ size }: { size: number }) => <span data-testid="icon-star" data-size={size}>Star</span>,
}));

const createMockBadge = (id: number, name: string, icon = 'Award'): BadgeType => ({
  id,
  code: `badge_${id}`,
  name,
  description: `Description for ${name}`,
  icon,
  color: '#3b82f6',
  category: 'activity',
  type: 'auto',
  priority: id,
  isActive: true,
  createdAt: '2024-01-01',
});

describe('NewBadgeToast', () => {
  const mockSetNewBadges = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderWithContext = (newBadgesList: BadgeType[]) => {
    vi.spyOn(BadgeContext, 'useBadgeContext').mockReturnValue({
      hasNewBadges: newBadgesList.length > 0,
      newBadgesList,
      setNewBadges: mockSetNewBadges,
      clearNewBadges: vi.fn(),
      refreshBadges: vi.fn(),
    });

    return render(
      <BrowserRouter>
        <NewBadgeToast />
      </BrowserRouter>
    );
  };

  describe('visibility', () => {
    it('returns null when no new badges', () => {
      const { container } = renderWithContext([]);
      expect(container.firstChild).toBeNull();
    });

    it('shows toast when there are new badges', async () => {
      const badges = [createMockBadge(1, '新徽章')];
      renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.getByText('恭喜获得新徽章！')).toBeInTheDocument();
    });

    it('displays badge name', async () => {
      const badges = [createMockBadge(1, '活跃新星')];
      renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.getByText('活跃新星')).toBeInTheDocument();
    });

    it('displays badge description', async () => {
      const badges = [createMockBadge(1, '新徽章')];
      renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.getByText('Description for 新徽章')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies badge color as CSS variable', async () => {
      const badges = [{
        ...createMockBadge(1, '新徽章'),
        color: '#ef4444',
      }];
      const { container } = renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      const toast = container.querySelector('.new-badge-toast');
      expect(toast).toHaveStyle('--badge-color: #ef4444');
    });

    it('adds visible class when shown', async () => {
      const badges = [createMockBadge(1, '新徽章')];
      const { container } = renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      const toast = container.querySelector('.new-badge-toast');
      expect(toast).toHaveClass('new-badge-toast--visible');
    });
  });

  describe('icon rendering', () => {
    it('renders badge icon', async () => {
      const badges = [createMockBadge(1, '新徽章', 'Award')];
      renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.getByTestId('icon-award')).toBeInTheDocument();
    });

    it('renders different icons based on badge.icon prop', async () => {
      const badges = [createMockBadge(1, '新徽章', 'Star')];
      renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.getByTestId('icon-star')).toBeInTheDocument();
    });

    it('renders icon with correct size', async () => {
      const badges = [createMockBadge(1, '新徽章')];
      renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.getByTestId('icon-award')).toHaveAttribute('data-size', '32');
    });
  });

  describe('close functionality', () => {
    it('has close button', async () => {
      const badges = [createMockBadge(1, '新徽章')];
      renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.getByTestId('icon-x')).toBeInTheDocument();
    });

    it('closes toast when close button is clicked', async () => {
      const badges = [createMockBadge(1, '新徽章'), createMockBadge(2, '另一个')];
      const { container } = renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      const closeButton = container.querySelector('.new-badge-toast__close');
      expect(closeButton).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(closeButton!);
      });

      // Wait for animation timeout (300ms)
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(mockSetNewBadges).toHaveBeenCalledWith([createMockBadge(2, '另一个')]);
    });

    it('auto-closes after 5 seconds', async () => {
      const badges = [createMockBadge(1, '新徽章'), createMockBadge(2, '另一个')];
      renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.getByText('新徽章')).toBeInTheDocument();

      // Advance past auto-close timer
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Wait for animation timeout
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(mockSetNewBadges).toHaveBeenCalled();
    });
  });

  describe('navigation', () => {
    it('navigates to profile edit on content click', async () => {
      const badges = [createMockBadge(1, '新徽章')];
      const { container } = renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      const content = container.querySelector('.new-badge-toast__content');
      expect(content).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(content!);
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/profile/edit');
    });
  });

  describe('multiple badges queue', () => {
    it('shows first badge from the list', async () => {
      const badges = [
        createMockBadge(1, '第一个徽章'),
        createMockBadge(2, '第二个徽章'),
      ];
      renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.getByText('第一个徽章')).toBeInTheDocument();
      expect(screen.queryByText('第二个徽章')).not.toBeInTheDocument();
    });

    it('removes first badge when closed and shows next', async () => {
      const badges = [
        createMockBadge(1, '第一个'),
        createMockBadge(2, '第二个'),
        createMockBadge(3, '第三个'),
      ];
      const { container } = renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      const closeButton = container.querySelector('.new-badge-toast__close');
      await act(async () => {
        fireEvent.click(closeButton!);
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Should set remaining badges (second and third)
      expect(mockSetNewBadges).toHaveBeenCalledWith([
        createMockBadge(2, '第二个'),
        createMockBadge(3, '第三个'),
      ]);
    });
  });

  describe('CSS classes', () => {
    it('renders with new-badge-toast class', async () => {
      const badges = [createMockBadge(1, '新徽章')];
      const { container } = renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(container.querySelector('.new-badge-toast')).toBeInTheDocument();
    });

    it('renders close button with new-badge-toast__close class', async () => {
      const badges = [createMockBadge(1, '新徽章')];
      const { container } = renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(container.querySelector('.new-badge-toast__close')).toBeInTheDocument();
    });

    it('renders content with new-badge-toast__content class', async () => {
      const badges = [createMockBadge(1, '新徽章')];
      const { container } = renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(container.querySelector('.new-badge-toast__content')).toBeInTheDocument();
    });

    it('renders icon container with new-badge-toast__icon class', async () => {
      const badges = [createMockBadge(1, '新徽章')];
      const { container } = renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(container.querySelector('.new-badge-toast__icon')).toBeInTheDocument();
    });

    it('renders info container with new-badge-toast__info class', async () => {
      const badges = [createMockBadge(1, '新徽章')];
      const { container } = renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(container.querySelector('.new-badge-toast__info')).toBeInTheDocument();
    });

    it('renders title with new-badge-toast__title class', async () => {
      const badges = [createMockBadge(1, '新徽章')];
      const { container } = renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(container.querySelector('.new-badge-toast__title')).toBeInTheDocument();
    });

    it('renders name with new-badge-toast__name class', async () => {
      const badges = [createMockBadge(1, '新徽章')];
      const { container } = renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(container.querySelector('.new-badge-toast__name')).toBeInTheDocument();
    });

    it('renders description with new-badge-toast__desc class', async () => {
      const badges = [createMockBadge(1, '新徽章')];
      const { container } = renderWithContext(badges);

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(container.querySelector('.new-badge-toast__desc')).toBeInTheDocument();
    });
  });
});
