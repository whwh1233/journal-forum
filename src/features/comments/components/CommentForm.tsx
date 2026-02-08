import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import './CommentForm.css';

interface CommentFormProps {
  journalId: number;
  parentId?: string | null;
  onCommentAdded: () => void;
  onCancel?: () => void;
  isReply?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({
  journalId,
  parentId = null,
  onCommentAdded,
  onCancel,
  isReply = false
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('请输入评论内容');
      return;
    }

    if (!user) {
      alert('请先登录');
      return;
    }

    setIsSubmitting(true);

    try {
      const { createComment } = await import('../../../services/commentService');

      await createComment({
        journalId,
        parentId,
        content: content.trim(),
        rating: parentId ? undefined : rating
      });

      setContent('');
      setRating(5);
      onCommentAdded();

      if (onCancel) {
        onCancel();
      }
    } catch (error: any) {
      console.error('Error creating comment:', error);
      alert(error.response?.data?.message || '发表评论失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="comment-form-login-prompt">
        请先登录后发表{isReply ? '回复' : '评论'}
      </div>
    );
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      {!parentId && (
        <div className="comment-form-rating">
          <label>评分：</label>
          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map(star => (
              <span
                key={star}
                className={`star ${star <= rating ? 'filled' : ''}`}
                onClick={() => setRating(star)}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      )}

      <textarea
        className="comment-form-textarea"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={isReply ? '写下你的回复...' : '写下你的评论...'}
        rows={isReply ? 3 : 4}
        disabled={isSubmitting}
      />

      <div className="comment-form-actions">
        {onCancel && (
          <button
            type="button"
            className="comment-form-btn comment-form-btn-cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            取消
          </button>
        )}
        <button
          type="submit"
          className="comment-form-btn comment-form-btn-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? '发布中...' : isReply ? '回复' : '发表评论'}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;
