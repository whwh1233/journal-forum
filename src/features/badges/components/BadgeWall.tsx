import React from 'react';
import Badge from './Badge';
import type { Badge as BadgeType } from '../../../types';
import './BadgeWall.css';

interface BadgeWallProps {
  badges: BadgeType[];
  title?: string;
}

const categoryLabels: Record<string, string> = {
  activity: '活跃度徽章',
  identity: '身份徽章',
  honor: '荣誉徽章'
};

const BadgeWall: React.FC<BadgeWallProps> = ({ badges, title = '我的徽章' }) => {
  if (!badges || badges.length === 0) {
    return (
      <div className="badge-wall badge-wall--empty">
        <p>暂无徽章，继续加油！</p>
      </div>
    );
  }

  // 按分类分组
  const groupedBadges = badges.reduce((acc, badge) => {
    const category = badge.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(badge);
    return acc;
  }, {} as Record<string, BadgeType[]>);

  return (
    <div className="badge-wall">
      <h3 className="badge-wall__title">{title}</h3>
      {Object.entries(groupedBadges).map(([category, categoryBadges]) => (
        <div key={category} className="badge-wall__category">
          <h4 className="badge-wall__category-title">
            {categoryLabels[category] || category}
          </h4>
          <div className="badge-wall__badges">
            {categoryBadges.map(badge => (
              <Badge
                key={badge.id}
                badge={badge}
                size="md"
                showName={true}
                showTooltip={true}
                isNew={badge.isNew}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BadgeWall;
