import React, { useState, useEffect } from 'react';
import { X, Search, GitMerge, AlertTriangle } from 'lucide-react';
import { tagService } from '../../../services/tagService';
import type { TagInfo } from '../../posts/types/post';

interface TagMergeModalProps {
  sourceTag: TagInfo;
  onClose: () => void;
  onMerged: () => void;
}

const TagMergeModal: React.FC<TagMergeModalProps> = ({ sourceTag, onClose, onMerged }) => {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<TagInfo[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<TagInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (search.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await tagService.adminGetTags({ search: search.trim(), status: 'approved', limit: 10 });
        setSearchResults(data.tags.filter(t => t.id !== sourceTag.id));
      } catch {
        // ignore search errors
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, sourceTag.id]);

  const handleMerge = async () => {
    if (!selectedTarget) return;
    try {
      setMerging(true);
      setError('');
      await tagService.adminMergeTags(sourceTag.id, selectedTarget.id);
      onMerged();
    } catch (err: any) {
      setError(err.message || '合并失败');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="tag-mgmt__modal-overlay" onClick={onClose}>
      <div className="tag-mgmt__modal" onClick={e => e.stopPropagation()}>
        <div className="tag-mgmt__modal-header">
          <h3><GitMerge size={20} /> 合并标签</h3>
          <button className="tag-mgmt__modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="tag-mgmt__modal-body">
          {error && (
            <div className="tag-mgmt__error">
              <AlertTriangle size={16} />
              {error}
              <button onClick={() => setError('')}>&times;</button>
            </div>
          )}

          <div className="tag-mgmt__merge-info">
            <div className="tag-mgmt__merge-source">
              <span className="tag-mgmt__merge-label">源标签</span>
              <span className="tag-mgmt__merge-tag-name">{sourceTag.name}</span>
              <span className="tag-mgmt__merge-count">{sourceTag.postCount || 0} 篇帖子</span>
            </div>

            <div className="tag-mgmt__merge-arrow">
              <GitMerge size={24} />
            </div>

            <div className="tag-mgmt__merge-target">
              <span className="tag-mgmt__merge-label">目标标签</span>
              {selectedTarget ? (
                <>
                  <span className="tag-mgmt__merge-tag-name">{selectedTarget.name}</span>
                  <span className="tag-mgmt__merge-count">{selectedTarget.postCount || 0} 篇帖子</span>
                  <button
                    className="tag-mgmt__merge-clear"
                    onClick={() => setSelectedTarget(null)}
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <span className="tag-mgmt__merge-placeholder">请搜索选择目标标签</span>
              )}
            </div>
          </div>

          {!selectedTarget && (
            <div className="tag-mgmt__merge-search">
              <div className="tag-mgmt__search-input-wrapper">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="搜索目标标签..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
              {loading && <div className="tag-mgmt__search-loading">搜索中...</div>}
              {searchResults.length > 0 && (
                <div className="tag-mgmt__search-results">
                  {searchResults.map(tag => (
                    <button
                      key={tag.id}
                      className="tag-mgmt__search-result-item"
                      onClick={() => { setSelectedTarget(tag); setSearch(''); setSearchResults([]); }}
                    >
                      <span>{tag.name}</span>
                      <span className="tag-mgmt__search-result-count">{tag.postCount || 0} 篇</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTarget && (
            <div className="tag-mgmt__merge-summary">
              <AlertTriangle size={16} />
              <span>
                将把 <strong>"{sourceTag.name}"</strong> 的 {sourceTag.postCount || 0} 篇帖子迁移到 <strong>"{selectedTarget.name}"</strong>，源标签将被删除。此操作不可撤销。
              </span>
            </div>
          )}
        </div>

        <div className="tag-mgmt__modal-footer">
          <button className="tag-mgmt__btn tag-mgmt__btn--cancel" onClick={onClose}>
            取消
          </button>
          <button
            className="tag-mgmt__btn tag-mgmt__btn--danger"
            onClick={handleMerge}
            disabled={!selectedTarget || merging}
          >
            <GitMerge size={16} />
            {merging ? '合并中...' : '确认合并'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagMergeModal;
