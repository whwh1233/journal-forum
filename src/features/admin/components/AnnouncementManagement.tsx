import React, { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '@/contexts/PageContext';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Send,
  Archive,
  AlertTriangle,
  Info,
  Loader,
} from 'lucide-react';
import {
  adminGetAnnouncements,
  adminPublishAnnouncement,
  adminArchiveAnnouncement,
  adminDeleteAnnouncement,
} from '@/features/announcements/services/announcementService';
import type {
  Announcement,
  AnnouncementStatus,
  AdminAnnouncementFilters,
} from '@/features/announcements/types/announcement';
import AnnouncementForm from './AnnouncementForm';
import './AnnouncementManagement.css';

// 状态标签配置
const statusConfig: Record<AnnouncementStatus, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'status--draft' },
  scheduled: { label: '定时', className: 'status--scheduled' },
  active: { label: '生效中', className: 'status--active' },
  expired: { label: '已过期', className: 'status--expired' },
  archived: { label: '已归档', className: 'status--archived' },
};

// 类型标签配置
const typeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  normal: { label: '普通', icon: <Info size={14} /> },
  urgent: { label: '紧急', icon: <AlertTriangle size={14} /> },
  banner: { label: '横幅', icon: <Megaphone size={14} /> },
};

const AnnouncementManagement: React.FC = () => {
  usePageTitle('公告管理');

  const [announcements, setAnnouncements] = useState<(Announcement & { readCount: number; readPercentage: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 筛选状态
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | 'all'>('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  // 表单状态
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // 确认删除弹窗
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 获取公告列表
  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const filters: AdminAnnouncementFilters = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'createdAt',
        order: 'desc',
      };
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      const data = await adminGetAnnouncements(filters);
      setAnnouncements(data.announcements);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination.total,
        pages: data.pagination.pages,
      }));
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || '获取公告失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // 发布公告
  const handlePublish = async (id: string) => {
    try {
      setActionLoading(id);
      await adminPublishAnnouncement(id);
      await fetchAnnouncements();
    } catch (err: any) {
      setError(err.response?.data?.message || '发布失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 归档公告
  const handleArchive = async (id: string) => {
    try {
      setActionLoading(id);
      await adminArchiveAnnouncement(id);
      await fetchAnnouncements();
    } catch (err: any) {
      setError(err.response?.data?.message || '归档失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 删除公告
  const handleDelete = async (id: string) => {
    try {
      setActionLoading(id);
      await adminDeleteAnnouncement(id);
      setDeleteConfirm(null);
      await fetchAnnouncements();
    } catch (err: any) {
      setError(err.response?.data?.message || '删除失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 打开编辑
  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  // 打开新建
  const handleCreate = () => {
    setEditingAnnouncement(null);
    setShowForm(true);
  };

  // 表单保存成功
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
    fetchAnnouncements();
  };

  // 表单取消
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
  };

  // 渲染状态筛选标签
  const renderStatusTabs = () => {
    const statuses: (AnnouncementStatus | 'all')[] = ['all', 'draft', 'scheduled', 'active', 'expired', 'archived'];
    const labels: Record<string, string> = {
      all: '全部',
      draft: '草稿',
      scheduled: '定时发布',
      active: '生效中',
      expired: '已过期',
      archived: '已归档',
    };

    return (
      <div className="announcement-mgmt__tabs">
        {statuses.map((status) => (
          <button
            key={status}
            className={`announcement-mgmt__tab ${statusFilter === status ? 'announcement-mgmt__tab--active' : ''}`}
            onClick={() => {
              setStatusFilter(status);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            {labels[status]}
          </button>
        ))}
      </div>
    );
  };

  // 渲染操作按钮
  const renderActions = (announcement: Announcement & { readCount: number }) => {
    const isLoading = actionLoading === announcement.id;
    const { status } = announcement;

    return (
      <div className="announcement-mgmt__actions">
        {isLoading ? (
          <Loader size={16} className="spinning" />
        ) : (
          <>
            {/* 编辑按钮（除 archived 外都可编辑） */}
            {status !== 'archived' && (
              <button
                className="announcement-mgmt__action-btn"
                onClick={() => handleEdit(announcement)}
                title="编辑"
              >
                <Edit2 size={16} />
              </button>
            )}

            {/* 发布按钮（仅草稿） */}
            {status === 'draft' && (
              <button
                className="announcement-mgmt__action-btn announcement-mgmt__action-btn--publish"
                onClick={() => handlePublish(announcement.id)}
                title="发布"
              >
                <Send size={16} />
              </button>
            )}

            {/* 归档按钮（仅生效中） */}
            {status === 'active' && (
              <button
                className="announcement-mgmt__action-btn announcement-mgmt__action-btn--archive"
                onClick={() => handleArchive(announcement.id)}
                title="归档"
              >
                <Archive size={16} />
              </button>
            )}

            {/* 删除按钮（草稿、过期、归档可删除） */}
            {['draft', 'expired', 'archived'].includes(status) && (
              <button
                className="announcement-mgmt__action-btn announcement-mgmt__action-btn--delete"
                onClick={() => setDeleteConfirm(announcement.id)}
                title="删除"
              >
                <Trash2 size={16} />
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  // 格式化时间
  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (showForm) {
    return (
      <AnnouncementForm
        announcement={editingAnnouncement}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="announcement-mgmt">
      <div className="page-wrapper">
        {/* 头部 */}
        <div className="announcement-mgmt__header">
          <div className="announcement-mgmt__title-row">
            <h2>
              <Megaphone size={24} /> 公告管理
              <span className="announcement-mgmt__count">{pagination.total}</span>
            </h2>
            <button className="announcement-mgmt__create-btn" onClick={handleCreate}>
              <Plus size={18} />
              新建公告
            </button>
          </div>
          {renderStatusTabs()}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="announcement-mgmt__error">
            <AlertTriangle size={16} />
            {error}
            <button onClick={() => setError('')}>&times;</button>
          </div>
        )}

        {/* 加载状态 */}
        {loading ? (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>加载中...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="announcement-mgmt__empty">
            <Megaphone size={48} strokeWidth={1} />
            <p>暂无公告</p>
          </div>
        ) : (
          <>
            {/* 列表 */}
            <div className="announcement-mgmt__table-wrapper">
              <table className="announcement-mgmt__table">
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>类型</th>
                    <th>状态</th>
                    <th>阅读率</th>
                    <th>发布时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((ann) => (
                    <tr key={ann.id}>
                      <td>
                        <div className="announcement-mgmt__title-cell">
                          {ann.isPinned && <span className="announcement-mgmt__pin">置顶</span>}
                          <span className="announcement-mgmt__title">{ann.title}</span>
                          {ann.creatorName && (
                            <span className="announcement-mgmt__creator">by {ann.creatorName}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`announcement-mgmt__type announcement-mgmt__type--${ann.type}`}>
                          {typeConfig[ann.type]?.icon}
                          {typeConfig[ann.type]?.label || ann.type}
                        </span>
                      </td>
                      <td>
                        <span className={`announcement-mgmt__status ${statusConfig[ann.status]?.className || ''}`}>
                          {statusConfig[ann.status]?.label || ann.status}
                        </span>
                      </td>
                      <td>
                        <div className="announcement-mgmt__progress">
                          <div
                            className="announcement-mgmt__progress-bar"
                            style={{ width: `${ann.readPercentage || 0}%` }}
                          />
                          <span>{ann.readCount} ({Math.round(ann.readPercentage || 0)}%)</span>
                        </div>
                      </td>
                      <td className="announcement-mgmt__time">
                        {formatTime(ann.startTime || ann.createdAt)}
                      </td>
                      <td>{renderActions(ann)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {pagination.pages > 1 && (
              <div className="announcement-mgmt__pagination">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                >
                  上一页
                </button>
                <span>
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}

        {/* 删除确认弹窗 */}
        {deleteConfirm && (
          <div className="announcement-mgmt__confirm-overlay">
            <div className="announcement-mgmt__confirm">
              <AlertTriangle size={32} />
              <h3>确认删除</h3>
              <p>删除后无法恢复，确定要删除这条公告吗？</p>
              <div className="announcement-mgmt__confirm-actions">
                <button onClick={() => setDeleteConfirm(null)}>取消</button>
                <button
                  className="announcement-mgmt__confirm-delete"
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={actionLoading === deleteConfirm}
                >
                  {actionLoading === deleteConfirm ? <Loader size={14} className="spinning" /> : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementManagement;
