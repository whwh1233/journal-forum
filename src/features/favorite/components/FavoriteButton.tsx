import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { addFavorite, removeFavorite } from '../../../services/favoriteService';
import { Bookmark } from 'lucide-react';
import './FavoriteButton.css';

interface FavoriteButtonProps {
  journalId: string;
  showText?: boolean;
  initialFavorited?: boolean;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ journalId, showText = true, initialFavorited = false }) => {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      alert('请先登录');
      return;
    }

    setLoading(true);

    try {
      if (isFavorited) {
        await removeFavorite(journalId);
        setIsFavorited(false);
      } else {
        await addFavorite(journalId);
        setIsFavorited(true);
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
      className={`favorite-btn ${isFavorited ? 'favorited' : ''} ${!showText ? 'icon-only' : ''}`}
      onClick={handleToggleFavorite}
      disabled={loading}
      title={isFavorited ? '取消收藏' : '收藏'}
    >
      <Bookmark
        className={`favorite-icon-svg ${isFavorited ? 'fill-current' : ''}`}
        size={showText ? 18 : 20}
        fill={isFavorited ? "currentColor" : "none"}
      />
      {showText && <span className="favorite-text">{isFavorited ? '已收藏' : '收藏'}</span>}
    </button>
  );
};

export default FavoriteButton;
