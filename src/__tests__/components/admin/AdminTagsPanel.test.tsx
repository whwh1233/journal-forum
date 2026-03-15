import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminTagsPanel from '@/features/admin/components/AdminTagsPanel';
import { tagService } from '@/services/tagService';

// Mock tagService
vi.mock('@/services/tagService', () => ({
  tagService: {
    adminGetTags: vi.fn(),
    adminCreateTag: vi.fn(),
    adminUpdateTag: vi.fn(),
    adminDeleteTag: vi.fn(),
    adminApproveTag: vi.fn(),
    adminRejectTag: vi.fn(),
    adminBatchApprove: vi.fn(),
    adminBatchReject: vi.fn(),
    adminMergeTags: vi.fn(),
  },
}));

// Mock PageContext
vi.mock('@/contexts/PageContext', () => ({
  usePageTitle: vi.fn(),
}));

// Mock TagMergeModal
vi.mock('@/features/admin/components/TagMergeModal', () => ({
  default: ({ sourceTag, onClose, onMerged }: any) =>
    sourceTag ? (
      <div data-testid="merge-modal">
        <span>合并标签: {sourceTag.name}</span>
        <button onClick={onClose}>取消</button>
        <button onClick={onMerged}>确认合并</button>
      </div>
    ) : null,
}));

// Mock CSS import
vi.mock('@/features/admin/components/AdminTagsPanel.css', () => ({}));

const mockTags = [
  { id: 1, name: 'SCI', isOfficial: true, status: 'approved' as const, postCount: 50, createdBy: 'admin' },
  { id: 2, name: 'Nature', isOfficial: false, status: 'approved' as const, postCount: 30, createdBy: 'user1' },
  { id: 3, name: 'myTag', isOfficial: false, status: 'pending' as const, postCount: 0, createdBy: 'user2' },
];

const mockPendingTags = [
  { id: 10, name: 'pendingA', isOfficial: false, status: 'pending' as const, postCount: 0, createdBy: 'user1' },
  { id: 11, name: 'pendingB', isOfficial: false, status: 'pending' as const, postCount: 1, createdBy: 'user2' },
];

function setupDefaultMocks() {
  (tagService.adminGetTags as any).mockImplementation(async (params: any) => {
    if (params?.status === 'pending') {
      return { tags: mockPendingTags, pagination: { page: 1, totalPages: 1, total: mockPendingTags.length } };
    }
    return { tags: mockTags, pagination: { page: 1, totalPages: 1, total: mockTags.length } };
  });
  (tagService.adminCreateTag as any).mockResolvedValue({ tag: { id: 100, name: 'NewTag' } });
  (tagService.adminUpdateTag as any).mockResolvedValue({ tag: { id: 1, name: 'UpdatedTag' } });
  (tagService.adminDeleteTag as any).mockResolvedValue(undefined);
  (tagService.adminBatchApprove as any).mockResolvedValue(undefined);
  (tagService.adminBatchReject as any).mockResolvedValue(undefined);
}

async function renderAndWait() {
  render(<AdminTagsPanel />);
  await waitFor(() => {
    expect(screen.getByText('SCI')).toBeInTheDocument();
  });
}

