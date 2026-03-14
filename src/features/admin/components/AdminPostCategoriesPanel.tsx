import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, Edit3, ChevronUp, ChevronDown, ToggleLeft, ToggleRight, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { postCategoryService } from '../../../services/postCategoryService';
import { usePageTitle } from '@/contexts/PageContext';
import type { PostCategoryInfo } from '../../posts/types/post';
import './AdminPostCategoriesPanel.css';

const AdminPostCategoriesPanel: React.FC = () => {
  usePageTitle('分类管理');

  const [categories, setCategories] = useState<PostCategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PostCategoryInfo | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);

  // Action message
  const [actionMsg, setActionMsg] = useState({ text: '', type: '' });

  const showMessage = (text: string, type: 'success' | 'error') => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg({ text: '', type: '' }), 3000);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await postCategoryService.adminGetCategories();
      setCategories(data.categories);
    } catch (err: any) {
      setError(err.message || '获取分类列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (cat: PostCategoryInfo) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) return;
    try {
      setSaving(true);
      if (editingCategory) {
        await postCategoryService.adminUpdateCategory(editingCategory.id, {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim() || undefined
        });
        showMessage('分类已更新', 'success');
      } else {
        await postCategoryService.adminCreateCategory({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim() || undefined
        });
        showMessage('分类已创建', 'success');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: any) {
      showMessage(err.message || '保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (cat: PostCategoryInfo) => {
    try {
      await postCategoryService.adminToggleCategory(cat.id);
      showMessage(`分类 "${cat.name}" 已${cat.isActive ? '停用' : '启用'}`, 'success');
      fetchCategories();
    } catch (err: any) {
      showMessage(err.message || '操作失败', 'error');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const newOrder = [...categories];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    const orderedIds = newOrder.map(c => c.id);
    try {
      setCategories(newOrder);
      await postCategoryService.adminReorderCategories(orderedIds);
    } catch (err: any) {
      showMessage(err.message || '排序失败', 'error');
      fetchCategories();
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index >= categories.length - 1) return;
    const newOrder = [...categories];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    const orderedIds = newOrder.map(c => c.id);
    try {
      setCategories(newOrder);
      await postCategoryService.adminReorderCategories(orderedIds);
    } catch (err: any) {
      showMessage(err.message || '排序失败', 'error');
      fetchCategories();
    }
  };

  const handleNameToSlug = (name: string) => {
    if (!editingCategory) {
      const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '');
      setFormData(prev => ({ ...prev, name, slug }));
    } else {
      setFormData(prev => ({ ...prev, name }));
    }
  };

  return (
    <div className="cat-mgmt">
      <div className="page-wrapper">
        {/* Header */}
        <div className="cat-mgmt__header">
          <div className="cat-mgmt__title-row">
            <h2><FolderOpen size={24} color="var(--color-accent)" /> 帖子分类管理</h2>
            <button className="cat-mgmt__create-btn" onClick={openCreateModal}>
              <Plus size={16} /> 创建分类
            </button>
          </div>
        </div>

        {/* Action message */}
        {actionMsg.text && (
          <div className={`cat-mgmt__message cat-mgmt__message--${actionMsg.type}`}>
            {actionMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {actionMsg.text}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="cat-mgmt__error">
            <AlertTriangle size={16} />
            {error}
            <button onClick={() => setError('')}>&times;</button>
          </div>
        )}

        {/* Table */}
        <div className="cat-mgmt__table-wrapper">
          <table className="cat-mgmt__table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>排序</th>
                <th>名称</th>
                <th>Slug</th>
                <th>描述</th>
                <th>帖子数</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="cat-mgmt__loading-cell">
                    <div className="loading-spinner" />
                    加载中...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="cat-mgmt__empty-cell">暂无分类</td>
                </tr>
              ) : (
                categories.map((cat, index) => (
                  <tr key={cat.id} className={cat.isActive === false ? 'cat-mgmt__row--inactive' : ''}>
                    <td>
                      <div className="cat-mgmt__reorder">
                        <button
                          className="cat-mgmt__reorder-btn"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          title="上移"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <span className="cat-mgmt__order-num">{index + 1}</span>
                        <button
                          className="cat-mgmt__reorder-btn"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === categories.length - 1}
                          title="下移"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="cat-mgmt__cat-name">{cat.name}</span>
                    </td>
                    <td>
                      <code className="cat-mgmt__slug">{cat.slug}</code>
                    </td>
                    <td className="cat-mgmt__text-muted">
                      {cat.description || '-'}
                    </td>
                    <td className="cat-mgmt__text-muted">{cat.postCount || 0}</td>
                    <td>
                      <span className={`cat-mgmt__status ${cat.isActive !== false ? 'cat-mgmt__status--active' : 'cat-mgmt__status--inactive'}`}>
                        {cat.isActive !== false ? '启用' : '停用'}
                      </span>
                    </td>
                    <td>
                      <div className="cat-mgmt__actions">
                        <button
                          className="cat-mgmt__action-btn"
                          onClick={() => openEditModal(cat)}
                          title="编辑"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className={`cat-mgmt__action-btn ${cat.isActive !== false ? 'cat-mgmt__action-btn--deactivate' : 'cat-mgmt__action-btn--activate'}`}
                          onClick={() => handleToggle(cat)}
                          title={cat.isActive !== false ? '停用' : '启用'}
                        >
                          {cat.isActive !== false ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="cat-mgmt__modal-overlay" onClick={() => setShowModal(false)}>
            <div className="cat-mgmt__modal" onClick={e => e.stopPropagation()}>
              <div className="cat-mgmt__modal-header">
                <h3>
                  {editingCategory ? <><Edit3 size={20} /> 编辑分类</> : <><Plus size={20} /> 创建分类</>}
                </h3>
                <button className="cat-mgmt__modal-close" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="cat-mgmt__modal-body">
                <div className="cat-mgmt__form-field">
                  <label>名称 <span className="cat-mgmt__required">*</span></label>
                  <input
                    type="text"
                    placeholder="例如：投稿经验"
                    value={formData.name}
                    onChange={e => handleNameToSlug(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="cat-mgmt__form-field">
                  <label>Slug <span className="cat-mgmt__required">*</span></label>
                  <input
                    type="text"
                    placeholder="例如：experience"
                    value={formData.slug}
                    onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  />
                  <span className="cat-mgmt__field-hint">URL 标识符，仅限小写字母、数字和连字符</span>
                </div>
                <div className="cat-mgmt__form-field">
                  <label>描述</label>
                  <textarea
                    placeholder="分类描述（可选）"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
              <div className="cat-mgmt__modal-footer">
                <button className="cat-mgmt__btn cat-mgmt__btn--cancel" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button
                  className="cat-mgmt__btn cat-mgmt__btn--primary"
                  onClick={handleSave}
                  disabled={!formData.name.trim() || !formData.slug.trim() || saving}
                >
                  {saving ? '保存中...' : editingCategory ? '保存' : '创建'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPostCategoriesPanel;
