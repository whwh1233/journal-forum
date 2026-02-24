import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { getFollowers, getFollowing } from '../../../services/followService';
import FollowButton from '../components/FollowButton';
import PageHeader from '../../../components/layout/PageHeader';
import './FollowListPage.css';

interface FollowUser {
  id: number;
  user: {
    id: number;
    email: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

const FollowListPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'following';

  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  useEffect(() => {
    loadData();
  }, [userId, tab]);

  const loadData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      if (tab === 'followers') {
        const data = await getFollowers(parseInt(userId), 1, 20);
        setFollowers(data.followers);
        setPagination(data.pagination);
      } else {
        const data = await getFollowing(parseInt(userId), 1, 20);
        setFollowing(data.following);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading follow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUserList = (users: FollowUser[]) => {
    if (users.length === 0) {
      return (
        <div className="follow-list-empty">
          {tab === 'followers' ? '暂无粉丝' : '暂无关注'}
        </div>
      );
    }

    return (
      <div className="follow-list">
        {users.map(item => (
          <div key={item.id} className="follow-list-item">
            <Link to={`/profile/${item.user.id}`} className="follow-user-info">
              <div className="follow-user-avatar">
                {item.user.avatar ? (
                  <img src={`http://localhost:3001${item.user.avatar}`} alt={item.user.name} />
                ) : (
                  <div className="follow-user-avatar-placeholder">
                    {(item.user.name || item.user.email)[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="follow-user-details">
                <div className="follow-user-name">{item.user.name || item.user.email}</div>
                <div className="follow-user-email">{item.user.email}</div>
              </div>
            </Link>
            <FollowButton userId={item.user.id} />
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container">
        <div className="follow-list-loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="follow-list-page">
      <PageHeader title="关注列表" showBack />
      <div className="container">
      <div className="follow-list-header">
        <div className="follow-list-tabs">
          <button
            className={`follow-tab ${tab === 'following' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'following' })}
          >
            关注 ({tab === 'following' ? pagination.totalItems : following.length})
          </button>
          <button
            className={`follow-tab ${tab === 'followers' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'followers' })}
          >
            粉丝 ({tab === 'followers' ? pagination.totalItems : followers.length})
          </button>
        </div>
      </div>

      {tab === 'followers' ? renderUserList(followers) : renderUserList(following)}
      </div>
    </div>
  );
};

export default FollowListPage;
