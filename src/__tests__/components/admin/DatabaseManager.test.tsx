import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import DatabaseManager from '@/features/admin/components/DatabaseManager';

// Mock PageContext
vi.mock('@/contexts/PageContext', () => ({
  usePageTitle: vi.fn(),
}));

// Mock database service
vi.mock('@/services/databaseService', () => ({
  databaseService: {
    getTables: vi.fn(),
    getTableStructure: vi.fn(),
    getTableData: vi.fn(),
    getAuditLogs: vi.fn(),
    updateRow: vi.fn(),
    deleteRow: vi.fn(),
  },
}));

import { databaseService } from '@/services/databaseService';

const mockTables = [
  {
    tableName: 'users',
    rowCount: 150,
    dataLength: 65536,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
    comment: 'User accounts table',
  },
  {
    tableName: 'journals',
    rowCount: 45,
    dataLength: 32768,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-14',
    comment: 'Academic journals',
  },
];

const mockStructure = {
  columns: [
    { columnName: 'id', columnType: 'int', isNullable: 'NO', columnKey: 'PRI', defaultValue: null, extra: 'auto_increment', comment: 'Primary key' },
    { columnName: 'email', columnType: 'varchar(255)', isNullable: 'NO', columnKey: 'UNI', defaultValue: null, extra: '', comment: 'User email' },
    { columnName: 'name', columnType: 'varchar(100)', isNullable: 'YES', columnKey: '', defaultValue: null, extra: '', comment: 'Display name' },
  ],
  indexes: [
    { Table: 'users', Key_name: 'PRIMARY', Column_name: 'id', Non_unique: 0, Index_type: 'BTREE' },
    { Table: 'users', Key_name: 'email_unique', Column_name: 'email', Non_unique: 0, Index_type: 'BTREE' },
  ],
};

const mockTableData = {
  rows: [
    { id: 1, email: 'user1@test.com', name: 'User One' },
    { id: 2, email: 'user2@test.com', name: 'User Two' },
  ],
  total: 2,
  page: 1,
  pageSize: 20,
  primaryKey: 'id',
};

const mockAuditLogs = {
  logs: [
    {
      id: 1,
      tableName: 'users',
      operation: 'UPDATE',
      rowId: '1',
      oldData: { name: 'Old Name' },
      newData: { name: 'New Name' },
      operatorId: '1',
      operatorEmail: 'admin@test.com',
      ipAddress: '127.0.0.1',
      createdAt: '2024-01-15T10:30:00Z',
    },
  ],
  total: 1,
  page: 1,
  pageSize: 50,
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <DatabaseManager />
    </BrowserRouter>
  );
};

