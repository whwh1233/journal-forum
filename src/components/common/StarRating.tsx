import React, { useId } from 'react';
import './StarRating.css';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

const STAR_PATH = 'M12 1.5c.35 0 .67.18.85.48l2.67 5.41 5.97.87c.33.05.6.27.73.58.13.31.06.66-.17.9l-4.32 4.21 1.02 5.95c.06.33-.08.66-.35.86a.99.99 0 01-.93.07L12 18.26l-5.34 2.81a.99.99 0 01-.93-.07 1.01 1.01 0 01-.35-.86l1.02-5.95-4.32-4.21a1.01 1.01 0 01-.17-.9c.13-.31.4-.53.73-.58l5.97-.87 2.67-5.41c.18-.3.5-.48.85-.48z';

const sizeMap = { small: 15, medium: 20, large: 24 };

const Star: React.FC<{ fill: number; pixelSize: number; id: string }> = ({ fill, pixelSize, id }) => {
  const pct = Math.round(fill * 100);
  const softEdge = Math.min(pct + 2, 100);

  return (
    <svg width={pixelSize} height={pixelSize} viewBox="0 0 24 24" className="star-rating__svg">
      <defs>
        <linearGradient id={id}>
          <stop offset={`${pct}%`} stopColor="var(--star-fill)" />
          <stop offset={`${softEdge}%`} stopColor="var(--star-empty)" />
        </linearGradient>
      </defs>
      <path
        d={STAR_PATH}
        fill={`url(#${id})`}
        stroke="var(--star-fill)"
        strokeWidth="0.4"
        strokeOpacity="0.2"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'medium',
  showText = false
}) => {
  const baseId = useId();
  const safeRating = typeof rating === 'number' && !isNaN(rating) ? Math.max(0, Math.min(rating, maxRating)) : 0;
  const pixelSize = sizeMap[size];

  return (
    <div className={`star-rating star-rating--${size}`}>
      <span className="star-rating__stars">
        {Array.from({ length: maxRating }, (_, i) => {
          const fill = Math.min(1, Math.max(0, safeRating - i));
          return <Star key={i} fill={fill} pixelSize={pixelSize} id={`${baseId}-s${i}`} />;
        })}
      </span>
      {showText && (
        <span className="star-rating__text">
          {safeRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
