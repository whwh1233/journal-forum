import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import PostCommentForm from './PostCommentForm';
import FollowButton from '../../follow/components/FollowButton';
import { BadgeList } from '../../badges';
import { postService } from '../services/postService';
import type { PostComment } from '../types/post';
import { MarkdownContent } from '../../../components/MarkdownEditor';
import './PostComment.css';

interface PostCommentItemProps {
  comment: PostComment;
  level?: number;
  onCommentUpdated: () => void;
}

const PostCommentItem: React.FC<PostCommentItemProps> = ({
  comment,
  level = 0,
  onCommentUpdated
}) => {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [localLiked, setLocalLiked] = useState(comment.userLiked || false);
  const [localLikeCount, setLocalLikeCount] = useState(comment.likeCount || 0);

  const isAuthor = user && String(comment.userId) === String(user.id);
  const isAdmin = user?.role === 'admin';
  const canDelete = (isAuthor || isAdmin) && !comment.isDeleted;
  const canReply = level < 2 && !comment.isDeleted;

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这条评论吗？')) {
      return;
    }

    setIsSubmitting(true);

    try {
      await postService.deleteComment(comment.id);
      onCommentUpdated();
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      alert(error.message || '删除评论失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async () => {
    if (!user || isLiking) return;

    setIsLiking(true);
    try {
      const result = await postService.toggleCommentLike(comment.id);
      setLocalLiked(result.liked);
      setLocalLikeCount(result.likeCount);
    } catch (err) {
      console.error('Like failed:', err);
    } finally {
      setIsLiking(false);
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
    <div className={`post-comment-item level-${level}`}>
      <div className="post-comment-header">
        <div className="post-comment-author">
          <Link to={`/profile/${comment.userId}`} className="post-comment-author-name">
            {comment.userName}
          </Link>
          {user && String(comment.userId) !== String(user.id) && (
            <div className="post-comment-follow-btn-wrapper">
              <FollowButton userId={comment.userId} />
            </div>
          )}
        </div>
        <div className="post-comment-meta">
          <span className="post-comment-date">{formatDate(comment.createdAt)}</span>
          {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
            <span className="post-comment-edited">(已编辑)</span>
          )}
        </div>
      </div>

      <div className="post-comment-content">
        {comment.isDeleted ? (
          <p className="post-comment-deleted">{comment.content}</p>
        ) : (
          <MarkdownContent content={comment.content} />
        )}
      </div>

      {!comment.isDeleted && (
        <div className="post-comment-actions">
          <button
            className={`post-comment-action-btn post-comment-helpful-btn ${localLiked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={!user || isLiking}
            title={localLiked ? '取消有用标记' : '标记为有用'}
          >
            <ThumbsUp size={14} />
            {localLikeCount > 0 && <span>{localLikeCount}</span>}
          </button>
          {canReply && (
            <button
              className="post-comment-action-btn"
              onClick={() => setIsReplying(!isReplying)}
            >
              回复
            </button>
          )}
          {canDelete && (
            <button
              className="post-comment-action-btn post-comment-action-delete"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              删除
            </button>
          )}
        </div>
      )}

      {isReplying && (
        <div className="post-comment-reply-form">
          <PostCommentForm
            postId={comment.postId}
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
        <div className="post-comment-replies">
          {comment.replies.map(reply => (
            <PostCommentItem
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

export default PostCommentItem;
