import React, { useState, useEffect } from 'react';
import { postService } from '../services/postService';
import PostCommentForm from './PostCommentForm';
import PostCommentItem from './PostCommentItem';
import type { PostComment } from '../types/post';
import './PostCommentList.css';

interface PostCommentListProps {
  postId: number;
}

const PostCommentList: React.FC<PostCommentListProps> = ({ postId }) => {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'helpful'>('newest');

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await postService.getComments(postId);

      // Sort comments based on sortBy
      let sortedData = [...data];
      if (sortBy === 'newest') {
        sortedData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sortBy === 'oldest') {
        sortedData.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else if (sortBy === 'helpful') {
        sortedData.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
      }

      setComments(sortedData);
    } catch (err: any) {
      console.error('Error loading comments:', err);
      setError('加载评论失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId, sortBy]);

  return (
    <div className="post-comment-list">
      <div className="post-comment-list-header">
        <h3 className="post-comment-list-title">
          评论 ({comments.length})
        </h3>
        <div className="post-comment-list-sort">
          <label>排序：</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="post-comment-sort-select"
          >
            <option value="newest">最新</option>
            <option value="oldest">最早</option>
            <option value="helpful">最有用</option>
          </select>
        </div>
      </div>

      <div className="post-comment-list-form">
        <PostCommentForm
          postId={postId}
          onCommentAdded={loadComments}
        />
      </div>

      {loading ? (
        <div className="post-comment-list-loading">加载中...</div>
      ) : error ? (
        <div className="post-comment-list-error">{error}</div>
      ) : comments.length === 0 ? (
        <div className="post-comment-list-empty">
          还没有评论，快来发表第一条评论吧！
        </div>
      ) : (
        <div className="post-comment-list-items">
          {comments.map(comment => (
            <PostCommentItem
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

export default PostCommentList;
