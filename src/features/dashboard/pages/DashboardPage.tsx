import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getUserActivity, getUserComments, getUserFavorites } from '../../../services/userService';
import { getFollowing } from '../../../services/followService';
import { Link } from 'react-router-dom';
import { Info, MessageSquare, Star, Users } from 'lucide-react';
import FollowButton from '../../follow/components/FollowButton';
import { usePageTitle } from '@/contexts/PageContext';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  usePageTitle('个人中心');

  const { user } = useAuth();
  const [activity, setActivity] = useState<any>(null);
  const [comments, setComments] = useState<any>(null);
  const [favorites, setFavorites] = useState<any>(null);
  const [following, setFollowing] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'favorites' | 'following'>('overview');

  // 加载关注列表
  const loadFollowing = async () => {
    if (!user?.id) return;
    try {
      const data = await getFollowing(user.id, 1, 20);
      setFollowing(data);
    } catch (error) {
      console.error('Failed to load following:', error);
    }
  };

  // 加载活动统计
  const loadActivity = async () => {
    if (!user?.id) return;
    try {
      const data = await getUserActivity();
      setActivity(data);
    } catch (error) {
      console.error('Failed to load activity:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      const results = await Promise.allSettled([
        getUserActivity(),
        getUserComments(1, 5),
        getUserFavorites(1, 5),
        getFollowing(user.id, 1, 20)
      ]);

      if (results[0].status === 'fulfilled') {
        setActivity(results[0].value);
      } else {
        console.error('Failed to load activity:', results[0].reason);
      }

      if (results[1].status === 'fulfilled') {
        setComments(results[1].value);
      } else {
        console.error('Failed to load comments:', results[1].reason);
      }

      if (results[2].status === 'fulfilled') {
        setFavorites(results[2].value);
      } else {
        console.error('Failed to load favorites:', results[2].reason);
      }

      if (results[3].status === 'fulfilled') {
        setFollowing(results[3].value);
      } else {
        console.error('Failed to load following:', results[3].reason);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  // 切换到关注标签时刷新数据
  useEffect(() => {
    if (activeTab === 'following' && user) {
      loadFollowing();
    }
  }, [activeTab]);

  // 关注状态变化时刷新列表和统计
  const handleFollowChange = () => {
    loadFollowing();
    loadActivity();
  };

  if (!user) {
    return (
      <div className="page-wrapper">
        <div className="dashboard-error">请先登录</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-wrapper">
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
            <div className="dashboard-stats dashboard-stats-with-points">
              <div className="stat-card points-card">
                <div className="stat-value points-val">{activity.stats.points}</div>
                <div className="stat-label">
                  总积分 <span className="profile-level-badge">Lv.{activity.stats.level}</span>
                  <div className="points-info-wrapper">
                    <Info size={14} className="points-info-icon" />
                    <div className="points-tooltip">
                      <h4>积分获取规则</h4>
                      <ul>
                        <li><span className="pts">+5</span> 发布一条评论</li>
                        <li><span className="pts">+2</span> 文章被他人收藏</li>
                        <li><span className="pts">+10</span> 获得一位新粉丝</li>
                      </ul>
                      <div className="points-tooltip-footer">每累积 100 积分提升 1 个等级</div>
                    </div>
                  </div>
                </div>
              </div>
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
              {comments.comments.length === 0 ? (
                <div className="empty-state">
                  <MessageSquare size={48} strokeWidth={1.5} />
                  <p>你还没有发表过评论</p>
                  <Link to="/" className="explore-link">去期刊列表看看</Link>
                </div>
              ) : (
                comments.comments.map((comment: any) => (
                  <div key={comment.id} className="comment-item">
                    <Link to={`/`} className="comment-journal">
                      {comment.journalTitle}
                    </Link>
                    <p className="comment-content">{comment.content}</p>
                    <span className="comment-date">
                      {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'favorites' && favorites && (
            <div className="favorites-list">
              {favorites.favorites.length === 0 ? (
                <div className="empty-state">
                  <Star size={48} strokeWidth={1.5} />
                  <p>你还没有收藏任何期刊</p>
                  <Link to="/" className="explore-link">去发现感兴趣的期刊</Link>
                </div>
              ) : (
                favorites.favorites.map((fav: any) => (
                  <div key={fav.id} className="favorite-item">
                    {fav.journal && (
                      <>
                        <h3>{fav.journal.name}</h3>
                        <p>{fav.journal.introduction}</p>
                        <span className="favorite-date">
                          收藏于 {new Date(fav.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'following' && following && (
            <div className="following-list">
              {following.following.length === 0 ? (
                <div className="empty-state">
                  <Users size={48} strokeWidth={1.5} />
                  <p>你还没有关注任何人</p>
                  <Link to="/" className="explore-link">去首页逛逛</Link>
                </div>
              ) : (
                following.following.map((item: any) => (
                  <div key={item.id} className="following-item">
                    <Link to={`/profile/${item.user.id}`} className="following-user-info">
                      <div className="following-avatar">
                        {item.user.avatar ? (
                          <img src={`${item.user.avatar}`} alt={item.user.name} />
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
                      <FollowButton userId={item.user.id} onFollowChange={handleFollowChange} />
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
