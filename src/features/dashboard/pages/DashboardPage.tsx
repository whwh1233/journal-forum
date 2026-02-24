import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getUserActivity, getUserComments, getUserFavorites } from '../../../services/userService';
import { getFollowing } from '../../../services/followService';
import { Link } from 'react-router-dom';
import FollowButton from '../../follow/components/FollowButton';
import PageHeader from '../../../components/layout/PageHeader';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activity, setActivity] = useState<any>(null);
  const [comments, setComments] = useState<any>(null);
  const [favorites, setFavorites] = useState<any>(null);
  const [following, setFollowing] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'favorites' | 'following'>('overview');

  useEffect(() => {
    const loadData = async () => {
      try {
        const activityData = await getUserActivity();
        setActivity(activityData);

        const commentsData = await getUserComments(1, 5);
        setComments(commentsData);

        const favoritesData = await getUserFavorites(1, 5);
        setFavorites(favoritesData);

        if (user?.id) {
          const followingData = await getFollowing(parseInt(user.id), 1, 20);
          setFollowing(followingData);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container">
        <div className="dashboard-error">请先登录</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <PageHeader title="个人中心" />
      <div className="container">
      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          概览
        </button>
        <button
          className={`tab ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          我的评论
        </button>
        <button
          className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          我的收藏
        </button>
        <button
          className={`tab ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => setActiveTab('following')}
        >
          我的关注
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && activity && (
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-value">{activity.stats.commentCount}</div>
              <div className="stat-label">评论数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{activity.stats.favoriteCount}</div>
              <div className="stat-label">收藏数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{activity.stats.followingCount}</div>
              <div className="stat-label">关注数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{activity.stats.followerCount}</div>
              <div className="stat-label">粉丝数</div>
            </div>
          </div>
        )}

        {activeTab === 'comments' && comments && (
          <div className="comments-list">
            {comments.comments.map((comment: any) => (
              <div key={comment.id} className="comment-item">
                <Link to={`/`} className="comment-journal">
                  {comment.journalTitle}
                </Link>
                <p className="comment-content">{comment.content}</p>
                <span className="comment-date">
                  {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'favorites' && favorites && (
          <div className="favorites-list">
            {favorites.favorites.map((fav: any) => (
              <div key={fav.id} className="favorite-item">
                {fav.journal && (
                  <>
                    <h3>{fav.journal.title}</h3>
                    <p>{fav.journal.description}</p>
                    <span className="favorite-date">
                      收藏于 {new Date(fav.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'following' && following && (
          <div className="following-list">
            {following.following.length === 0 ? (
              <div className="empty-state">
                <p>你还没有关注任何人</p>
                <Link to="/" className="explore-link">去首页逛逛</Link>
              </div>
            ) : (
              following.following.map((item: any) => (
                <div key={item.id} className="following-item">
                  <Link to={`/profile/${item.user.id}`} className="following-user-info">
                    <div className="following-avatar">
                      {item.user.avatar ? (
                        <img src={`http://localhost:3001${item.user.avatar}`} alt={item.user.name} />
                      ) : (
                        <div className="following-avatar-placeholder">
                          {(item.user.name || item.user.email)[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="following-details">
                      <div className="following-name">{item.user.name || item.user.email}</div>
                      <div className="following-email">{item.user.email}</div>
                      <div className="following-date">
                        关注于 {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </Link>
                  <div className="following-actions">
                    <FollowButton userId={item.user.id} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default DashboardPage;
