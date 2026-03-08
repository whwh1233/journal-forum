import React, { useState, useEffect, useCallback } from 'react';
import {
  databaseService,
  TableInfo,
  TableStructure,
  TableDataResponse,
  AuditLog
} from '../../../services/databaseService';
import { usePageTitle } from '@/contexts/PageContext';
import {
  Database,
  Table,
  Columns,
  Search,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  History,
  X,
  Check,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import './DatabaseManager.css';

type ViewMode = 'tables' | 'structure' | 'data' | 'logs';

const DatabaseManager: React.FC = () => {
  usePageTitle('数据库管理');

  // 表列表状态
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('tables');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 表结构状态
  const [structure, setStructure] = useState<TableStructure | null>(null);

  // 表数据状态
  const [tableData, setTableData] = useState<TableDataResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [searchField, setSearchField] = useState('');
  const [searchValue, setSearchValue] = useState('');

  // 编辑状态
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Record<string, any>>({});

  // 确认弹窗状态
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    type: 'edit' | 'delete';
    rowId: string;
    message: string;
  } | null>(null);

  // 审计日志
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);

  // 操作反馈
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 加载表列表
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const data = await databaseService.getTables();
      setTables(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || '获取表列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载表结构
  const fetchStructure = useCallback(async (tableName: string) => {
    try {
      setLoading(true);
      const data = await databaseService.getTableStructure(tableName);
      setStructure(data);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取表结构失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载表数据
  const fetchTableData = useCallback(async (tableName: string) => {
    try {
      setLoading(true);
      const data = await databaseService.getTableData(tableName, {
        page,
        pageSize,
        sortField: sortField || undefined,
        sortOrder,
        search: searchValue || undefined,
        searchField: searchField || undefined
      });
      setTableData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取表数据失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortField, sortOrder, searchValue, searchField]);

  // 加载审计日志
  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await databaseService.getAuditLogs({
        page: logsPage,
        pageSize: 50,
        tableName: selectedTable || undefined
      });
      setAuditLogs(data.logs);
      setLogsTotal(data.total);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取审计日志失败');
    } finally {
      setLoading(false);
    }
  }, [logsPage, selectedTable]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useEffect(() => {
    if (viewMode === 'structure' && selectedTable) {
      fetchStructure(selectedTable);
    } else if (viewMode === 'data' && selectedTable) {
      fetchTableData(selectedTable);
    } else if (viewMode === 'logs') {
      fetchAuditLogs();
    }
  }, [viewMode, selectedTable, fetchStructure, fetchTableData, fetchAuditLogs]);

  // 选择表
  const handleSelectTable = (tableName: string) => {
    setSelectedTable(tableName);
    setViewMode('data');
    setPage(1);
    setSortField('');
    setSearchField('');
    setSearchValue('');
    setEditingRow(null);
  };

  // 排序
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortOrder('ASC');
    }
    setPage(1);
  };

  // 搜索
  const handleSearch = () => {
    setPage(1);
    fetchTableData(selectedTable);
  };

  // 开始编辑
  const handleStartEdit = (row: Record<string, any>) => {
    const pk = tableData?.primaryKey || 'id';
    setEditingRow(String(row[pk]));
    setEditedData({ ...row });
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditedData({});
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingRow || !tableData) return;

    const pk = tableData.primaryKey;
    const originalRow = tableData.rows.find(r => String(r[pk]) === editingRow);
    if (!originalRow) return;

    // 只提取修改过的字段
    const changes: Record<string, any> = {};
    Object.keys(editedData).forEach(key => {
      if (key !== pk && editedData[key] !== originalRow[key]) {
        changes[key] = editedData[key];
      }
    });

    if (Object.keys(changes).length === 0) {
      setActionMessage({ text: '没有检测到修改', type: 'info' });
      setTimeout(() => setActionMessage(null), 2000);
      handleCancelEdit();
      return;
    }

    setConfirmModal({
      show: true,
      type: 'edit',
      rowId: editingRow,
      message: `确定要更新 ${selectedTable} 表中 ${pk}=${editingRow} 的记录吗？`
    });
  };

  // 确认编辑
  const confirmEdit = async () => {
    if (!editingRow || !tableData) return;

    try {
      const pk = tableData.primaryKey;
      const originalRow = tableData.rows.find(r => String(r[pk]) === editingRow);
      if (!originalRow) return;

      const changes: Record<string, any> = {};
      Object.keys(editedData).forEach(key => {
        if (key !== pk && editedData[key] !== originalRow[key]) {
          changes[key] = editedData[key];
        }
      });

      await databaseService.updateRow(selectedTable, editingRow, changes, pk);
      setActionMessage({ text: '更新成功', type: 'success' });
      handleCancelEdit();
      fetchTableData(selectedTable);
    } catch (err: any) {
      setActionMessage({ text: err.response?.data?.message || '更新失败', type: 'error' });
    } finally {
      setConfirmModal(null);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  // 删除行
  const handleDeleteRow = (rowId: string) => {
    setConfirmModal({
      show: true,
      type: 'delete',
      rowId,
      message: `确定要删除 ${selectedTable} 表中此记录吗？此操作不可撤销！`
    });
  };

  // 确认删除
  const confirmDelete = async () => {
    if (!confirmModal || !tableData) return;

    try {
      await databaseService.deleteRow(selectedTable, confirmModal.rowId, tableData.primaryKey);
      setActionMessage({ text: '删除成功', type: 'success' });
      fetchTableData(selectedTable);
    } catch (err: any) {
      setActionMessage({ text: err.response?.data?.message || '删除失败', type: 'error' });
    } finally {
      setConfirmModal(null);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  // 格式化字节
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 渲染表列表
  const renderTablesList = () => (
    <div className="db-tables-grid">
      {tables.map(table => (
        <div
          key={table.tableName}
          className="db-table-card"
          onClick={() => handleSelectTable(table.tableName)}
        >
          <div className="db-table-card-header">
            <Table size={20} />
            <span className="db-table-name">{table.tableName}</span>
          </div>
          <div className="db-table-card-stats">
            <div className="db-stat">
              <span className="db-stat-label">记录数</span>
              <span className="db-stat-value">{table.rowCount?.toLocaleString() || 0}</span>
            </div>
            <div className="db-stat">
              <span className="db-stat-label">数据大小</span>
              <span className="db-stat-value">{formatBytes(table.dataLength || 0)}</span>
            </div>
          </div>
          {table.comment && (
            <div className="db-table-comment">{table.comment}</div>
          )}
        </div>
      ))}
    </div>
  );

  // 渲染表结构
  const renderStructure = () => {
    if (!structure) return null;

    return (
      <div className="db-structure">
        <div className="db-section">
          <h3><Columns size={18} /> 字段结构</h3>
          <div className="db-structure-table-container">
            <table className="db-table">
              <thead>
                <tr>
                  <th>字段名</th>
                  <th>类型</th>
                  <th>可空</th>
                  <th>键类型</th>
                  <th>默认值</th>
                  <th>额外</th>
                  <th>注释</th>
                </tr>
              </thead>
              <tbody>
                {structure.columns.map(col => (
                  <tr key={col.columnName}>
                    <td className="font-mono font-medium">{col.columnName}</td>
                    <td className="font-mono text-sm">{col.columnType}</td>
                    <td>
                      <span className={`db-badge ${col.isNullable === 'YES' ? 'nullable' : 'not-null'}`}>
                        {col.isNullable === 'YES' ? 'NULL' : 'NOT NULL'}
                      </span>
                    </td>
                    <td>
                      {col.columnKey && (
                        <span className={`db-badge key-${col.columnKey.toLowerCase()}`}>
                          {col.columnKey}
                        </span>
                      )}
                    </td>
                    <td className="text-sm text-muted">
                      {col.defaultValue ?? <span className="text-gray-400">-</span>}
                    </td>
                    <td className="text-sm">{col.extra || '-'}</td>
                    <td className="text-sm text-muted">{col.comment || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {structure.indexes.length > 0 && (
          <div className="db-section">
            <h3>索引信息</h3>
            <div className="db-structure-table-container">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>索引名</th>
                    <th>字段</th>
                    <th>唯一性</th>
                    <th>类型</th>
                  </tr>
                </thead>
                <tbody>
                  {structure.indexes.map((idx, i) => (
                    <tr key={i}>
                      <td className="font-mono">{idx.Key_name}</td>
                      <td className="font-mono">{idx.Column_name}</td>
                      <td>
                        <span className={`db-badge ${idx.Non_unique ? 'non-unique' : 'unique'}`}>
                          {idx.Non_unique ? '非唯一' : '唯一'}
                        </span>
                      </td>
                      <td>{idx.Index_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染表数据
  const renderTableData = () => {
    if (!tableData) return null;

    const columns = tableData.rows.length > 0 ? Object.keys(tableData.rows[0]) : [];
    const totalPages = Math.ceil(tableData.total / pageSize);

    return (
      <div className="db-data">
        {/* 搜索和筛选 */}
        <div className="db-data-toolbar">
          <div className="db-search-group">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="db-select"
            >
              <option value="">选择字段</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="搜索..."
              className="db-input"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="db-btn db-btn-search">
              <Search size={16} /> 搜索
            </button>
          </div>
          <div className="db-page-size">
            <span>每页</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="db-select-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>条</span>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="db-data-table-container">
          <table className="db-table db-data-table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="sortable"
                  >
                    <span>{col}</span>
                    {sortField === col && (
                      <ArrowUpDown size={14} className={sortOrder === 'DESC' ? 'desc' : ''} />
                    )}
                  </th>
                ))}
                <th className="actions-col">操作</th>
              </tr>
            </thead>
            <tbody>
              {tableData.rows.map((row, idx) => {
                const pk = tableData.primaryKey;
                const rowId = String(row[pk]);
                const isEditing = editingRow === rowId;

                return (
                  <tr key={idx} className={isEditing ? 'editing' : ''}>
                    {columns.map(col => (
                      <td key={col}>
                        {isEditing && col !== pk ? (
                          <input
                            type="text"
                            value={editedData[col] ?? ''}
                            onChange={(e) => setEditedData({
                              ...editedData,
                              [col]: e.target.value
                            })}
                            className="db-edit-input"
                          />
                        ) : (
                          <span className="db-cell-value" title={String(row[col] ?? '')}>
                            {row[col] === null ? (
                              <span className="null-value">NULL</span>
                            ) : typeof row[col] === 'object' ? (
                              JSON.stringify(row[col])
                            ) : (
                              String(row[col])
                            )}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="actions-col">
                      {isEditing ? (
                        <div className="db-row-actions">
                          <button
                            onClick={handleSaveEdit}
                            className="db-btn-icon save"
                            title="保存"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="db-btn-icon cancel"
                            title="取消"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="db-row-actions">
                          <button
                            onClick={() => handleStartEdit(row)}
                            className="db-btn-icon edit"
                            title="编辑"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(rowId)}
                            className="db-btn-icon delete"
                            title="删除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="db-pagination">
          <span className="db-pagination-info">
            共 {tableData.total} 条，第 {page}/{totalPages} 页
          </span>
          <div className="db-pagination-btns">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="db-btn-page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="db-btn-page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 渲染审计日志
  const renderAuditLogs = () => (
    <div className="db-logs">
      <div className="db-logs-table-container">
        <table className="db-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>表名</th>
              <th>操作</th>
              <th>行 ID</th>
              <th>操作者</th>
              <th>变更详情</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map(log => (
              <tr key={log.id}>
                <td className="text-sm">
                  {new Date(log.createdAt).toLocaleString('zh-CN')}
                </td>
                <td className="font-mono">{log.tableName}</td>
                <td>
                  <span className={`db-badge op-${log.operation.toLowerCase()}`}>
                    {log.operation}
                  </span>
                </td>
                <td className="font-mono text-sm">{log.rowId}</td>
                <td className="text-sm">{log.operatorEmail}</td>
                <td>
                  <details className="db-log-details">
                    <summary>查看</summary>
                    <div className="db-log-diff">
                      <div className="diff-old">
                        <strong>旧数据:</strong>
                        <pre>{JSON.stringify(log.oldData, null, 2)}</pre>
                      </div>
                      {log.newData && (
                        <div className="diff-new">
                          <strong>新数据:</strong>
                          <pre>{JSON.stringify(log.newData, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="db-pagination">
        <span className="db-pagination-info">
          共 {logsTotal} 条日志
        </span>
        <div className="db-pagination-btns">
          <button
            onClick={() => setLogsPage(p => Math.max(1, p - 1))}
            disabled={logsPage === 1}
            className="db-btn-page"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setLogsPage(p => p + 1)}
            disabled={auditLogs.length < 50}
            className="db-btn-page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading && viewMode === 'tables' && tables.length === 0) {
    return (
      <div className="database-manager">
        <div className="page-wrapper">
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>正在连接数据库...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && viewMode === 'tables') {
    return (
      <div className="database-manager">
        <div className="page-wrapper">
          <div className="admin-error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="database-manager">
      <div className="page-wrapper">
        {/* 操作反馈 */}
        {actionMessage && (
          <div className={`action-message ${actionMessage.type}`}>
            {actionMessage.type === 'success' && <Check size={18} />}
            {actionMessage.type === 'error' && <AlertTriangle size={18} />}
            {actionMessage.text}
          </div>
        )}

        {/* 顶部导航 */}
        <div className="db-nav">
          <div className="db-nav-left">
            <button
              className={`db-nav-btn ${viewMode === 'tables' ? 'active' : ''}`}
              onClick={() => { setViewMode('tables'); setSelectedTable(''); }}
            >
              <Database size={18} /> 所有表
            </button>
            {selectedTable && (
              <>
                <span className="db-nav-sep">/</span>
                <span className="db-nav-table">{selectedTable}</span>
                <div className="db-view-tabs">
                  <button
                    className={viewMode === 'data' ? 'active' : ''}
                    onClick={() => setViewMode('data')}
                  >
                    数据
                  </button>
                  <button
                    className={viewMode === 'structure' ? 'active' : ''}
                    onClick={() => setViewMode('structure')}
                  >
                    结构
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="db-nav-right">
            <button
              className={`db-nav-btn ${viewMode === 'logs' ? 'active' : ''}`}
              onClick={() => setViewMode('logs')}
            >
              <History size={18} /> 操作日志
            </button>
            <button
              className="db-nav-btn"
              onClick={() => {
                if (viewMode === 'tables') fetchTables();
                else if (viewMode === 'data') fetchTableData(selectedTable);
                else if (viewMode === 'structure') fetchStructure(selectedTable);
                else fetchAuditLogs();
              }}
              title="刷新"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="db-content">
          {loading && <div className="db-loading-overlay"><div className="loading-spinner"></div></div>}

          {viewMode === 'tables' && renderTablesList()}
          {viewMode === 'structure' && renderStructure()}
          {viewMode === 'data' && renderTableData()}
          {viewMode === 'logs' && renderAuditLogs()}
        </div>

        {/* 确认弹窗 */}
        {confirmModal?.show && (
          <div className="db-modal-overlay" onClick={() => setConfirmModal(null)}>
            <div className="db-modal" onClick={(e) => e.stopPropagation()}>
              <div className="db-modal-header">
                <AlertTriangle size={24} className="warning-icon" />
                <h3>{confirmModal.type === 'edit' ? '确认更新' : '确认删除'}</h3>
              </div>
              <div className="db-modal-body">
                <p>{confirmModal.message}</p>
              </div>
              <div className="db-modal-footer">
                <button
                  className="db-btn db-btn-cancel"
                  onClick={() => setConfirmModal(null)}
                >
                  取消
                </button>
                <button
                  className={`db-btn ${confirmModal.type === 'delete' ? 'db-btn-danger' : 'db-btn-primary'}`}
                  onClick={confirmModal.type === 'edit' ? confirmEdit : confirmDelete}
                >
                  {confirmModal.type === 'edit' ? '确认更新' : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseManager;
