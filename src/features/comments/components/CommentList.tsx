import React, { useState, useEffect } from 'react';
import { getCommentsByJournalId } from '../../../services/commentService';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import type { Comment } from '../../../types';
import './CommentList.css';

interface CommentListProps {
  journalId: string;
}

const CommentList: React.FC<CommentListProps> = ({ journalId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating' | 'helpful'>('newest');

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCommentsByJournalId(journalId, sortBy);
      setComments(data);
    } catch (err: any) {
      console.error('Error loading comments:', err);
      setError('加载评论失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [journalId, sortBy]);

  return (
    <div className="comment-list">
      <div className="comment-list-header">
        <h3 className="comment-list-title">
          评论 ({comments.length})
        </h3>
        <div className="comment-list-sort">
          <label>排序：</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="comment-sort-select"
          >
            <option value="newest">最新</option>
            <option value="oldest">最早</option>
            <option value="rating">评分</option>
            <option value="helpful">最有用</option>
          </select>
        </div>
      </div>

      <div className="comment-list-form">
        <CommentForm
          journalId={journalId}
          onCommentAdded={loadComments}
        />
      </div>

      {loading ? (
        <div className="comment-list-loading">加载中...</div>
      ) : error ? (
        <div className="comment-list-error">{error}</div>
      ) : comments.length === 0 ? (
        <div className="comment-list-empty">
          还没有评论，快来发表第一条评论吧！
        </div>
      ) : (
        <div className="comment-list-items">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onCommentUpdated={loadComments}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentList;
