import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { followUser, unfollowUser, checkFollow } from '../../../services/followService';
import './FollowButton.css';

interface FollowButtonProps {
  userId: string | number;
  onFollowChange?: (isFollowing: boolean) => void;
}

const FollowButton: React.FC<FollowButtonProps> = ({ userId, onFollowChange }) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  // 不显示关注自己的按钮
  if (user && String(user.id) === String(userId)) {
    return null;
  }

  useEffect(() => {
    const checkStatus = async () => {
      if (user) {
        const status = await checkFollow(userId);
        setIsFollowing(status);
      }
    };
    checkStatus();
  }, [userId, user]);

  const handleToggleFollow = async () => {
    if (!user) {
      alert('请先登录');
      return;
    }

    setLoading(true);

    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await followUser(userId);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <button
      className={`follow-btn ${isFollowing ? 'following' : ''}`}
      onClick={handleToggleFollow}
      disabled={loading}
    >
      {isFollowing ? '已关注' : '关注'}
    </button>
  );
};

export default FollowButton;
