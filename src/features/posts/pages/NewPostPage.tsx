import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PostForm from '../components/PostForm';
import { postService } from '../services/postService';
import { usePageTitle } from '@/contexts/PageContext';
import { CreatePostData } from '../types/post';
import './NewPostPage.css';

const NewPostPage: React.FC = () => {
  usePageTitle('发布帖子');
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = () => navigate('/community');
  const handleDismissCancel = () => setShowCancelConfirm(false);

  const handleSubmit = async (data: CreatePostData) => {
    try {
      setSubmitting(true);
      setError(null);
      const post = await postService.createPost(data);

      // Navigate to post detail page
      navigate(`/posts/${post.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败');
      setSubmitting(false);
    }
  };

  return (
    <div className="new-post-page">
      <div className="new-post-page-container">
        {error && (
          <div className="new-post-page-error">
            <p>{error}</p>
            <button onClick={() => setError(null)}>关闭</button>
          </div>
        )}

        {showCancelConfirm && (
          <div className="new-post-cancel-confirm">
            <span className="new-post-cancel-confirm__text">
              确定放弃发布吗？未保存的内容将会丢失。
            </span>
            <div className="new-post-cancel-confirm__actions">
              <button
                className="new-post-cancel-confirm__btn new-post-cancel-confirm__btn--secondary"
                onClick={handleDismissCancel}
              >
                继续编辑
              </button>
              <button
                className="new-post-cancel-confirm__btn new-post-cancel-confirm__btn--danger"
                onClick={handleConfirmCancel}
              >
                放弃并离开
              </button>
            </div>
          </div>
        )}

        <PostForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />

        {submitting && (
          <div className="new-post-page-submitting">
            <div className="new-post-page-spinner"></div>
            <p>正在发布...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewPostPage;
