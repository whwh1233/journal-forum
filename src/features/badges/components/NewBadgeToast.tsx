import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { X } from 'lucide-react';
import { useBadgeContext } from '../../../contexts/BadgeContext';
import type { Badge } from '../../../types';
import './NewBadgeToast.css';

const NewBadgeToast: React.FC = () => {
  const navigate = useNavigate();
  const { newBadgesList, setNewBadges } = useBadgeContext();
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (newBadgesList.length > 0 && !currentBadge) {
      setCurrentBadge(newBadgesList[0]);
      setIsVisible(true);
    }
  }, [newBadgesList, currentBadge]);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      const remaining = newBadgesList.slice(1);
      setNewBadges(remaining);
      setCurrentBadge(null);
    }, 300);
  };

  const handleClick = () => {
    handleClose();
    navigate('/profile/edit');
  };

  if (!currentBadge || !isVisible) return null;

  const IconComponent = (LucideIcons as any)[currentBadge.icon] || LucideIcons.Award;

  return (
    <div
      className={`new-badge-toast ${isVisible ? 'new-badge-toast--visible' : ''}`}
      style={{ '--badge-color': currentBadge.color } as React.CSSProperties}
    >
      <button className="new-badge-toast__close" onClick={handleClose}>
        <X size={16} />
      </button>
      <div className="new-badge-toast__content" onClick={handleClick}>
        <div className="new-badge-toast__icon">
          <IconComponent size={32} />
        </div>
        <div className="new-badge-toast__info">
          <div className="new-badge-toast__title">恭喜获得新徽章！</div>
          <div className="new-badge-toast__name">{currentBadge.name}</div>
          <div className="new-badge-toast__desc">{currentBadge.description}</div>
        </div>
      </div>
    </div>
  );
};

export default NewBadgeToast;
