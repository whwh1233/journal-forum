import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Search, CheckCircle, XCircle, Edit3, GitMerge, Trash2, Star, Clock, Filter, AlertTriangle, X } from 'lucide-react';
import { tagService } from '../../../services/tagService';
import { usePageTitle } from '@/contexts/PageContext';
import TagMergeModal from './TagMergeModal';
import type { TagInfo } from '../../posts/types/post';
import './AdminTagsPanel.css';

const AdminTagsPanel: React.FC = () => {
  usePageTitle('标签管理');

  // Pending tags
  const [pendingTags, setPendingTags] = useState<TagInfo[]>([]);
  const [selectedPending, setSelectedPending] = useState<Set<number>>(new Set());
  const [pendingLoading, setPendingLoading] = useState(false);

  // Main list
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [officialFilter, setOfficialFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Edit
  const [editingTag, setEditingTag] = useState<TagInfo | null>(null);
  const [editName, setEditName] = useState('');

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);

  // Merge modal
  const [mergeSourceTag, setMergeSourceTag] = useState<TagInfo | null>(null);

  // Delete confirm
  const [deleteTag, setDeleteTag] = useState<TagInfo | null>(null);

  // Action message
  const [actionMsg, setActionMsg] = useState({ text: '', type: '' });

  const showMessage = (text: string, type: 'success' | 'error') => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg({ text: '', type: '' }), 3000);
  };

  const fetchPendingTags = useCallback(async () => {
    try {
      setPendingLoading(true);
      const data = await tagService.adminGetTags({ status: 'pending', limit: 50 });
      setPendingTags(data.tags);
    } catch {
      // silent
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const fetchTags = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const params: Record<string, any> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (officialFilter) params.isOfficial = officialFilter;
      if (searchQuery) params.search = searchQuery;
      const data = await tagService.adminGetTags(params);
      setTags(data.tags);
      setPagination({
        page: data.pagination?.page || page,
        totalPages: data.pagination?.totalPages || 1,
        total: data.pagination?.total || data.tags.length
      });
    } catch (err: any) {
      setError(err.message || '获取标签列表失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, officialFilter, searchQuery]);

  useEffect(() => {
    fetchPendingTags();
  }, [fetchPendingTags]);

  useEffect(() => {
    fetchTags(1);
  }, [fetchTags]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Pending actions
  const togglePendingSelect = (id: number) => {
    setSelectedPending(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPending.size === pendingTags.length) {
      setSelectedPending(new Set());
    } else {
      setSelectedPending(new Set(pendingTags.map(t => t.id)));
    }
  };

  const handleBatchApprove = async () => {
    if (selectedPending.size === 0) return;
    try {
      await tagService.adminBatchApprove(Array.from(selectedPending));
      showMessage(`已批准 ${selectedPending.size} 个标签`, 'success');
      setSelectedPending(new Set());
      fetchPendingTags();
      fetchTags(pagination.page);
    } catch (err: any) {
      showMessage(err.message || '批量审批失败', 'error');
    }
  };

  const handleBatchReject = async () => {
    if (selectedPending.size === 0) return;
    try {
      await tagService.adminBatchReject(Array.from(selectedPending));
      showMessage(`已拒绝 ${selectedPending.size} 个标签`, 'success');
      setSelectedPending(new Set());
      fetchPendingTags();
      fetchTags(pagination.page);
    } catch (err: any) {
      showMessage(err.message || '批量拒绝失败', 'error');
    }
  };

  // Edit
  const startEdit = (tag: TagInfo) => {
    setEditingTag(tag);
    setEditName(tag.name);
  };

  const handleSaveEdit = async () => {
    if (!editingTag || !editName.trim()) return;
    try {
      await tagService.adminUpdateTag(editingTag.id, editName.trim());
      showMessage('标签已更新', 'success');
      setEditingTag(null);
      fetchTags(pagination.page);
    } catch (err: any) {
      showMessage(err.message || '更新失败', 'error');
    }
  };

  // Create
  const handleCreate = async () => {
    if (!createName.trim()) return;
    try {
      setCreating(true);
      await tagService.adminCreateTag(createName.trim());
      showMessage('官方标签已创建', 'success');
      setCreateName('');
      setShowCreateModal(false);
      fetchTags(pagination.page);
    } catch (err: any) {
      showMessage(err.message || '创建失败', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTag) return;
    try {
      await tagService.adminDeleteTag(deleteTag.id);
      showMessage('标签已删除', 'success');
      setDeleteTag(null);
      fetchTags(pagination.page);
      fetchPendingTags();
    } catch (err: any) {
      showMessage(err.message || '删除失败', 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  return (
    <div className="tag-mgmt">
      <div className="page-wrapper">
        {/* Header */}
        <div className="tag-mgmt__header">
          <div className="tag-mgmt__title-row">
            <h2><Tag size={24} color="var(--color-accent)" /> 标签管理</h2>
            <button className="tag-mgmt__create-btn" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> 创建官方标签
            </button>
          </div>
        </div>

        {/* Action message */}
        {actionMsg.text && (
          <div className={`tag-mgmt__message tag-mgmt__message--${actionMsg.type}`}>
            {actionMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {actionMsg.text}
          </div>
        )}

        {/* Pending Review Section */}
        {pendingTags.length > 0 && (
          <div className="tag-mgmt__pending-section">
            <div className="tag-mgmt__pending-header">
              <h3><Clock size={18} /> 待审核标签 <span className="tag-mgmt__count">({pendingTags.length})</span></h3>
              <div className="tag-mgmt__pending-actions">
                <button
                  className="tag-mgmt__btn tag-mgmt__btn--approve"
                  onClick={handleBatchApprove}
                  disabled={selectedPending.size === 0}
                >
                  <CheckCircle size={14} /> 批量通过 ({selectedPending.size})
                </button>
                <button
                  className="tag-mgmt__btn tag-mgmt__btn--reject"
                  onClick={handleBatchReject}
                  disabled={selectedPending.size === 0}
                >
                  <XCircle size={14} /> 批量拒绝 ({selectedPending.size})
                </button>
              </div>
            </div>
            <div className="tag-mgmt__table-wrapper">
              <table className="tag-mgmt__table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        checked={selectedPending.size === pendingTags.length && pendingTags.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>标签名称</th>
                    <th>创建者</th>
                    <th>帖子数</th>
                    <th>创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTags.map(tag => (
                    <tr key={tag.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedPending.has(tag.id)}
                          onChange={() => togglePendingSelect(tag.id)}
                        />
                      </td>
                      <td className="tag-mgmt__tag-name">{tag.name}</td>
                      <td className="tag-mgmt__text-muted">{tag.createdBy || '-'}</td>
                      <td className="tag-mgmt__text-muted">{tag.postCount || 0}</td>
                      <td className="tag-mgmt__text-muted">{tag.createdBy ? '-' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="tag-mgmt__filters">
          <div className="tag-mgmt__search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="搜索标签..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          <div className="tag-mgmt__filter-group">
            <Filter size={14} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">全部状态</option>
              <option value="approved">已审核</option>
              <option value="pending">待审核</option>
            </select>
            <select value={officialFilter} onChange={e => setOfficialFilter(e.target.value)}>
              <option value="">全部类型</option>
              <option value="true">官方标签</option>
              <option value="false">用户标签</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="tag-mgmt__error">
            <AlertTriangle size={16} />
            {error}
            <button onClick={() => setError('')}>&times;</button>
          </div>
        )}

        {/* Main Table */}
        <div className="tag-mgmt__table-wrapper">
          <table className="tag-mgmt__table">
            <thead>
              <tr>
                <th>名称</th>
                <th>类型</th>
                <th>帖子数</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="tag-mgmt__loading-cell">
                    <div className="loading-spinner" />
                    加载中...
                  </td>
                </tr>
              ) : tags.length === 0 ? (
                <tr>
                  <td colSpan={5} className="tag-mgmt__empty-cell">暂无标签</td>
                </tr>
              ) : (
                tags.map(tag => (
                  <tr key={tag.id}>
                    <td>
                      {editingTag?.id === tag.id ? (
                        <div className="tag-mgmt__inline-edit">
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') setEditingTag(null);
                            }}
                            autoFocus
                          />
                          <button className="tag-mgmt__inline-save" onClick={handleSaveEdit}>
                            <CheckCircle size={14} />
                          </button>
                          <button className="tag-mgmt__inline-cancel" onClick={() => setEditingTag(null)}>
                            <XCircle size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="tag-mgmt__tag-name">{tag.name}</span>
                      )}
                    </td>
                    <td>
                      <span className={`tag-mgmt__type-badge ${tag.isOfficial ? 'tag-mgmt__type-badge--official' : 'tag-mgmt__type-badge--user'}`}>
                        {tag.isOfficial ? <><Star size={12} /> 官方</> : '用户'}
                      </span>
                    </td>
                    <td className="tag-mgmt__text-muted">{tag.postCount || 0}</td>
                    <td>
                      <span className={`tag-mgmt__status ${tag.status === 'approved' ? 'tag-mgmt__status--approved' : 'tag-mgmt__status--pending'}`}>
                        {tag.status === 'approved' ? '已审核' : '待审核'}
                      </span>
                    </td>
                    <td>
                      <div className="tag-mgmt__actions">
                        <button
                          className="tag-mgmt__action-btn"
                          onClick={() => startEdit(tag)}
                          title="编辑"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="tag-mgmt__action-btn"
                          onClick={() => setMergeSourceTag(tag)}
                          title="合并"
                        >
                          <GitMerge size={15} />
                        </button>
                        <button
                          className="tag-mgmt__action-btn tag-mgmt__action-btn--delete"
                          onClick={() => setDeleteTag(tag)}
                          title="删除"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="tag-mgmt__pagination">
            <button
              onClick={() => fetchTags(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              上一页
            </button>
            <span>{pagination.page} / {pagination.totalPages}</span>
            <button
              onClick={() => fetchTags(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              下一页
            </button>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="tag-mgmt__modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="tag-mgmt__modal" onClick={e => e.stopPropagation()}>
              <div className="tag-mgmt__modal-header">
                <h3><Plus size={20} /> 创建官方标签</h3>
                <button className="tag-mgmt__modal-close" onClick={() => setShowCreateModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="tag-mgmt__modal-body">
                <div className="tag-mgmt__form-field">
                  <label>标签名称</label>
                  <input
                    type="text"
                    placeholder="请输入标签名称"
                    value={createName}
                    onChange={e => setCreateName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                    autoFocus
                  />
                </div>
              </div>
              <div className="tag-mgmt__modal-footer">
                <button className="tag-mgmt__btn tag-mgmt__btn--cancel" onClick={() => setShowCreateModal(false)}>
                  取消
                </button>
                <button
                  className="tag-mgmt__btn tag-mgmt__btn--primary"
                  onClick={handleCreate}
                  disabled={!createName.trim() || creating}
                >
                  {creating ? '创建中...' : '创建'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {deleteTag && (
          <div className="tag-mgmt__modal-overlay" onClick={() => setDeleteTag(null)}>
            <div className="tag-mgmt__confirm" onClick={e => e.stopPropagation()}>
              <AlertTriangle size={40} />
              <h3>确认删除</h3>
              <p>确定要删除标签 "{deleteTag.name}" 吗？该标签关联了 {deleteTag.postCount || 0} 篇帖子。</p>
              <div className="tag-mgmt__confirm-actions">
                <button onClick={() => setDeleteTag(null)}>取消</button>
                <button className="tag-mgmt__btn--danger" onClick={handleDelete}>确认删除</button>
              </div>
            </div>
          </div>
        )}

        {/* Merge Modal */}
        {mergeSourceTag && (
          <TagMergeModal
            sourceTag={mergeSourceTag}
            onClose={() => setMergeSourceTag(null)}
            onMerged={() => {
              setMergeSourceTag(null);
              showMessage('标签合并成功', 'success');
              fetchTags(pagination.page);
              fetchPendingTags();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AdminTagsPanel;
