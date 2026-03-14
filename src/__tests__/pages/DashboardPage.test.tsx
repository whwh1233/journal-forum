import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../helpers/testUtils';
import userEvent from '@testing-library/user-event';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import * as userService from '@/services/userService';
import * as followService from '@/services/followService';
import * as authHook from '@/hooks/useAuth';

vi.mock('@/services/userService');
vi.mock('@/services/followService');
vi.mock('@/hooks/useAuth');
vi.mock('@/contexts/PageContext', () => ({ usePageTitle: vi.fn() }));
vi.mock('@/features/follow/components/FollowButton', () => ({
  default: ({ userId }: { userId: number }) => (
    <button data-testid={`follow-btn-${userId}`}>关注</button>
  ),
}));

const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
const mockAuthReturn = {
  user: mockUser, login: vi.fn(), logout: vi.fn(), register: vi.fn(),
  loading: false, isAuthenticated: true, error: null,
  clearError: vi.fn(), checkAuthStatus: vi.fn(),
};
const mockActivity = {
  stats: { points: 100, level: 2, commentCount: 10, favoriteCount: 5, followingCount: 3, followerCount: 8 },
};
const mockComments = {
  comments: [{ id: 1, journalTitle: 'Test Journal', content: 'Great journal', createdAt: '2024-01-01' }],
  total: 1,
};
const mockFavorites = {
  favorites: [{ id: 1, journal: { name: 'Favorite Journal', introduction: 'A good journal' }, createdAt: '2024-01-01' }],
  total: 1,
};
const mockFollowing = {
  following: [{ id: 1, user: { id: 2, email: 'user2@example.com', name: 'User Two', avatar: null }, createdAt: '2024-01-01' }],
  pagination: { currentPage: 1, totalPages: 1, totalItems: 1 },
};

describe('DashboardPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should show login prompt when not authenticated', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({ ...mockAuthReturn, user: null, isAuthenticated: false });
    render(<DashboardPage />);
    expect(screen.getByText('请先登录')).toBeInTheDocument();
  });

  it('should render dashboard tabs when authenticated', async () => {
    vi.mocked(authHook.useAuth).mockReturnValue(mockAuthReturn);
    vi.mocked(userService.getUserActivity).mockResolvedValue(mockActivity);
    vi.mocked(userService.getUserComments).mockResolvedValue(mockComments);
    vi.mocked(userService.getUserFavorites).mockResolvedValue(mockFavorites);
    vi.mocked(followService.getFollowing).mockResolvedValue(mockFollowing);
    render(<DashboardPage />);
    expect(screen.getByText('概览')).toBeInTheDocument();
    expect(screen.getByText('我的评论')).toBeInTheDocument();
    expect(screen.getByText('我的收藏')).toBeInTheDocument();
    expect(screen.getByText('我的关注')).toBeInTheDocument();
  });

  it('should display activity stats in overview', async () => {
    vi.mocked(authHook.useAuth).mockReturnValue(mockAuthReturn);
    vi.mocked(userService.getUserActivity).mockResolvedValue(mockActivity);
    vi.mocked(userService.getUserComments).mockResolvedValue(mockComments);
    vi.mocked(userService.getUserFavorites).mockResolvedValue(mockFavorites);
    vi.mocked(followService.getFollowing).mockResolvedValue(mockFollowing);
    render(<DashboardPage />);
    await waitFor(() => { expect(screen.getByText('100')).toBeInTheDocument(); });
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('评论数')).toBeInTheDocument();
  });

  it('should switch to comments tab', async () => {
    const user = userEvent.setup();
    vi.mocked(authHook.useAuth).mockReturnValue(mockAuthReturn);
    vi.mocked(userService.getUserActivity).mockResolvedValue(mockActivity);
    vi.mocked(userService.getUserComments).mockResolvedValue(mockComments);
    vi.mocked(userService.getUserFavorites).mockResolvedValue(mockFavorites);
    vi.mocked(followService.getFollowing).mockResolvedValue(mockFollowing);
    render(<DashboardPage />);
    await waitFor(() => { expect(screen.getByText('100')).toBeInTheDocument(); });
    await user.click(screen.getByText('我的评论'));
    await waitFor(() => { expect(screen.getByText('Great journal')).toBeInTheDocument(); });
  });

  it('should show empty state for comments', async () => {
    const user = userEvent.setup();
    vi.mocked(authHook.useAuth).mockReturnValue(mockAuthReturn);
    vi.mocked(userService.getUserActivity).mockResolvedValue(mockActivity);
    vi.mocked(userService.getUserComments).mockResolvedValue({ comments: [], total: 0 });
    vi.mocked(userService.getUserFavorites).mockResolvedValue(mockFavorites);
    vi.mocked(followService.getFollowing).mockResolvedValue(mockFollowing);
    render(<DashboardPage />);
    await waitFor(() => { expect(screen.getByText('概览')).toBeInTheDocument(); });
    await user.click(screen.getByText('我的评论'));
    await waitFor(() => { expect(screen.getByText('你还没有发表过评论')).toBeInTheDocument(); });
  });
});
