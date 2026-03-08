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

  const handleCancel = () => {
    if (window.confirm('确定要放弃发布吗？未保存的内容将会丢失。')) {
      navigate('/community');
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
