import React from 'react';
import Badge from './Badge';
import type { Badge as BadgeType } from '../../../types';
import './BadgeList.css';

interface BadgeListProps {
  badges: BadgeType[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const BadgeList: React.FC<BadgeListProps> = ({
  badges,
  maxDisplay = 3,
  size = 'sm',
  showTooltip = true
}) => {
  if (!badges || badges.length === 0) {
    return null;
  }

  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <div className="badge-list">
      {displayBadges.map(badge => (
        <Badge
          key={badge.id}
          badge={badge}
          size={size}
          showName={false}
          showTooltip={showTooltip}
          isNew={badge.isNew}
        />
      ))}
      {remainingCount > 0 && (
        <span className="badge-list__more">+{remainingCount}</span>
      )}
    </div>
  );
};

export default BadgeList;
