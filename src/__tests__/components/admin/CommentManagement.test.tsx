import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CommentManagement from '@/features/admin/components/CommentManagement';

// Mock PageContext
vi.mock('@/contexts/PageContext', () => ({
  usePageTitle: vi.fn(),
}));

// Mock admin service
vi.mock('@/services/adminService', () => ({
  adminService: {
    getComments: vi.fn(),
    deleteComment: vi.fn(),
  },
}));

import { adminService } from '@/services/adminService';

const mockComments = [
  {
    id: 'comment-1',
    journalId: 'journal-1',
    journalName: 'Nature',
    author: 'John Doe',
    rating: 5,
    content: 'Great journal for publishing research.',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'comment-2',
    journalId: 'journal-2',
    journalName: 'Science',
    author: 'Jane Smith',
    rating: 4,
    content: 'Good editorial process but slow review.',
    createdAt: '2024-01-16T14:20:00Z',
  },
];

const mockPagination = {
  currentPage: 1,
  totalPages: 2,
  totalItems: 15,
  itemsPerPage: 10,
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <CommentManagement />
    </BrowserRouter>
  );
};

describe('CommentManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (adminService.getComments as Mock).mockResolvedValue({
      comments: mockComments,
      pagination: mockPagination,
    });
  });

  it('renders loading state initially', () => {
    renderComponent();
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders comments after loading', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Great journal for publishing research.')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('displays journal names correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Nature')).toBeInTheDocument();
    });

    expect(screen.getByText('Science')).toBeInTheDocument();
  });

  it('displays search input and button', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索评论内容、作者或期刊...')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: '搜索' })).toBeInTheDocument();
  });

  it('handles search submission', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索评论内容、作者或期刊...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('搜索评论内容、作者或期刊...');
    const searchButton = screen.getByRole('button', { name: '搜索' });

    await user.type(searchInput, 'Nature');
    await user.click(searchButton);

    await waitFor(() => {
      expect(adminService.getComments).toHaveBeenCalledWith('Nature', 1);
    });
  });

  it('displays rating with star icon', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('handles comment deletion with confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    (adminService.deleteComment as Mock).mockResolvedValue(undefined);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: '删除评论' });
    await user.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalledWith('确定要删除这条评论吗？');
    expect(adminService.deleteComment).toHaveBeenCalledWith('comment-1');

    confirmSpy.mockRestore();
  });

  it('does not delete when user cancels confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: '删除评论' });
    await user.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(adminService.deleteComment).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('displays error message on delete failure', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    (adminService.deleteComment as Mock).mockRejectedValue(new Error('删除评论失败'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: '删除评论' });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('删除评论失败')).toBeInTheDocument();
    });
  });

  it('displays pagination controls when multiple pages', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('第 1 / 2 页')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: '上一页' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一页' })).toBeInTheDocument();
  });

  it('disables previous button on first page', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('第 1 / 2 页')).toBeInTheDocument();
    });

    const prevButton = screen.getByRole('button', { name: '上一页' });
    expect(prevButton).toBeDisabled();
  });

  it('handles page navigation', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('第 1 / 2 页')).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: '下一页' });
    await user.click(nextButton);

    await waitFor(() => {
      expect(adminService.getComments).toHaveBeenCalledWith('', 2);
    });
  });

  it('displays empty message when no comments', async () => {
    (adminService.getComments as Mock).mockResolvedValue({
      comments: [],
      pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('暂无评论数据')).toBeInTheDocument();
    });
  });

  it('does not show pagination when only one page', async () => {
    (adminService.getComments as Mock).mockResolvedValue({
      comments: mockComments,
      pagination: { currentPage: 1, totalPages: 1, totalItems: 2, itemsPerPage: 10 },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.queryByText(/第 \d+ \/ \d+ 页/)).not.toBeInTheDocument();
  });

  it('displays error message on fetch failure', async () => {
    (adminService.getComments as Mock).mockRejectedValue(new Error('获取评论列表失败'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('获取评论列表失败')).toBeInTheDocument();
    });
  });

  it('truncates long journal names', async () => {
    const longNameComment = {
      ...mockComments[0],
      journalName: 'This is a very long journal name that should be truncated',
    };

    (adminService.getComments as Mock).mockResolvedValue({
      comments: [longNameComment],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 10 },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('This is a very long journal na...')).toBeInTheDocument();
    });
  });

  it('formats date correctly in Chinese locale', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check that the date is formatted (the exact format depends on locale)
    // 2024-01-15T10:30:00Z should show as 2024/01/15 10:30 or similar
    const dateElements = screen.getAllByText(/2024/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('resets to page 1 when searching', async () => {
    const user = userEvent.setup();

    // Start on page 2
    (adminService.getComments as Mock).mockResolvedValue({
      comments: mockComments,
      pagination: { currentPage: 2, totalPages: 3, totalItems: 25, itemsPerPage: 10 },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Reset mock to check search call
    (adminService.getComments as Mock).mockClear();
    (adminService.getComments as Mock).mockResolvedValue({
      comments: mockComments,
      pagination: mockPagination,
    });

    const searchInput = screen.getByPlaceholderText('搜索评论内容、作者或期刊...');
    const searchButton = screen.getByRole('button', { name: '搜索' });

    await user.type(searchInput, 'test');
    await user.click(searchButton);

    await waitFor(() => {
      expect(adminService.getComments).toHaveBeenCalledWith('test', 1);
    });
  });
});
