import React, { useState, useId } from 'react';
import { DIMENSION_KEYS, DIMENSION_LABELS } from '../../../types';
import type { DimensionRatings } from '../../../types';
import './DimensionRatingInput.css';

interface DimensionRatingInputProps {
    value: DimensionRatings;
    onChange: (ratings: DimensionRatings) => void;
}

const STAR_PATH = 'M12 1.5c.35 0 .67.18.85.48l2.67 5.41 5.97.87c.33.05.6.27.73.58.13.31.06.66-.17.9l-4.32 4.21 1.02 5.95c.06.33-.08.66-.35.86a.99.99 0 01-.93.07L12 18.26l-5.34 2.81a.99.99 0 01-.93-.07 1.01 1.01 0 01-.35-.86l1.02-5.95-4.32-4.21a1.01 1.01 0 01-.17-.9c.13-.31.4-.53.73-.58l5.97-.87 2.67-5.41c.18-.3.5-.48.85-.48z';

const InputStar: React.FC<{
    filled: boolean;
    hovered: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    label: string;
    id: string;
}> = ({ filled, hovered, onClick, onMouseEnter, label, id }) => {
    const active = filled || hovered;
    return (
        <span
            className={`dim-input-star ${active ? 'active' : ''} ${hovered && !filled ? 'preview' : ''}`}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            role="button"
            tabIndex={0}
            aria-label={label}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
        >
            <svg width="24" height="24" viewBox="0 0 24 24">
                <defs>
                    <linearGradient id={id}>
                        <stop offset="100%" stopColor={active ? 'var(--star-fill)' : 'var(--star-empty)'} />
                    </linearGradient>
                </defs>
                <path
                    d={STAR_PATH}
                    fill={`url(#${id})`}
                    stroke="var(--star-fill)"
                    strokeWidth={active ? '0.6' : '0.4'}
                    strokeOpacity={active ? '0.4' : '0.15'}
                    strokeLinejoin="round"
                />
            </svg>
        </span>
    );
};

const DimensionRatingInput: React.FC<DimensionRatingInputProps> = ({ value, onChange }) => {
    const baseId = useId();
    const [hoverState, setHoverState] = useState<{ key: string; star: number } | null>(null);

    const handleDimensionChange = (key: keyof DimensionRatings, score: number) => {
        // 点击已选中的分数则取消
        const newScore = value[key] === score ? 0 : score;
        onChange({ ...value, [key]: newScore });
    };

    return (
        <div className="dim-input" onMouseLeave={() => setHoverState(null)}>
            <div className="dim-input__title">多维评价</div>
            {DIMENSION_KEYS.map(key => {
                const currentScore = value[key] || 0;
                const hoverScore = hoverState?.key === key ? hoverState.star : 0;

                return (
                    <div key={key} className="dim-input__row">
                        <span className="dim-input__label">
                            {DIMENSION_LABELS[key]}
                        </span>
                        <div className="dim-input__stars">
                            {[1, 2, 3, 4, 5].map(star => (
                                <InputStar
                                    key={star}
                                    filled={star <= currentScore}
                                    hovered={hoverScore > 0 && star <= hoverScore}
                                    onClick={() => handleDimensionChange(key, star)}
                                    onMouseEnter={() => setHoverState({ key, star })}
                                    label={`${DIMENSION_LABELS[key]} ${star}分`}
                                    id={`${baseId}-${key}-${star}`}
                                />
                            ))}
                        </div>
                        <span className="dim-input__score">
                            {currentScore ? `${currentScore}分` : '—'}
                        </span>
                    </div>
                );
            })}
            <div className="dim-input__hint">
                * 综合体验为必填，其他维度可选填
            </div>
        </div>
    );
};

export default DimensionRatingInput;
