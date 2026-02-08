import React, { useEffect, useState, useCallback } from 'react';
import { journalService, categoryMap } from '../../../services/journalService';
import { adminService } from '../../../services/adminService';
import { Journal } from '../../../types';
import './JournalManagement.css';

interface JournalFormData {
  title: string;
  issn: string;
  category: string;
  description: string;
}

const initialFormData: JournalFormData = {
  title: '',
  issn: '',
  category: 'computer-science',
  description: '',
};

const JournalManagement: React.FC = () => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
  const [formData, setFormData] = useState<JournalFormData>(initialFormData);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchJournals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await journalService.getAllJournals(searchQuery, selectedCategory);
      setJournals(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取期刊列表失败');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJournals();
  };

  const handleAdd = () => {
    setEditingJournal(null);
    setFormData(initialFormData);
    setFormError(null);
    setShowModal(true);
  };

  const handleEdit = (journal: Journal) => {
    setEditingJournal(journal);
    setFormData({
      title: journal.title,
      issn: journal.issn,
      category: journal.category,
      description: journal.description,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleDelete = async (journal: Journal) => {
    if (!window.confirm(`确定要删除期刊 "${journal.title}" 吗？此操作将同时删除该期刊的所有评论。`)) {
      return;
    }

    try {
      await adminService.deleteJournal(journal.id);
      fetchJournals();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除期刊失败');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim() || !formData.issn.trim()) {
      setFormError('期刊名称和ISSN是必填项');
      return;
    }

    try {
      setSubmitting(true);
      if (editingJournal) {
        await adminService.updateJournal(editingJournal.id, formData);
      } else {
        await adminService.createJournal(formData);
      }
      setShowModal(false);
      fetchJournals();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingJournal(null);
    setFormData(initialFormData);
    setFormError(null);
  };

  return (
    <div className="journal-management">
      <div className="page-header">
        <h1 className="page-title">期刊管理</h1>
        <button className="add-button" onClick={handleAdd}>
          + 添加期刊
        </button>
      </div>

      <div className="filter-bar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            className="search-input"
            placeholder="搜索期刊名称或ISSN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">全部分类</option>
            {Object.entries(categoryMap).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
          <button type="submit" className="search-button">
            搜索
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>期刊名称</th>
                <th>ISSN</th>
                <th>分类</th>
                <th>评分</th>
                <th>评论数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {journals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-message">
                    暂无期刊数据
                  </td>
                </tr>
              ) : (
                journals.map((journal) => (
                  <tr key={journal.id}>
                    <td className="title-cell">{journal.title}</td>
                    <td>{journal.issn}</td>
                    <td>
                      <span className="category-badge">
                        {categoryMap[journal.category] || journal.category}
                      </span>
                    </td>
                    <td>
                      <span className="rating">
                        <span className="star">&#9733;</span>
                        {journal.rating.toFixed(1)}
                      </span>
                    </td>
                    <td>{journal.reviews?.length || 0}</td>
                    <td className="actions-cell">
                      <button
                        className="action-btn edit"
                        onClick={() => handleEdit(journal)}
                      >
                        编辑
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(journal)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingJournal ? '编辑期刊' : '添加期刊'}
              </h2>
              <button className="modal-close" onClick={handleCloseModal}>
                &#10005;
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="journal-form">
              {formError && <div className="form-error">{formError}</div>}

              <div className="form-group">
                <label className="form-label">期刊名称 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="请输入期刊名称"
                />
              </div>

              <div className="form-group">
                <label className="form-label">ISSN *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.issn}
                  onChange={(e) =>
                    setFormData({ ...formData, issn: e.target.value })
                  }
                  placeholder="请输入ISSN号"
                />
              </div>

              <div className="form-group">
                <label className="form-label">分类</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  {Object.entries(categoryMap).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">描述</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="请输入期刊描述"
                  rows={4}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCloseModal}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={submitting}
                >
                  {submitting ? '提交中...' : editingJournal ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalManagement;
