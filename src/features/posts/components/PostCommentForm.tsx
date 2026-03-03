import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import './PostCommentForm.css';

interface PostCommentFormProps {
  postId: number;
  parentId?: number | null;
  onCommentAdded: () => void;
  onCancel?: () => void;
  isReply?: boolean;
}

const PostCommentForm: React.FC<PostCommentFormProps> = ({
  postId,
  parentId = null,
  onCommentAdded,
  onCancel,
  isReply = false
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
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
      const { postService } = await import('../services/postService');

      await postService.createComment(postId, {
        content: content.trim(),
        parentId: parentId || undefined
      });

      setContent('');
      onCommentAdded();

      if (onCancel) {
        onCancel();
      }
    } catch (error: any) {
      console.error('Error creating comment:', error);
      alert(error.message || '发表评论失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="post-comment-form-login-prompt">
        请先登录后发表{isReply ? '回复' : '评论'}
      </div>
    );
  }

  return (
    <form className="post-comment-form" onSubmit={handleSubmit}>
      <textarea
        className="post-comment-form-textarea"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={isReply ? '写下你的回复...' : '写下你的评论...'}
        rows={isReply ? 3 : 4}
        disabled={isSubmitting}
      />

      <div className="post-comment-form-actions">
        {onCancel && (
          <button
            type="button"
            className="post-comment-form-btn post-comment-form-btn-cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            取消
          </button>
        )}
        <button
          type="submit"
          className="post-comment-form-btn post-comment-form-btn-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? '发布中...' : isReply ? '回复' : '发表评论'}
        </button>
      </div>
    </form>
  );
};

export default PostCommentForm;
