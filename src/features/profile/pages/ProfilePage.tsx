import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserProfile } from '../../../services/userService';
import { getUserBadges } from '../../../services/badgeService';
import { useAuth } from '../../../hooks/useAuth';
import FollowButton from '../../follow/components/FollowButton';
import PageHeader from '../../../components/layout/PageHeader';
import { BadgeWall, BadgeList } from '../../badges';
import type { UserProfile, Badge } from '../../../types';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [pinnedBadges, setPinnedBadges] = useState<Badge[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getUserProfile(parseInt(userId!));
        setProfile(data);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadProfile();
    }
  }, [userId]);

  useEffect(() => {
    const loadBadges = async () => {
      if (userId) {
        try {
          const data = await getUserBadges(parseInt(userId));
          setBadges(data.badges);
          setPinnedBadges(data.pinnedBadges);
        } catch (error) {
          console.error('Error loading badges:', error);
        }
      }
    };
    loadBadges();
  }, [userId]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="profile-loading">加载中...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-wrapper">
        <div className="profile-error">用户不存在</div>
      </div>
    );
  }

  const isOwnProfile = user && user.id === profile.id.toString();

  return (
    <div className="profile-page">
      <PageHeader title="用户资料" showBack backTo="/" />
      <div className="page-wrapper">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.avatar ? (
              <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${profile.avatar}`} alt={profile.name} />
            ) : (
              <div className="profile-avatar-placeholder">
                {(profile.name || profile.email)[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h1 className="profile-name-row">
              <span>{profile.name || profile.email}</span>
              {profile.stats && (
                <span className="profile-level-badge">Lv.{profile.stats.level}</span>
              )}
              {pinnedBadges.length > 0 && (
                <BadgeList badges={pinnedBadges} maxDisplay={3} size="sm" />
              )}
            </h1>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-meta">
              {profile.location && <span>📍 {profile.location}</span>}
              {profile.institution && <span>🏫 {profile.institution}</span>}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer">
                  🔗 网站
                </a>
              )}
            </div>
          </div>
          {isOwnProfile ? (
            <Link to="/profile/edit" className="profile-edit-btn">
              编辑资料
            </Link>
          ) : (
            <div className="profile-follow-btn">
              <FollowButton userId={profile.id} />
            </div>
          )}
        </div>

        {profile.stats && (
          <div className="profile-stats">
            <div className="stat-item points-item">
              <div className="stat-value" style={{ color: 'var(--primary-color)' }}>{profile.stats.points}</div>
              <div className="stat-label">积分</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{profile.stats.commentCount}</div>
              <div className="stat-label">评论</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{profile.stats.favoriteCount}</div>
              <div className="stat-label">收藏</div>
            </div>
            <Link to={`/profile/${profile.id}/follows?tab=following`} className="stat-item stat-item-link">
              <div className="stat-value">{profile.stats.followingCount}</div>
              <div className="stat-label">关注</div>
            </Link>
            <Link to={`/profile/${profile.id}/follows?tab=followers`} className="stat-item stat-item-link">
              <div className="stat-value">{profile.stats.followerCount}</div>
              <div className="stat-label">粉丝</div>
            </Link>
          </div>
        )}

        {badges.length > 0 && (
          <BadgeWall badges={badges} title="获得的徽章" />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
