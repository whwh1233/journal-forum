import React, { useState } from 'react';
import { DIMENSION_KEYS, DIMENSION_LABELS } from '../../../types';
import type { DimensionRatings } from '../../../types';
import StarRating from '@/components/common/StarRating';
import './DimensionRatingDisplay.css';

interface DimensionRatingDisplayProps {
    dimensionRatings?: DimensionRatings | null;
    mode?: 'compact' | 'summary';
    ratingCount?: number;
}

const DimensionRatingDisplay: React.FC<DimensionRatingDisplayProps> = ({
    dimensionRatings,
    mode = 'compact',
    ratingCount
}) => {
    const [expanded, setExpanded] = useState(false);

    if (!dimensionRatings) return null;

    const hasData = DIMENSION_KEYS.some(key => dimensionRatings[key] !== undefined && dimensionRatings[key] !== null);
    if (!hasData) return null;

    if (mode === 'compact') {
        return (
            <div className="dim-display dim-display--compact">
                <button
                    className="dim-display__toggle"
                    onClick={() => setExpanded(!expanded)}
                    aria-expanded={expanded}
                >
                    <span className="dim-display__toggle-icon">{expanded ? '▾' : '▸'}</span>
                    <span className="dim-display__toggle-text">多维评分</span>
                </button>
                {expanded && (
                    <div className="dim-display__grid">
                        {DIMENSION_KEYS.map(key => {
                            const val = dimensionRatings[key];
                            if (val === undefined || val === null) return null;
                            return (
                                <div key={key} className="dim-display__item">
                                    <span className="dim-display__item-label">{DIMENSION_LABELS[key]}</span>
                                    <StarRating rating={val} size="small" />
                                    <span className="dim-display__item-val">{val}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // summary mode — 用于期刊详情面板
    return (
        <div className="dim-display dim-display--summary">
            <div className="dim-display__summary-header">
                <span className="dim-display__summary-title">多维评分</span>
                {ratingCount !== undefined && (
                    <span className="dim-display__summary-count">{ratingCount} 人评价</span>
                )}
            </div>
            <div className="dim-display__grid">
                {DIMENSION_KEYS.map(key => {
                    const val = dimensionRatings[key];
                    if (val === undefined || val === null) return null;
                    return (
                        <div key={key} className="dim-display__item">
                            <span className="dim-display__item-label">{DIMENSION_LABELS[key]}</span>
                            <StarRating rating={val} size="medium" />
                            <span className="dim-display__item-val">{val.toFixed(1)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DimensionRatingDisplay;
