import React, { useEffect, useState, useCallback } from 'react';
import { journalService } from '../../../services/journalService';
import { adminService } from '../../../services/adminService';
import { Journal } from '../../../types';
import { Star, X } from 'lucide-react';
import { usePageTitle } from '@/contexts/PageContext';
import './JournalManagement.css';

interface JournalFormData {
  name: string;
  issn: string;
  level: string;
  introduction: string;
}

const initialFormData: JournalFormData = {
  name: '',
  issn: '',
  level: '',
  introduction: '',
};

const JournalManagement: React.FC = () => {
  usePageTitle('期刊管理');

  const [journals, setJournals] = useState<Journal[]>([]);
  const [levelOptions, setLevelOptions] = useState<{ name: string, count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
  const [formData, setFormData] = useState<JournalFormData>(initialFormData);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchJournals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await journalService.getAllJournals(searchQuery, selectedLevel);
      setJournals(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取期刊列表失败');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedLevel]);

  const loadLevels = useCallback(async () => {
    try {
      const levels = await journalService.getLevelOptions();
      setLevelOptions(levels);
    } catch (error) {
      console.error('Failed to load journal levels:', error);
    }
  }, []);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

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
      name: journal.name,
      issn: journal.issn,
      level: journal.levels && journal.levels.length > 0 ? journal.levels[0] : '',
      introduction: journal.introduction || '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleDelete = async (journal: Journal) => {
    if (!window.confirm(`确定要删除期刊 "${journal.name}" 吗？此操作将同时删除该期刊的所有评论。`)) {
      return;
    }

    if (!journal.journalId) return;
    const journalIdStr = journal.journalId as string;

    try {
      await adminService.deleteJournal(journalIdStr); // adminService may still expect number id? we cast until fixed
      fetchJournals();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除期刊失败');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.issn.trim()) {
      setFormError('期刊名称和ISSN是必填项');
      return;
    }

    // Adapt formData back to what adminService expects or to the new schema
    const submitData = {
      ...formData,
      levels: formData.level ? [formData.level] : [],
      title: formData.name, // in case old api 
      category: formData.level, // in case old api
      description: formData.introduction // in case old api
    };

    try {
      setSubmitting(true);
      if (editingJournal) {
        await adminService.updateJournal(editingJournal.journalId as string, submitData as any);
      } else {
        await adminService.createJournal(submitData as any);
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
      <div className="page-wrapper">
        <div className="journal-management-header">
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
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              <option value="">全部等级</option>
              {levelOptions.map((level) => (
                <option key={level.name} value={level.name}>
                  {level.name}
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
                  <th>等级</th>
                  <th>评分</th>
                  <th>文章数</th>
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
                    <tr key={journal.journalId}>
                      <td className="title-cell">{journal.name}</td>
                      <td>{journal.issn}</td>
                      <td>
                        <span className="category-badge">
                          {journal.levels && journal.levels.length > 0 ? journal.levels.join(', ') : '未定级'}
                        </span>
                      </td>
                      <td>
                        <span className="rating">
                          <Star size={14} fill="currentColor" className="star" />
                          {(journal.ratingCache?.rating || 0).toFixed(1)}
                        </span>
                      </td>
                      <td>{journal.articleCount || 0}</td>
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
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="journal-form">
                {formError && <div className="form-error">{formError}</div>}

                <div className="form-group">
                  <label className="form-label">期刊名称 *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
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
                  <label className="form-label">等级</label>
                  <select
                    className="form-select"
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({ ...formData, level: e.target.value })
                    }
                  >
                    <option value="">选择等级</option>
                    {levelOptions.map((level) => (
                      <option key={level.name} value={level.name}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">介绍</label>
                  <textarea
                    className="form-textarea"
                    value={formData.introduction}
                    onChange={(e) =>
                      setFormData({ ...formData, introduction: e.target.value })
                    }
                    placeholder="请输入期刊介绍"
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
    </div>
  );
};

export default JournalManagement;
