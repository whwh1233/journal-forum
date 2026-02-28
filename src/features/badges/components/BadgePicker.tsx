import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import Badge from './Badge';
import { getMyBadges, setPinnedBadges } from '../../../services/badgeService';
import type { Badge as BadgeType } from '../../../types';
import './BadgePicker.css';

interface BadgePickerProps {
  onSave?: () => void;
  initialSelected?: number[];
}

const BadgePicker: React.FC<BadgePickerProps> = ({ onSave, initialSelected = [] }) => {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [selected, setSelected] = useState<number[]>(initialSelected);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBadges();
  }, []);

  useEffect(() => {
    if (initialSelected.length > 0) {
      setSelected(initialSelected);
    }
  }, [initialSelected]);

  const loadBadges = async () => {
    try {
      const data = await getMyBadges();
      setBadges(data.badges);
      // 如果有置顶徽章，设置为已选择
      if (data.pinnedBadges.length > 0) {
        setSelected(data.pinnedBadges.map(b => b.id));
      }
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBadge = (badgeId: number) => {
    if (selected.includes(badgeId)) {
      setSelected(selected.filter(id => id !== badgeId));
    } else if (selected.length < 3) {
      setSelected([...selected, badgeId]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setPinnedBadges(selected);
      onSave?.();
    } catch (error) {
      console.error('Error saving pinned badges:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="badge-picker__loading">加载中...</div>;
  }

  if (badges.length === 0) {
    return (
      <div className="badge-picker badge-picker--empty">
        <p>暂无可展示的徽章</p>
      </div>
    );
  }

  return (
    <div className="badge-picker">
      <div className="badge-picker__header">
        <h4>选择置顶徽章</h4>
        <span className="badge-picker__count">{selected.length}/3</span>
      </div>
      <p className="badge-picker__hint">选择最多 3 个徽章在评论区和用户列表中展示</p>
      <div className="badge-picker__grid">
        {badges.map(badge => (
          <div
            key={badge.id}
            className={`badge-picker__item ${selected.includes(badge.id) ? 'badge-picker__item--selected' : ''}`}
            onClick={() => toggleBadge(badge.id)}
          >
            <Badge badge={badge} size="md" showName={true} />
            {selected.includes(badge.id) && (
              <span className="badge-picker__check">
                <Check size={14} />
              </span>
            )}
          </div>
        ))}
      </div>
      <button
        className="badge-picker__save"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? '保存中...' : '保存设置'}
      </button>
    </div>
  );
};

export default BadgePicker;
