import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../helpers/testUtils';
import FollowListPage from '@/features/follow/pages/FollowListPage';
import * as followService from '@/services/followService';

vi.mock('@/services/followService');
vi.mock('@/contexts/PageContext', () => ({ usePageTitle: vi.fn() }));

const mockSetSearchParams = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ userId: '1' }),
    useSearchParams: () => [new URLSearchParams('tab=following'), mockSetSearchParams],
  };
});
vi.mock('@/features/follow/components/FollowButton', () => ({
  default: ({ userId }: { userId: number }) => (
    <button data-testid={`follow-btn-${userId}`}>Follow</button>
  ),
}));

const mockFollowing = {
  following: [
    { id: 1, user: { id: 2, email: 'user2@example.com', name: 'User Two', avatar: null }, createdAt: '2024-01-01' },
    { id: 2, user: { id: 3, email: 'user3@example.com', name: 'User Three', avatar: 'https://example.com/a.jpg' }, createdAt: '2024-01-02' },
  ],
  pagination: { currentPage: 1, totalPages: 1, totalItems: 2 },
};

describe('FollowListPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should show loading state', () => {
    vi.mocked(followService.getFollowing).mockImplementation(() => new Promise(() => {}));
    render(<FollowListPage />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('should render following list', async () => {
    vi.mocked(followService.getFollowing).mockResolvedValue(mockFollowing);
    render(<FollowListPage />);
    await waitFor(() => {
      expect(screen.getByText('User Two')).toBeInTheDocument();
      expect(screen.getByText('User Three')).toBeInTheDocument();
    });
  });

  it('should display tabs', async () => {
    vi.mocked(followService.getFollowing).mockResolvedValue(mockFollowing);
    render(<FollowListPage />);
    await waitFor(() => {
      expect(screen.getByText(/关注/)).toBeInTheDocument();
      expect(screen.getByText(/粉丝/)).toBeInTheDocument();
    });
  });

  it('should show empty state', async () => {
    vi.mocked(followService.getFollowing).mockResolvedValue({
      following: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
    });
    render(<FollowListPage />);
    await waitFor(() => { expect(screen.getByText('暂无关注')).toBeInTheDocument(); });
  });

  it('should render follow buttons', async () => {
    vi.mocked(followService.getFollowing).mockResolvedValue(mockFollowing);
    render(<FollowListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('follow-btn-2')).toBeInTheDocument();
      expect(screen.getByTestId('follow-btn-3')).toBeInTheDocument();
    });
  });
});
