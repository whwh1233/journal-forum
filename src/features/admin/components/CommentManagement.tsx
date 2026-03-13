import React, { useEffect, useState, useCallback } from 'react';
import { adminService } from '../../../services/adminService';
import { AdminComment, PaginationInfo } from '../../../types';
import { Star } from 'lucide-react';
import { usePageTitle } from '@/contexts/PageContext';
import './CommentManagement.css';

const CommentManagement: React.FC = () => {
  usePageTitle('评论管理');

  const [comments, setComments] = useState<AdminComment[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getComments(searchQuery, currentPage);
      setComments(data.comments);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取评论列表失败');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchComments();
  };

  const handleDelete = async (comment: AdminComment) => {
    if (!window.confirm('确定要删除这条评论吗？')) {
      return;
    }

    try {
      await adminService.deleteComment(comment.id);
      fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除评论失败');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="comment-management">
      <div className="page-wrapper">
        <div className="search-bar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            className="search-input"
            placeholder="搜索评论内容、作者或期刊..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-button">
            搜索
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <>
          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="empty-message">暂无评论数据</div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="comment-card">
                  <div className="comment-header">
                    <div className="comment-meta">
                      <span className="comment-author">{comment.author}</span>
                      <span className="comment-divider">|</span>
                      <span className="comment-journal">{truncateText(comment.journalName, 30)}</span>
                      <span className="comment-rating">
                        <Star size={14} fill="currentColor" className="star" />
                        {comment.rating}
                      </span>
                    </div>
                    <span className="comment-date">{formatDate(comment.createdAt)}</span>
                  </div>
                  <div className="comment-content">{comment.content}</div>
                  <div className="comment-actions">
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(comment)}
                    >
                      删除评论
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                上一页
              </button>
              <span className="pagination-info">
                第 {pagination.currentPage} / {pagination.totalPages} 页
              </span>
              <button
                className="pagination-btn"
                disabled={currentPage === pagination.totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
      </div>  
    </div> 
  );
};

export default CommentManagement;
