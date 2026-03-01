import React from 'react';
import { DIMENSION_KEYS, DIMENSION_LABELS } from '../../../types';
import type { DimensionRatings } from '../../../types';
import './DimensionRatingInput.css';

interface DimensionRatingInputProps {
    value: DimensionRatings;
    onChange: (ratings: DimensionRatings) => void;
}

const DimensionRatingInput: React.FC<DimensionRatingInputProps> = ({ value, onChange }) => {
    const handleDimensionChange = (key: string, score: number) => {
        onChange({ ...value, [key]: score });
    };

    return (
        <div className="dimension-rating-input">
            <div className="dimension-rating-input__title">多维评价</div>
            {DIMENSION_KEYS.map(key => (
                <div key={key} className="dimension-rating-input__row">
                    <span className="dimension-rating-input__label">
                        {DIMENSION_LABELS[key]}
                    </span>
                    <div className="dimension-rating-input__stars">
                        {[1, 2, 3, 4, 5].map(star => (
                            <span
                                key={star}
                                className={`dimension-star ${star <= (value[key] || 0) ? 'filled' : ''}`}
                                onClick={() => handleDimensionChange(key, star)}
                                role="button"
                                aria-label={`${DIMENSION_LABELS[key]} ${star}分`}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                    <span className="dimension-rating-input__score">
                        {value[key] ? `${value[key]}分` : '—'}
                    </span>
                </div>
            ))}
            <div className="dimension-rating-input__hint">
                * 综合体验为必填，其他维度可选填
            </div>
        </div>
    );
};

export default DimensionRatingInput;