describe('AdminTagsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  describe('Rendering', () => {
    it('should render tag list', async () => {
      await renderAndWait();

      expect(screen.getByText('SCI')).toBeInTheDocument();
      expect(screen.getByText('Nature')).toBeInTheDocument();
      expect(screen.getByText('myTag')).toBeInTheDocument();
    });

    it('should show pending/approved status badges', async () => {
      await renderAndWait();

      const approvedBadges = screen.getAllByText('已审核');
      const pendingBadges = screen.getAllByText('待审核');
      expect(approvedBadges.length).toBeGreaterThan(0);
      expect(pendingBadges.length).toBeGreaterThan(0);
    });

    it('should show official tag badge', async () => {
      await renderAndWait();

      expect(screen.getByText('官方')).toBeInTheDocument();
    });

    it('should display pending tags section when pending tags exist', async () => {
      await renderAndWait();

      expect(screen.getByText(/待审核标签/)).toBeInTheDocument();
      expect(screen.getByText('pendingA')).toBeInTheDocument();
      expect(screen.getByText('pendingB')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter by status', async () => {
      const user = userEvent.setup();
      await renderAndWait();

      const statusSelect = screen.getByDisplayValue('全部状态');
      await user.selectOptions(statusSelect, 'approved');

      await waitFor(() => {
        expect(tagService.adminGetTags).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'approved' })
        );
      });
    });

    it('should filter by official/user type', async () => {
      const user = userEvent.setup();
      await renderAndWait();

      const typeSelect = screen.getByDisplayValue('全部类型');
      await user.selectOptions(typeSelect, 'true');

      await waitFor(() => {
        expect(tagService.adminGetTags).toHaveBeenCalledWith(
          expect.objectContaining({ isOfficial: 'true' })
        );
      });
    });

    it('should search tags by name', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<AdminTagsPanel />);
      await vi.advanceTimersByTimeAsync(100);

      const searchInput = screen.getByPlaceholderText('搜索标签...');
      await user.type(searchInput, 'SCI');

      // Advance past the 400ms debounce
      await vi.advanceTimersByTimeAsync(500);

      await waitFor(() => {
        expect(tagService.adminGetTags).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'SCI' })
        );
      });

      vi.useRealTimers();
    });
  });

  describe('Actions', () => {
    it('should start inline editing on edit button click', async () => {
      const user = userEvent.setup();
      await renderAndWait();

      const editButtons = screen.getAllByTitle('编辑');
      await user.click(editButtons[0]);

      const editInput = screen.getByDisplayValue('SCI');
      expect(editInput).toBeInTheDocument();
      expect(editInput.tagName).toBe('INPUT');
    });

    it('should save edit on Enter key', async () => {
      const user = userEvent.setup();
      await renderAndWait();

      const editButtons = screen.getAllByTitle('编辑');
      await user.click(editButtons[0]);

      const editInput = screen.getByDisplayValue('SCI');
      await user.clear(editInput);
      await user.type(editInput, 'SCI-Updated{Enter}');

      await waitFor(() => {
        expect(tagService.adminUpdateTag).toHaveBeenCalledWith(1, 'SCI-Updated');
      });
    });

    it('should cancel edit on Escape key', async () => {
      const user = userEvent.setup();
      await renderAndWait();

      const editButtons = screen.getAllByTitle('编辑');
      await user.click(editButtons[0]);

      expect(screen.getByDisplayValue('SCI')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      // Should be back to display mode - the inline input should be gone
      await waitFor(() => {
        expect(screen.queryByDisplayValue('SCI')).not.toBeInTheDocument();
      });
      // Tag name should still be visible as text
      expect(screen.getByText('SCI')).toBeInTheDocument();
    });

    it('should show delete confirmation modal', async () => {
      const user = userEvent.setup();
      await renderAndWait();

      const deleteButtons = screen.getAllByTitle('删除');
      await user.click(deleteButtons[0]);

      expect(screen.getByRole('heading', { name: '确认删除' })).toBeInTheDocument();
      expect(screen.getByText(/确定要删除标签 "SCI" 吗/)).toBeInTheDocument();
      expect(screen.getByText(/50 篇帖子/)).toBeInTheDocument();
    });

    it('should delete tag on confirm', async () => {
      const user = userEvent.setup();
      await renderAndWait();

      const deleteButtons = screen.getAllByTitle('删除');
      await user.click(deleteButtons[0]);

      const confirmBtn = screen.getByRole('button', { name: '确认删除' });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(tagService.adminDeleteTag).toHaveBeenCalledWith(1);
      });
    });

    it('should open create modal', async () => {
      const user = userEvent.setup();
      await renderAndWait();

      await user.click(screen.getByText('创建官方标签'));

      expect(screen.getByPlaceholderText('请输入标签名称')).toBeInTheDocument();
    });

    it('should create official tag', async () => {
      const user = userEvent.setup();
      await renderAndWait();

      await user.click(screen.getByText('创建官方标签'));

      const nameInput = screen.getByPlaceholderText('请输入标签名称');
      await user.type(nameInput, 'NewOfficialTag');

      await user.click(screen.getByRole('button', { name: '创建' }));

      await waitFor(() => {
        expect(tagService.adminCreateTag).toHaveBeenCalledWith('NewOfficialTag');
      });
    });
  });

  describe('Batch Operations', () => {
    it('should select individual pending tags', async () => {
      const user = userEvent.setup();
      await renderAndWait();

      const pendingSection = screen.getByText(/待审核标签/).closest('.tag-mgmt__pending-section')!;
      const checkboxes = within(pendingSection).getAllByRole('checkbox');
      // First checkbox is select-all, rest are individual
      const firstTagCheckbox = checkboxes[1];

      await user.click(firstTagCheckbox);

      expect(firstTagCheckbox).toBeChecked();
    });

    it('should toggle select all', async () => {
      const user = userEvent.setup();
      await renderAndWait();

      const pendingSection = screen.getByText(/待审核标签/).closest('.tag-mgmt__pending-section')!;
      const checkboxes = within(pendingSection).getAllByRole('checkbox');
      const selectAllCheckbox = checkboxes[0];

      // Select all
      await user.click(selectAllCheckbox);
      const individualCheckboxes = checkboxes.slice(1);
      individualCheckboxes.forEach(cb => expect(cb).toBeChecked());

      // Deselect all
      await user.click(selectAllCheckbox);
      individualCheckboxes.forEach(cb => expect(cb).not.toBeChecked());
    });

    it('should batch approve selected pending tags', async () => {
      const user = userEvent.setup();
      await renderAndWait();

      const pendingSection = screen.getByText(/待审核标签/).closest('.tag-mgmt__pending-section')!;
      const checkboxes = within(pendingSection).getAllByRole('checkbox');
      const selectAllCheckbox = checkboxes[0];

      await user.click(selectAllCheckbox);

      const approveBtn = screen.getByText(/批量通过/);
      await user.click(approveBtn);

      await waitFor(() => {
        expect(tagService.adminBatchApprove).toHaveBeenCalledWith(
          expect.arrayContaining([10, 11])
        );
      });
    });

    it('should batch reject selected pending tags', async () => {
      const user = userEvent.setup();
      await renderAndWait();

      const pendingSection = screen.getByText(/待审核标签/).closest('.tag-mgmt__pending-section')!;
      const checkboxes = within(pendingSection).getAllByRole('checkbox');
      const selectAllCheckbox = checkboxes[0];

      await user.click(selectAllCheckbox);

      const rejectBtn = screen.getByText(/批量拒绝/);
      await user.click(rejectBtn);

      await waitFor(() => {
        expect(tagService.adminBatchReject).toHaveBeenCalledWith(
          expect.arrayContaining([10, 11])
        );
      });
    });
  });

  describe('States', () => {
    it('should show loading spinner while loading', async () => {
      // Mock that never resolves
      (tagService.adminGetTags as any).mockImplementation(
        () => new Promise(() => {})
      );

      render(<AdminTagsPanel />);

      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('should show error message on fetch failure', async () => {
      (tagService.adminGetTags as any).mockImplementation(async (params: any) => {
        if (params?.status === 'pending') {
          return { tags: [], pagination: { page: 1, totalPages: 1, total: 0 } };
        }
        throw new Error('网络错误');
      });

      render(<AdminTagsPanel />);

      await waitFor(() => {
        expect(screen.getByText('网络错误')).toBeInTheDocument();
      });
    });

    it('should show empty state when no tags', async () => {
      (tagService.adminGetTags as any).mockResolvedValue({
        tags: [],
        pagination: { page: 1, totalPages: 1, total: 0 },
      });

      render(<AdminTagsPanel />);

      await waitFor(() => {
        expect(screen.getByText('暂无标签')).toBeInTheDocument();
      });
    });
  });

  describe('Merge', () => {
    it('should open merge modal on merge button click', async () => {
      const user = userEvent.setup();
      await renderAndWait();

      const mergeButtons = screen.getAllByTitle('合并');
      await user.click(mergeButtons[0]);

      const modal = screen.getByTestId('merge-modal');
      expect(modal).toBeInTheDocument();
      expect(screen.getByText('合并标签: SCI')).toBeInTheDocument();
    });

    it('should close merge modal', async () => {
      const user = userEvent.setup();
      await renderAndWait();

      const mergeButtons = screen.getAllByTitle('合并');
      await user.click(mergeButtons[0]);

      expect(screen.getByTestId('merge-modal')).toBeInTheDocument();

      // Click the cancel button inside the mock modal
      await user.click(screen.getByRole('button', { name: '取消' }));

      await waitFor(() => {
        expect(screen.queryByTestId('merge-modal')).not.toBeInTheDocument();
      });
    });

    it('should handle merge completion', async () => {
      const user = userEvent.setup();
      await renderAndWait();

      vi.clearAllMocks();
      setupDefaultMocks();

      const mergeButtons = screen.getAllByTitle('合并');
      await user.click(mergeButtons[0]);

      await user.click(screen.getByRole('button', { name: '确认合并' }));

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByTestId('merge-modal')).not.toBeInTheDocument();
      });

      // Success message should appear
      expect(screen.getByText('标签合并成功')).toBeInTheDocument();

      // Should refetch tags
      expect(tagService.adminGetTags).toHaveBeenCalled();
    });
  });
});