describe('DatabaseManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (databaseService.getTables as Mock).mockResolvedValue(mockTables);
    (databaseService.getTableStructure as Mock).mockResolvedValue(mockStructure);
    (databaseService.getTableData as Mock).mockResolvedValue(mockTableData);
    (databaseService.getAuditLogs as Mock).mockResolvedValue(mockAuditLogs);
  });

  it('renders loading state initially', () => {
    renderComponent();
    expect(screen.getByText('正在连接数据库...')).toBeInTheDocument();
  });

  it('renders tables list after loading', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    expect(screen.getByText('journals')).toBeInTheDocument();
  });

  it('displays table card information correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    // Check row counts
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();

    // Check table comments
    expect(screen.getByText('User accounts table')).toBeInTheDocument();
    expect(screen.getByText('Academic journals')).toBeInTheDocument();
  });

  it('navigates to table data view when table card clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    const usersCard = screen.getByText('users').closest('.db-table-card');
    if (usersCard) {
      await user.click(usersCard);
    }

    await waitFor(() => {
      expect(databaseService.getTableData).toHaveBeenCalledWith('users', expect.any(Object));
    });
  });

  it('displays table data with rows', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    const usersCard = screen.getByText('users').closest('.db-table-card');
    if (usersCard) {
      await user.click(usersCard);
    }

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    expect(screen.getByText('user2@test.com')).toBeInTheDocument();
    expect(screen.getByText('User One')).toBeInTheDocument();
    expect(screen.getByText('User Two')).toBeInTheDocument();
  });

  it('shows structure view when clicking structure tab', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    // Click table to open it
    const usersCard = screen.getByText('users').closest('.db-table-card');
    if (usersCard) {
      await user.click(usersCard);
    }

    await waitFor(() => {
      expect(screen.getByText('数据')).toBeInTheDocument();
    });

    // Click structure tab
    await user.click(screen.getByText('结构'));

    await waitFor(() => {
      expect(screen.getByText('字段结构')).toBeInTheDocument();
    });
  });

  it('displays column structure information', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    const usersCard = screen.getByText('users').closest('.db-table-card');
    if (usersCard) {
      await user.click(usersCard);
    }

    await waitFor(() => {
      expect(screen.getByText('数据')).toBeInTheDocument();
    });

    await user.click(screen.getByText('结构'));

    await waitFor(() => {
      expect(screen.getAllByText('email').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText('varchar(255)')).toBeInTheDocument();
    expect(screen.getByText('User email')).toBeInTheDocument();
  });

  it('displays audit logs when clicking logs button', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    await user.click(screen.getByText('操作日志'));

    await waitFor(() => {
      expect(databaseService.getAuditLogs).toHaveBeenCalled();
    });
  });

  it('handles row editing', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    const usersCard = screen.getByText('users').closest('.db-table-card');
    if (usersCard) {
      await user.click(usersCard);
    }

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    // Click edit button on first row
    const editButtons = screen.getAllByTitle('编辑');
    await user.click(editButtons[0]);

    // Should show input fields in edit mode
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  it('handles row deletion with confirmation', async () => {
    const user = userEvent.setup();
    (databaseService.deleteRow as Mock).mockResolvedValue(undefined);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    const usersCard = screen.getByText('users').closest('.db-table-card');
    if (usersCard) {
      await user.click(usersCard);
    }

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButtons = screen.getAllByTitle('删除');
    await user.click(deleteButtons[0]);

    // Confirmation modal should appear
    await waitFor(() => {
      expect(screen.getAllByText('确认删除').length).toBeGreaterThanOrEqual(1);
    });

    // Click confirm button
    var cdb=screen.getAllByText('确认删除');await user.click(cdb[cdb.length-1]);

    await waitFor(() => {
      expect(databaseService.deleteRow).toHaveBeenCalledWith('users', '1', 'id');
    });
  });

  it('cancels deletion when cancel clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    const usersCard = screen.getByText('users').closest('.db-table-card');
    if (usersCard) {
      await user.click(usersCard);
    }

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('删除');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText('确认删除').length).toBeGreaterThanOrEqual(1);
    });

    // Click cancel
    await user.click(screen.getByText('取消'));

    expect(databaseService.deleteRow).not.toHaveBeenCalled();
  });

  it('handles search functionality', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    const usersCard = screen.getByText('users').closest('.db-table-card');
    if (usersCard) {
      await user.click(usersCard);
    }

    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索...')).toBeInTheDocument();
    });

    // Select search field
    const fieldSelect = screen.getAllByRole('combobox')[0];
    await user.selectOptions(fieldSelect, 'email');

    // Enter search value
    const searchInput = screen.getByPlaceholderText('搜索...');
    await user.type(searchInput, 'user1');

    // Click search
    await user.click(screen.getByRole('button', { name: /搜索/i }));

    await waitFor(() => {
      expect(databaseService.getTableData).toHaveBeenCalledWith('users', expect.objectContaining({
        search: 'user1',
        searchField: 'email',
      }));
    });
  });

  it('handles page size change', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    const usersCard = screen.getByText('users').closest('.db-table-card');
    if (usersCard) {
      await user.click(usersCard);
    }

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    // Find page size select
    const selects = screen.getAllByRole('combobox');
    const pageSizeSelect = selects[selects.length - 1];
    await user.selectOptions(pageSizeSelect, '50');

    await waitFor(() => {
      expect(databaseService.getTableData).toHaveBeenCalledWith('users', expect.objectContaining({
        pageSize: 50,
      }));
    });
  });

  it('handles sorting by column', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    const usersCard = screen.getByText('users').closest('.db-table-card');
    if (usersCard) {
      await user.click(usersCard);
    }

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    // Click on column header to sort
    (databaseService.getTableData as Mock).mockClear();

    const emailHeader = screen.getAllByText('email')[0].closest('th') || screen.getAllByText('email')[0];
    await user.click(emailHeader);

    await waitFor(() => {
      expect(databaseService.getTableData).toHaveBeenCalledWith('users', expect.objectContaining({
        sortField: 'email',
        sortOrder: 'ASC',
      }));
    });
  });

  it('displays error on fetch failure', async () => {
    (databaseService.getTables as Mock).mockRejectedValue({
      response: { data: { message: '获取表列表失败' } },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('获取表列表失败')).toBeInTheDocument();
    });
  });

  it('displays NULL values correctly', async () => {
    const user = userEvent.setup();
    (databaseService.getTableData as Mock).mockResolvedValue({
      ...mockTableData,
      rows: [
        { id: 1, email: 'user1@test.com', name: null },
      ],
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    const usersCard = screen.getByText('users').closest('.db-table-card');
    if (usersCard) {
      await user.click(usersCard);
    }

    await waitFor(() => {
      expect(screen.getByText('NULL')).toBeInTheDocument();
    });
  });

  it('refreshes data when refresh button clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    // Clear mock to track refresh call
    (databaseService.getTables as Mock).mockClear();

    // Click refresh button
    const refreshButton = screen.getByTitle('刷新');
    await user.click(refreshButton);

    await waitFor(() => {
      expect(databaseService.getTables).toHaveBeenCalled();
    });
  });

  it('navigates back to tables list', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    const usersCard = screen.getByText('users').closest('.db-table-card');
    if (usersCard) {
      await user.click(usersCard);
    }

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    // Click "所有表" to go back
    await user.click(screen.getByText('所有表'));

    await waitFor(() => {
      // Should show tables list again
      expect(screen.getByText('journals')).toBeInTheDocument();
    });
  });

  it('formats byte size correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    // 65536 bytes = 64 KB
    expect(screen.getByText('64 KB')).toBeInTheDocument();
    // 32768 bytes = 32 KB
    expect(screen.getByText('32 KB')).toBeInTheDocument();
  });

  it('shows success message after successful update', async () => {
    const user = userEvent.setup();
    (databaseService.updateRow as Mock).mockResolvedValue({ id: 1, email: 'user1@test.com', name: 'Updated Name' });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    const usersCard = screen.getByText('users').closest('.db-table-card');
    if (usersCard) {
      await user.click(usersCard);
    }

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    // Click edit
    const editButtons = screen.getAllByTitle('编辑');
    await user.click(editButtons[0]);

    // Modify a field
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });

    const nameInput = screen.getAllByRole('textbox').find(input =>
      (input as HTMLInputElement).value === 'User One'
    );
    if (nameInput) {
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
    }

    // Save
    const saveButton = screen.getByTitle('保存');
    await user.click(saveButton);

    // Confirm update
    await waitFor(() => {
      expect(screen.getAllByText('确认更新').length).toBeGreaterThanOrEqual(1);
    });

    var cub=screen.getAllByText('确认更新');await user.click(cub[cub.length-1]);

    await waitFor(() => {
      expect(screen.getByText('更新成功')).toBeInTheDocument();
    });
  });
});
