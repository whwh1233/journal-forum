import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import DimensionRatingInput from './DimensionRatingInput';
import type { DimensionRatings } from '../../../types';
import './CommentForm.css';

interface CommentFormProps {
  journalId: string;
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
  const [dimensionRatings, setDimensionRatings] = useState<DimensionRatings>({});
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

    // 顶级评论需要综合体验评分
    if (!parentId && !dimensionRatings.overallExperience) {
      alert('请至少填写综合体验评分');
      return;
    }

    setIsSubmitting(true);

    try {
      const { createComment } = await import('../../../services/commentService');

      await createComment({
        journalId,
        parentId,
        content: content.trim(),
        dimensionRatings: parentId ? undefined : dimensionRatings
      });

      setContent('');
      setDimensionRatings({});
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
        <DimensionRatingInput
          value={dimensionRatings}
          onChange={setDimensionRatings}
        />
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

