import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../helpers/testUtils';
import userEvent from '@testing-library/user-event';
import BadgeGalleryPage from '@/features/badges/pages/BadgeGalleryPage';
import * as badgeService from '@/services/badgeService';
import type { Badge as BadgeType } from '@/types';

vi.mock('@/services/badgeService');
vi.mock('@/contexts/PageContext', () => ({
  usePageTitle: vi.fn(),
}));
vi.mock('@/features/badges/components/Badge', () => ({
  default: ({ badge }: { badge: BadgeType }) => (
    <div data-testid={`badge-${badge.id}`}>{badge.name}</div>
  ),
}));

const createMockBadge = (
  id: number,
  name: string,
  category: 'activity' | 'identity' | 'honor',
  type: 'auto' | 'manual' = 'auto'
): BadgeType => ({
  id,
  code: `badge_${id}`,
  name,
  description: `${name}desc`,
  icon: 'Award',
  color: '#3b82f6',
  category, type, priority: id, isActive: true,
  createdAt: '2024-01-01',
});

const mockBadges: BadgeType[] = [
  createMockBadge(1, '评论达人', 'activity'),
  createMockBadge(2, '活跃用户', 'activity'),
  createMockBadge(3, '管理员', 'identity', 'manual'),
  createMockBadge(4, '荣誉会员', 'honor', 'manual'),
];

describe('BadgeGalleryPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should show loading state initially', () => {
    vi.mocked(badgeService.getAllBadges).mockImplementation(() => new Promise(() => {}));
    render(<BadgeGalleryPage />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('should render badge gallery after loading', async () => {
    vi.mocked(badgeService.getAllBadges).mockResolvedValue(mockBadges);
    render(<BadgeGalleryPage />);
    await waitFor(() => {
      expect(screen.getByText('徽章陈列馆')).toBeInTheDocument();
    });
    expect(screen.getByText('活跃徽章')).toBeInTheDocument();
    expect(screen.getByText('身份徽章')).toBeInTheDocument();
    expect(screen.getByText('荣誉徽章')).toBeInTheDocument();
  });

  it('should display activity badges by default', async () => {
    vi.mocked(badgeService.getAllBadges).mockResolvedValue(mockBadges);
    render(<BadgeGalleryPage />);
    await waitFor(() => {
      expect(screen.getByText('评论达人')).toBeInTheDocument();
      expect(screen.getByText('活跃用户')).toBeInTheDocument();
    });
  });

  it('should switch tabs', async () => {
    const user = userEvent.setup();
    vi.mocked(badgeService.getAllBadges).mockResolvedValue(mockBadges);
    render(<BadgeGalleryPage />);
    await waitFor(() => { expect(screen.getByText('徽章陈列馆')).toBeInTheDocument(); });
    await user.click(screen.getByText('身份徽章'));
    expect(screen.getAllByText('管理员').length).toBeGreaterThanOrEqual(1);
    await user.click(screen.getByText('荣誉徽章'));
    expect(screen.getAllByText('荣誉会员').length).toBeGreaterThanOrEqual(1);
  });

  it('should show empty state', async () => {
    const user = userEvent.setup();
    vi.mocked(badgeService.getAllBadges).mockResolvedValue([createMockBadge(1, '评论达人', 'activity')]);
    render(<BadgeGalleryPage />);
    await waitFor(() => { expect(screen.getByText('徽章陈列馆')).toBeInTheDocument(); });
    await user.click(screen.getByText('荣誉徽章'));
    expect(screen.getByText('暂无该类别的徽章')).toBeInTheDocument();
  });

  it('should show error on failure', async () => {
    vi.mocked(badgeService.getAllBadges).mockRejectedValue(new Error('err'));
    render(<BadgeGalleryPage />);
    await waitFor(() => {
      expect(screen.getByText('无法加载徽章数据')).toBeInTheDocument();
    });
  });
});
