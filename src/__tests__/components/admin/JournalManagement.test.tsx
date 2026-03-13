import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import JournalManagement from '@/features/admin/components/JournalManagement';

// Mock PageContext
vi.mock('@/contexts/PageContext', () => ({
  usePageTitle: vi.fn(),
}));

// Mock services
vi.mock('@/services/journalService', () => ({
  journalService: {
    getAllJournals: vi.fn(),
    getLevelOptions: vi.fn(),
  },
}));

vi.mock('@/services/adminService', () => ({
  adminService: {
    createJournal: vi.fn(),
    updateJournal: vi.fn(),
    deleteJournal: vi.fn(),
  },
}));

import { journalService } from '@/services/journalService';
import { adminService } from '@/services/adminService';

const mockJournals = [
  {
    journalId: 'journal-1',
    name: 'Nature',
    issn: '0028-0836',
    levels: ['SCI一区'],
    ratingCache: { journalId: 'journal-1', rating: 4.8, ratingCount: 120 },
    articleCount: 5000,
    introduction: 'Leading international journal of science.',
  },
  {
    journalId: 'journal-2',
    name: 'Science',
    issn: '0036-8075',
    levels: ['SCI一区'],
    ratingCache: { journalId: 'journal-2', rating: 4.7, ratingCount: 100 },
    articleCount: 4500,
    introduction: 'Premier global science weekly.',
  },
  {
    journalId: 'journal-3',
    name: 'PLOS ONE',
    issn: '1932-6203',
    levels: [],
    ratingCache: { journalId: 'journal-3', rating: 3.5, ratingCount: 50 },
    articleCount: 10000,
    introduction: 'Open access journal.',
  },
];

const mockLevelOptions = [
  { name: 'SCI一区', count: 10 },
  { name: 'SCI二区', count: 15 },
  { name: 'EI', count: 20 },
  { name: '核心期刊', count: 30 },
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <JournalManagement />
    </BrowserRouter>
  );
};

