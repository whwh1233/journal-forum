import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Clock, Trash2, Flag, Eye } from 'lucide-react';
import './PostReportManagement.css';

interface PostReport {
  id: number;
  postId: number;
  postTitle: string;
  postContent: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  adminNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const PostReportManagement: React.FC = () => {
  const [reports, setReports] = useState<PostReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedReports, setSelectedReports] = useState<number[]>([]);
  const [processingReport, setProcessingReport] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<PostReport | null>(null);

  // Fetch reports
  const fetchReports = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (filterStatus) {
        params.append('status', filterStatus);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/post-reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data.data.reports);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterStatus]);

  // Handle report status update
  const handleUpdateStatus = async (
    reportId: number,
    status: string,
    action?: string,
    adminNote?: string
  ) => {
    try {
      setProcessingReport(reportId);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/post-reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, action, adminNote })
      });

      if (!response.ok) {
        throw new Error('Failed to update report');
      }

      // Refresh reports list
      await fetchReports(pagination.currentPage);
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新失败');
    } finally {
      setProcessingReport(null);
    }
  };

  // Handle batch processing
  const handleBatchProcess = async (status: string, action?: string) => {
    if (selectedReports.length === 0) {
      alert('请选择要处理的举报');
      return;
    }

    if (!confirm(`确定要批量处理 ${selectedReports.length} 条举报吗？`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/post-reports/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reportIds: selectedReports, status, action })
      });

      if (!response.ok) {
        throw new Error('Failed to batch process');
      }

      setSelectedReports([]);
      await fetchReports(pagination.currentPage);
      alert('批量处理成功');
    } catch (err) {
      alert(err instanceof Error ? err.message : '批量处理失败');
    }
  };

  // Toggle report selection
  const toggleReportSelection = (reportId: number) => {
    setSelectedReports(prev =>
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  // Select all reports
  const selectAllReports = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map(r => r.id));
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { icon: <Clock size={14} />, text: '待处理', className: 'status-pending' },
      reviewed: { icon: <CheckCircle size={14} />, text: '已处理', className: 'status-reviewed' },
      dismissed: { icon: <XCircle size={14} />, text: '已驳回', className: 'status-dismissed' }
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;

    return (
      <span className={`report-status-badge ${badge.className}`}>
        {badge.icon}
        <span>{badge.text}</span>
      </span>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  if (loading && reports.length === 0) {
    return (
      <div className="report-management">
        <div className="loading-state">加载中...</div>
      </div>
    );
  }

  if (error && reports.length === 0) {
    return (
      <div className="report-management">
        <div className="error-state">
          <AlertCircle size={48} />
          <p>{error}</p>
          <button onClick={() => fetchReports()}>重试</button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-management">
      <div className="report-header">
        <h2>帖子举报管理</h2>
        <div className="report-stats">
          <span>总计: {pagination.totalItems} 条举报</span>
          <span>当前页: {pagination.currentPage} / {pagination.totalPages}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="report-filters">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="reviewed">已处理</option>
          <option value="dismissed">已驳回</option>
        </select>

        {selectedReports.length > 0 && (
          <div className="batch-actions">
            <span>已选择 {selectedReports.length} 条</span>
            <button onClick={() => handleBatchProcess('reviewed', 'delete_posts')}>
              批量删除帖子
            </button>
            <button onClick={() => handleBatchProcess('dismissed')}>
              批量驳回
            </button>
          </div>
        )}
      </div>

      {/* Reports Table */}
      <div className="report-table-container">
        <table className="report-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedReports.length === reports.length && reports.length > 0}
                  onChange={selectAllReports}
                />
              </th>
              <th>举报时间</th>
              <th>帖子标题</th>
              <th>举报人</th>
              <th>举报原因</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <tr key={report.id} className={selectedReports.includes(report.id) ? 'selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedReports.includes(report.id)}
                    onChange={() => toggleReportSelection(report.id)}
                  />
                </td>
                <td>{formatDate(report.createdAt)}</td>
                <td>
                  <div className="post-info">
                    <div className="post-title">{report.postTitle}</div>
                    <div className="post-preview">{report.postContent}</div>
                  </div>
                </td>
                <td>
                  <div className="reporter-info">
                    <div>{report.reporterName}</div>
                    <div className="reporter-email">{report.reporterEmail}</div>
                  </div>
                </td>
                <td className="report-reason">{report.reason}</td>
                <td>{getStatusBadge(report.status)}</td>
                <td>
                  <div className="report-actions">
                    <button
                      className="action-btn action-view"
                      onClick={() => setShowDetailModal(report)}
                      title="查看详情"
                    >
                      <Eye size={16} />
                    </button>

                    {report.status === 'pending' && (
                      <>
                        <button
                          className="action-btn action-approve"
                          onClick={() => handleUpdateStatus(report.id, 'reviewed', 'delete_post')}
                          disabled={processingReport === report.id}
                          title="删除帖子"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          className="action-btn action-reject"
                          onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                          disabled={processingReport === report.id}
                          title="驳回举报"
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => fetchReports(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            上一页
          </button>
          <span>第 {pagination.currentPage} 页 / 共 {pagination.totalPages} 页</span>
          <button
            onClick={() => fetchReports(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            下一页
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>举报详情</h3>
              <button onClick={() => setShowDetailModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>帖子信息</h4>
                <p><strong>标题:</strong> {showDetailModal.postTitle}</p>
                <p><strong>内容预览:</strong> {showDetailModal.postContent}</p>
              </div>
              <div className="detail-section">
                <h4>举报信息</h4>
                <p><strong>举报人:</strong> {showDetailModal.reporterName} ({showDetailModal.reporterEmail})</p>
                <p><strong>举报原因:</strong> {showDetailModal.reason}</p>
                <p><strong>举报时间:</strong> {formatDate(showDetailModal.createdAt)}</p>
              </div>
              {showDetailModal.adminNote && (
                <div className="detail-section">
                  <h4>管理员备注</h4>
                  <p>{showDetailModal.adminNote}</p>
                </div>
              )}
              {showDetailModal.reviewedAt && (
                <div className="detail-section">
                  <p><strong>处理时间:</strong> {formatDate(showDetailModal.reviewedAt)}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDetailModal(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {reports.length === 0 && !loading && (
        <div className="empty-state">
          <Flag size={64} strokeWidth={1} />
          <p>暂无举报记录</p>
        </div>
      )}
    </div>
  );
};

export default PostReportManagement;
