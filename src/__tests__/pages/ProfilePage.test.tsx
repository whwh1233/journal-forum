import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../helpers/testUtils';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import * as userService from '@/services/userService';
import * as badgeService from '@/services/badgeService';
import * as authHook from '@/hooks/useAuth';

vi.mock('@/services/userService');
vi.mock('@/services/badgeService');
vi.mock('@/hooks/useAuth');
vi.mock('@/contexts/PageContext', () => ({ usePageTitle: vi.fn() }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: () => ({ userId: '1' }) };
});
vi.mock('@/features/follow/components/FollowButton', () => ({
  default: ({ userId }: { userId: number }) => (
    <button data-testid={`follow-btn-${userId}`}>Follow</button>
  ),
}));
vi.mock('@/features/badges', () => ({
  BadgeWall: ({ badges, title }: { badges: any[]; title: string }) => (
    <div data-testid="badge-wall">{title} ({badges.length})</div>
  ),
  BadgeList: ({ badges }: { badges: any[] }) => (
    <div data-testid="badge-list">{badges.length} badges</div>
  ),
}));

const mockProfile = {
  id: 1, email: 'test@example.com', name: 'Test User',
  bio: 'A test user bio', avatar: null,
  stats: { points: 100, level: 2, commentCount: 10, favoriteCount: 5, followingCount: 3, followerCount: 8 },
};
const mockBadgesData = {
  badges: [{ id: 1, name: 'Badge 1', code: 'b1', description: 'd', icon: 'Award', color: '#000', category: 'activity', type: 'auto', priority: 1, isActive: true, createdAt: '2024-01-01' }],
  pinnedBadges: [],
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: '2', email: 'other@example.com', name: 'Other' },
      login: vi.fn(), logout: vi.fn(), register: vi.fn(),
      loading: false, isAuthenticated: true, error: null,
      clearError: vi.fn(), checkAuthStatus: vi.fn(),
    });
  });

  it('should show loading state', () => {
    vi.mocked(userService.getUserProfile).mockImplementation(() => new Promise(() => {}));
    vi.mocked(badgeService.getUserBadges).mockImplementation(() => new Promise(() => {}));
    render(<ProfilePage />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('should render profile', async () => {
    vi.mocked(userService.getUserProfile).mockResolvedValue(mockProfile);
    vi.mocked(badgeService.getUserBadges).mockResolvedValue(mockBadgesData);
    render(<ProfilePage />);
    await waitFor(() => { expect(screen.getByText('Test User')).toBeInTheDocument(); });
    expect(screen.getByText('A test user bio')).toBeInTheDocument();
  });

  it('should display stats', async () => {
    vi.mocked(userService.getUserProfile).mockResolvedValue(mockProfile);
    vi.mocked(badgeService.getUserBadges).mockResolvedValue(mockBadgesData);
    render(<ProfilePage />);
    await waitFor(() => { expect(screen.getByText('100')).toBeInTheDocument(); });
    expect(screen.getByText('积分')).toBeInTheDocument();
    expect(screen.getByText('评论')).toBeInTheDocument();
  });

  it('should show error when not found', async () => {
    vi.mocked(userService.getUserProfile).mockRejectedValue(new Error('Not found'));
    vi.mocked(badgeService.getUserBadges).mockResolvedValue({ badges: [], pinnedBadges: [] });
    render(<ProfilePage />);
    await waitFor(() => { expect(screen.getByText('用户不存在')).toBeInTheDocument(); });
  });

  it('should show follow button for others', async () => {
    vi.mocked(userService.getUserProfile).mockResolvedValue(mockProfile);
    vi.mocked(badgeService.getUserBadges).mockResolvedValue(mockBadgesData);
    render(<ProfilePage />);
    await waitFor(() => { expect(screen.getByTestId('follow-btn-1')).toBeInTheDocument(); });
  });

  it('should show edit button for own profile', async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      login: vi.fn(), logout: vi.fn(), register: vi.fn(),
      loading: false, isAuthenticated: true, error: null,
      clearError: vi.fn(), checkAuthStatus: vi.fn(),
    });
    vi.mocked(userService.getUserProfile).mockResolvedValue(mockProfile);
    vi.mocked(badgeService.getUserBadges).mockResolvedValue(mockBadgesData);
    render(<ProfilePage />);
    await waitFor(() => { expect(screen.getByText('编辑资料')).toBeInTheDocument(); });
  });
});
