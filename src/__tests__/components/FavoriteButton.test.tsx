import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../helpers/testUtils';
import userEvent from '@testing-library/user-event';
import FavoriteButton from '../../features/favorite/components/FavoriteButton';
import * as favoriteService from '../../services/favoriteService';
import * as authHook from '../../hooks/useAuth';

vi.mock('../../services/favoriteService');
vi.mock('../../hooks/useAuth');

describe('FavoriteButton', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.alert = vi.fn();
  });
  describe('Rendering', () => {
    it('should not render when user is not logged in', () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loading: false,
      });
      const { container } = render(<FavoriteButton journalId="1" />);
      expect(container.firstChild).toBeNull();
    });

    it('should render favorite button when user is logged in', async () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loading: false,
      });
      vi.mocked(favoriteService.checkFavorite).mockResolvedValue(false);
      render(<FavoriteButton journalId="1" />);
      await waitFor(() => {
        expect(screen.getByText('收藏')).toBeInTheDocument();
      });
    });

    it('should render with favorited state when already favorited', async () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loading: false,
      });
      vi.mocked(favoriteService.checkFavorite).mockResolvedValue(true);
      render(<FavoriteButton journalId="1" />);
      await waitFor(() => {
        expect(screen.getByText('已收藏')).toBeInTheDocument();
      });
    });

    it('should not show text when showText is false', async () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loading: false,
      });
      vi.mocked(favoriteService.checkFavorite).mockResolvedValue(false);
      const { container } = render(<FavoriteButton journalId="1" showText={false} />);
      await waitFor(() => {
        expect(container.querySelector('.icon-only')).toBeInTheDocument();
      });
      expect(screen.queryByText('收藏')).not.toBeInTheDocument();
    });
  });
  describe('Favorite Actions', () => {
    it('should call addFavorite when clicking unfavorited button', async () => {
      const user = userEvent.setup();
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loading: false,
      });
      vi.mocked(favoriteService.checkFavorite).mockResolvedValue(false);
      const addFavoriteSpy = vi.mocked(favoriteService.addFavorite).mockResolvedValue();
      render(<FavoriteButton journalId="1" />);
      const button = await screen.findByText('收藏');
      await user.click(button);
      await waitFor(() => {
        expect(addFavoriteSpy).toHaveBeenCalledWith('1');
        expect(screen.getByText('已收藏')).toBeInTheDocument();
      });
    });

    it('should call removeFavorite when clicking favorited button', async () => {
      const user = userEvent.setup();
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loading: false,
      });
      vi.mocked(favoriteService.checkFavorite).mockResolvedValue(true);
      const removeFavoriteSpy = vi.mocked(favoriteService.removeFavorite).mockResolvedValue();
      render(<FavoriteButton journalId="1" />);
      const button = await screen.findByText('已收藏');
      await user.click(button);
      await waitFor(() => {
        expect(removeFavoriteSpy).toHaveBeenCalledWith('1');
        expect(screen.getByText('收藏')).toBeInTheDocument();
      });
    });

    it('should disable button while loading', async () => {
      const user = userEvent.setup();
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loading: false,
      });
      vi.mocked(favoriteService.checkFavorite).mockResolvedValue(false);
      vi.mocked(favoriteService.addFavorite).mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      render(<FavoriteButton journalId="1" />);
      const button = await screen.findByTitle('收藏');
      await user.click(button);
      expect(button).toBeDisabled();
    });
  });
  describe('Error Handling', () => {
    it('should show error alert when favorite action fails', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(global, 'alert');
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loading: false,
      });
      vi.mocked(favoriteService.checkFavorite).mockResolvedValue(false);
      vi.mocked(favoriteService.addFavorite).mockRejectedValue({
        response: { data: { message: '收藏失败' } },
      });
      render(<FavoriteButton journalId="1" />);
      const button = await screen.findByText('收藏');
      await user.click(button);
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('收藏失败');
      });
      expect(screen.getByText('收藏')).toBeInTheDocument();
    });

    it('should show generic error when no error message provided', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(global, 'alert');
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loading: false,
      });
      vi.mocked(favoriteService.checkFavorite).mockResolvedValue(false);
      vi.mocked(favoriteService.addFavorite).mockRejectedValue(new Error());
      render(<FavoriteButton journalId="1" />);
      const button = await screen.findByText('收藏');
      await user.click(button);
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('操作失败');
      });
    });
  });
  describe('Favorite Status Check', () => {
    it('should check favorite status on mount', async () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loading: false,
      });
      const checkFavoriteSpy = vi.mocked(favoriteService.checkFavorite).mockResolvedValue(false);
      render(<FavoriteButton journalId="journal-123" />);
      await waitFor(() => {
        expect(checkFavoriteSpy).toHaveBeenCalledWith('journal-123');
      });
    });
  });
});
