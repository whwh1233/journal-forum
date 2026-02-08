import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import CommentForm from './CommentForm';
import type { Comment } from '../../../types';
import './CommentItem.css';

interface CommentItemProps {
  comment: Comment;
  level?: number;
  onCommentUpdated: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  level = 0,
  onCommentUpdated
}) => {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthor = user && comment.userId === parseInt(user.id);
  const isAdmin = user?.role === 'admin';
  const canEdit = isAuthor && !comment.isDeleted;
  const canDelete = (isAuthor || isAdmin) && !comment.isDeleted;
  const canReply = level < 2 && !comment.isDeleted;

  const handleEdit = async () => {
    if (!editContent.trim()) {
      alert('评论内容不能为空');
      return;
    }

    setIsSubmitting(true);

    try {
      const { updateComment } = await import('../../../services/commentService');
      await updateComment(comment.id, editContent.trim());
      setIsEditing(false);
      onCommentUpdated();
    } catch (error: any) {
      console.error('Error updating comment:', error);
      alert(error.response?.data?.message || '更新评论失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这条评论吗？')) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { deleteComment } = await import('../../../services/commentService');
      await deleteComment(comment.id);
      onCommentUpdated();
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      alert(error.response?.data?.message || '删除评论失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className={`comment-item level-${level}`}>
      <div className="comment-header">
        <div className="comment-author">
          <span className="comment-author-name">{comment.userName}</span>
          {comment.rating && (
            <span className="comment-rating">
              {'★'.repeat(comment.rating)}
              {'☆'.repeat(5 - comment.rating)}
            </span>
          )}
        </div>
        <div className="comment-meta">
          <span className="comment-date">{formatDate(comment.createdAt)}</span>
          {comment.updatedAt && (
            <span className="comment-edited">(已编辑)</span>
          )}
        </div>
      </div>

      <div className="comment-content">
        {isEditing ? (
          <div className="comment-edit">
            <textarea
              className="comment-edit-textarea"
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
            <div className="comment-edit-actions">
              <button
                className="comment-btn comment-btn-cancel"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                className="comment-btn comment-btn-submit"
                onClick={handleEdit}
                disabled={isSubmitting}
              >
                {isSubmitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        ) : (
          <p className={comment.isDeleted ? 'comment-deleted' : ''}>
            {comment.content}
          </p>
        )}
      </div>

      {!comment.isDeleted && (
        <div className="comment-actions">
          {canReply && (
            <button
              className="comment-action-btn"
              onClick={() => setIsReplying(!isReplying)}
            >
              回复
            </button>
          )}
          {canEdit && (
            <button
              className="comment-action-btn"
              onClick={() => setIsEditing(!isEditing)}
            >
              编辑
            </button>
          )}
          {canDelete && (
            <button
              className="comment-action-btn comment-action-delete"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              删除
            </button>
          )}
        </div>
      )}

      {isReplying && (
        <div className="comment-reply-form">
          <CommentForm
            journalId={comment.journalId}
            parentId={comment.id}
            onCommentAdded={() => {
              setIsReplying(false);
              onCommentUpdated();
            }}
            onCancel={() => setIsReplying(false)}
            isReply={true}
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              level={level + 1}
              onCommentUpdated={onCommentUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