describe('JournalManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (journalService.getAllJournals as Mock).mockResolvedValue(mockJournals);
    (journalService.getLevelOptions as Mock).mockResolvedValue(mockLevelOptions);
  });

  it('renders loading state initially', () => {
    renderComponent();
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders journals table after loading', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Nature')).toBeInTheDocument();
    });

    expect(screen.getByText('Science')).toBeInTheDocument();
    expect(screen.getByText('PLOS ONE')).toBeInTheDocument();
  });

  it('displays journal information correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('0028-0836')).toBeInTheDocument();
    });

    expect(screen.getByText('0036-8075')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
  });

  it('displays add journal button', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /添加期刊/i })).toBeInTheDocument();
    });
  });

  it('displays search input and category filter', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索期刊名称或ISSN...')).toBeInTheDocument();
    });

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('handles search submission', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索期刊名称或ISSN...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('搜索期刊名称或ISSN...');
    const searchButton = screen.getByRole('button', { name: '搜索' });

    await user.type(searchInput, 'Nature');
    await user.click(searchButton);

    await waitFor(() => {
      expect(journalService.getAllJournals).toHaveBeenCalledWith('Nature', '');
    });
  });

  it('filters by level selection', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Nature')).toBeInTheDocument();
    });

    const levelSelect = screen.getByRole('combobox');
    await user.selectOptions(levelSelect, 'SCI一区');

    await waitFor(() => {
      expect(journalService.getAllJournals).toHaveBeenCalledWith('', 'SCI一区');
    });
  });

  it('opens add modal when add button clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /添加期刊/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /添加期刊/i }));

    await waitFor(() => {
      expect(screen.getByText('添加期刊')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText('请输入期刊名称')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入ISSN号')).toBeInTheDocument();
  });

  it('opens edit modal when edit button clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Nature')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: '编辑' });
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('编辑期刊')).toBeInTheDocument();
    });

    // Check that form is pre-filled
    const nameInput = screen.getByPlaceholderText('请输入期刊名称') as HTMLInputElement;
    expect(nameInput.value).toBe('Nature');
  });

  it('validates required fields on form submission', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /添加期刊/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /添加期刊/i }));

    await waitFor(() => {
      expect(screen.getByText('添加期刊')).toBeInTheDocument();
    });

    // Try to submit empty form - find the submit button inside modal
    const submitButtons = screen.getAllByRole('button', { name: '添加' });
    const modalSubmit = submitButtons.find(btn => btn.classList.contains('submit-button'));
    if (modalSubmit) {
      await user.click(modalSubmit);
    }

    await waitFor(() => {
      expect(screen.getByText('期刊名称和ISSN是必填项')).toBeInTheDocument();
    });
  });

  it('creates journal successfully', async () => {
    const user = userEvent.setup();
    (adminService.createJournal as Mock).mockResolvedValue({
      journalId: 'new-journal',
      name: 'New Journal',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /添加期刊/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /添加期刊/i }));

    await waitFor(() => {
      expect(screen.getByText('添加期刊')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('请输入期刊名称'), 'New Journal');
    await user.type(screen.getByPlaceholderText('请输入ISSN号'), '1234-5678');

    // Find and click the submit button in modal
    const submitButtons = screen.getAllByRole('button', { name: '添加' });
    const modalSubmit = submitButtons.find(btn => btn.classList.contains('submit-button'));
    if (modalSubmit) {
      await user.click(modalSubmit);
    }

    await waitFor(() => {
      expect(adminService.createJournal).toHaveBeenCalled();
    });
  });

  it('updates journal successfully', async () => {
    const user = userEvent.setup();
    (adminService.updateJournal as Mock).mockResolvedValue({
      journalId: 'journal-1',
      name: 'Updated Nature',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Nature')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: '编辑' });
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('编辑期刊')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('请输入期刊名称') as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Nature');

    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(adminService.updateJournal).toHaveBeenCalledWith('journal-1', expect.any(Object));
    });
  });

  it('deletes journal with confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    (adminService.deleteJournal as Mock).mockResolvedValue(undefined);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Nature')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: '删除' });
    await user.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('Nature'));
    expect(adminService.deleteJournal).toHaveBeenCalledWith('journal-1');

    confirmSpy.mockRestore();
  });

  it('does not delete when user cancels', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Nature')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: '删除' });
    await user.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(adminService.deleteJournal).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('closes modal when cancel button clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /添加期刊/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /添加期刊/i }));

    await waitFor(() => {
      expect(screen.getByText('添加期刊')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '取消' }));

    await waitFor(() => {
      expect(screen.queryByText('添加期刊')).not.toBeInTheDocument();
    });
  });

  it('closes modal when X button clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /添加期刊/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /添加期刊/i }));

    await waitFor(() => {
      expect(screen.getByText('添加期刊')).toBeInTheDocument();
    });

    const closeButton = document.querySelector('.modal-close');
    if (closeButton) {
      await user.click(closeButton);
    }

    await waitFor(() => {
      expect(screen.queryByText('添加期刊')).not.toBeInTheDocument();
    });
  });

  it('closes modal when clicking overlay', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /添加期刊/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /添加期刊/i }));

    await waitFor(() => {
      expect(screen.getByText('添加期刊')).toBeInTheDocument();
    });

    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      await user.click(overlay);
    }

    await waitFor(() => {
      expect(screen.queryByText('添加期刊')).not.toBeInTheDocument();
    });
  });

  it('displays empty message when no journals', async () => {
    (journalService.getAllJournals as Mock).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('暂无期刊数据')).toBeInTheDocument();
    });
  });

  it('displays error on fetch failure', async () => {
    (journalService.getAllJournals as Mock).mockRejectedValue(new Error('获取期刊列表失败'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('获取期刊列表失败')).toBeInTheDocument();
    });
  });

  it('displays error on delete failure', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    (adminService.deleteJournal as Mock).mockRejectedValue(new Error('删除期刊失败'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Nature')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: '删除' });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('删除期刊失败')).toBeInTheDocument();
    });
  });

  it('displays form error on create failure', async () => {
    const user = userEvent.setup();
    (adminService.createJournal as Mock).mockRejectedValue(new Error('创建期刊失败'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /添加期刊/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /添加期刊/i }));

    await waitFor(() => {
      expect(screen.getByText('添加期刊')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('请输入期刊名称'), 'New Journal');
    await user.type(screen.getByPlaceholderText('请输入ISSN号'), '1234-5678');

    const submitButtons = screen.getAllByRole('button', { name: '添加' });
    const modalSubmit = submitButtons.find(btn => btn.classList.contains('submit-button'));
    if (modalSubmit) {
      await user.click(modalSubmit);
    }

    await waitFor(() => {
      expect(screen.getByText('创建期刊失败')).toBeInTheDocument();
    });
  });

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup();
    // Make the promise hang
    (adminService.createJournal as Mock).mockImplementation(() => new Promise(() => {}));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /添加期刊/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /添加期刊/i }));

    await waitFor(() => {
      expect(screen.getByText('添加期刊')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('请输入期刊名称'), 'New Journal');
    await user.type(screen.getByPlaceholderText('请输入ISSN号'), '1234-5678');

    const submitButtons = screen.getAllByRole('button', { name: '添加' });
    const modalSubmit = submitButtons.find(btn => btn.classList.contains('submit-button'));
    if (modalSubmit) {
      await user.click(modalSubmit);
    }

    await waitFor(() => {
      expect(screen.getByText('提交中...')).toBeInTheDocument();
    });
  });

  it('displays level as "未定级" when no levels', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('PLOS ONE')).toBeInTheDocument();
    });

    expect(screen.getByText('未定级')).toBeInTheDocument();
  });

  it('populates level dropdown options from API', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Nature')).toBeInTheDocument();
    });

    const levelSelect = screen.getByRole('combobox');
    const options = levelSelect.querySelectorAll('option');

    // Should have default "全部等级" + 4 level options
    expect(options.length).toBe(5);
    expect(Array.from(options).map(o => o.textContent)).toContain('SCI一区');
    expect(Array.from(options).map(o => o.textContent)).toContain('SCI二区');
    expect(Array.from(options).map(o => o.textContent)).toContain('EI');
    expect(Array.from(options).map(o => o.textContent)).toContain('核心期刊');
  });

  it('displays introduction textarea in form', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /添加期刊/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /添加期刊/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('请输入期刊介绍')).toBeInTheDocument();
    });

    const introTextarea = screen.getByPlaceholderText('请输入期刊介绍');
    expect(introTextarea.tagName.toLowerCase()).toBe('textarea');
  });
});
