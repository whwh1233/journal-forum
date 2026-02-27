import React from 'react';
import './StarRating.css';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'medium',
  showText = false
}) => {
  // 防御性检查：确保 rating 是有效数字
  const safeRating = typeof rating === 'number' && !isNaN(rating) ? Math.max(0, Math.min(rating, maxRating)) : 0;

  const fullStars = Math.floor(safeRating);
  const hasHalfStar = safeRating % 1 >= 0.5;
  const emptyStars = Math.max(0, maxRating - fullStars - (hasHalfStar ? 1 : 0));

  const getStarClass = () => {
    switch (size) {
      case 'small':
        return 'star-rating--small';
      case 'large':
        return 'star-rating--large';
      default:
        return 'star-rating--medium';
    }
  };

  return (
    <div className={`star-rating ${getStarClass()}`}>
      {[...Array(fullStars)].map((_, i) => (
        <span key={i} className="star-rating__star star-rating__star--full">
          ★
        </span>
      ))}
      {hasHalfStar && (
        <span className="star-rating__star star-rating__star--half">
          ☆
        </span>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={i + fullStars + (hasHalfStar ? 1 : 0)} className="star-rating__star star-rating__star--empty">
          ☆
        </span>
      ))}
      {showText && (
        <span className="star-rating__text">
          {safeRating.toFixed(1)}/{maxRating}
        </span>
      )}
    </div>
  );
};

export default StarRating;