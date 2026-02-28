import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { Badge as BadgeType } from '../../../types';
import './Badge.css';

interface BadgeProps {
  badge: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showTooltip?: boolean;
  isNew?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  badge,
  size = 'md',
  showName = true,
  showTooltip = true,
  isNew = false
}) => {
  // 动态获取图标
  const IconComponent = (LucideIcons as any)[badge.icon] || LucideIcons.Award;

  return (
    <div
      className={`badge badge--${size} ${isNew ? 'badge--new' : ''}`}
      style={{ '--badge-color': badge.color } as React.CSSProperties}
      title={showTooltip ? badge.description : undefined}
    >
      <span className="badge__icon">
        <IconComponent size={size === 'sm' ? 14 : size === 'md' ? 18 : 24} />
      </span>
      {showName && <span className="badge__name">{badge.name}</span>}
      {isNew && <span className="badge__new-dot" />}
    </div>
  );
};

export default Badge;
