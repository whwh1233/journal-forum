import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PostDetail from '../components/PostDetail';
import PostCommentList from '../components/PostCommentList';
import { postService } from '../services/postService';
import { Post } from '../types/post';
import './PostDetailPage.css';

const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const postData = await postService.getPostById(parseInt(id));
        setPost(postData);

        // Increment view count
        postService.incrementView(parseInt(id));
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleLike = async () => {
    if (!post) return;
    try {
      const result = await postService.toggleLike(post.id);
      setPost({ ...post, userLiked: result.liked, likeCount: result.likeCount });
    } catch (err) {
      console.error('点赞失败:', err);
      alert('操作失败，请先登录');
    }
  };

  const handleFavorite = async () => {
    if (!post) return;
    try {
      const result = await postService.toggleFavorite(post.id);
      setPost({ ...post, userFavorited: result.favorited, favoriteCount: result.favoriteCount });
    } catch (err) {
      console.error('收藏失败:', err);
      alert('操作失败，请先登录');
    }
  };

  const handleFollow = async () => {
    if (!post) return;
    try {
      const result = await postService.toggleFollow(post.id);
      setPost({ ...post, userFollowed: result.followed, followCount: result.followCount });
    } catch (err) {
      console.error('关注失败:', err);
      alert('操作失败，请先登录');
    }
  };

  const handleReport = async () => {
    if (!post) return;
    const reason = prompt('请输入举报原因：');
    if (!reason || !reason.trim()) return;

    try {
      await postService.reportPost(post.id, reason);
      alert('举报已提交，我们会尽快处理');
    } catch (err) {
      console.error('举报失败:', err);
      alert('举报失败，请稍后重试');
    }
  };

  const handleBack = () => {
    navigate('/community');
  };

  if (loading) {
    return (
      <div className="post-detail-page">
        <div className="post-detail-page-container">
          <div className="post-detail-page-loading">加载中...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-detail-page">
        <div className="post-detail-page-container">
          <div className="post-detail-page-error">
            <p>{error || '帖子不存在'}</p>
            <button onClick={handleBack} className="post-detail-page-back-button">
              返回社区
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="post-detail-page">
      <div className="post-detail-page-container">
        {/* Back Button */}
        <button onClick={handleBack} className="post-detail-page-back">
          <ArrowLeft size={20} />
          <span>返回社区</span>
        </button>

        {/* Post Detail */}
        <PostDetail
          post={post}
          onLike={handleLike}
          onFavorite={handleFavorite}
          onFollow={handleFollow}
          onReport={handleReport}
        />

        {/* Comments Section */}
        <div className="post-detail-page-comments">
          <PostCommentList postId={post.id} />
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
