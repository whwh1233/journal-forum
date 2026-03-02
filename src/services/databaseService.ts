const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export interface TableInfo {
  tableName: string;
  rowCount: number;
  dataLength: number;
  createdAt: string;
  updatedAt: string;
  comment: string;
}

export interface ColumnInfo {
  columnName: string;
  columnType: string;
  isNullable: string;
  columnKey: string;
  defaultValue: string | null;
  extra: string;
  comment: string;
}

export interface IndexInfo {
  Table: string;
  Key_name: string;
  Column_name: string;
  Non_unique: number;
  Index_type: string;
}

export interface TableStructure {
  columns: ColumnInfo[];
  indexes: IndexInfo[];
}

export interface TableDataResponse {
  rows: Record<string, any>[];
  total: number;
  page: number;
  pageSize: number;
  primaryKey: string;
}

export interface AuditLog {
  id: number;
  tableName: string;
  operation: 'UPDATE' | 'DELETE';
  rowId: string;
  oldData: Record<string, any>;
  newData: Record<string, any> | null;
  operatorId: string;
  operatorEmail: string;
  ipAddress: string;
  createdAt: string;
}

export const databaseService = {
  // 获取所有表列表
  async getTables(): Promise<TableInfo[]> {
    const response = await fetch(`${API_URL}/api/database/tables`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '获取表列表失败');
    }

    const data = await response.json();
    return data.data;
  },

  // 获取表结构
  async getTableStructure(tableName: string): Promise<TableStructure> {
    const response = await fetch(`${API_URL}/api/database/tables/${tableName}/structure`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '获取表结构失败');
    }

    const data = await response.json();
    return data.data;
  },

  // 获取表数据
  async getTableData(
    tableName: string,
    params: {
      page?: number;
      pageSize?: number;
      sortField?: string;
      sortOrder?: 'ASC' | 'DESC';
      search?: string;
      searchField?: string;
    } = {}
  ): Promise<TableDataResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', String(params.page));
    if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
    if (params.sortField) queryParams.set('sortField', params.sortField);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params.search) queryParams.set('search', params.search);
    if (params.searchField) queryParams.set('searchField', params.searchField);

    const response = await fetch(
      `${API_URL}/api/database/tables/${tableName}/data?${queryParams.toString()}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '获取表数据失败');
    }

    const data = await response.json();
    return data.data;
  },

  // 更新行数据
  async updateRow(
    tableName: string,
    rowId: string,
    rowData: Record<string, any>,
    primaryKey: string = 'id'
  ): Promise<Record<string, any>> {
    const response = await fetch(`${API_URL}/api/database/tables/${tableName}/rows/${rowId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ data: rowData, primaryKey }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '更新失败');
    }

    const data = await response.json();
    return data.data;
  },

  // 删除行
  async deleteRow(
    tableName: string,
    rowId: string,
    primaryKey: string = 'id'
  ): Promise<void> {
    const response = await fetch(`${API_URL}/api/database/tables/${tableName}/rows/${rowId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ primaryKey }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '删除失败');
    }
  },

  // 获取审计日志
  async getAuditLogs(params: {
    page?: number;
    pageSize?: number;
    tableName?: string;
  } = {}): Promise<{ logs: AuditLog[]; total: number; page: number; pageSize: number }> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', String(params.page));
    if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
    if (params.tableName) queryParams.set('tableName', params.tableName);

    const response = await fetch(
      `${API_URL}/api/database/audit-logs?${queryParams.toString()}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '获取审计日志失败');
    }

    const data = await response.json();
    return data.data;
  }
};
