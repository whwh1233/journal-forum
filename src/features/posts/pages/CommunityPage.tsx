import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Filter, X, TrendingUp, Users, Tag } from 'lucide-react';
import PostList from '../components/PostList';
import { postService } from '../services/postService';
import { Post, PostFilters, PostPagination, PostCategory, CATEGORY_LABELS, SORT_OPTIONS } from '../types/post';
import { useAuth } from '../../../hooks/useAuth';
import { usePageTitle } from '@/contexts/PageContext';
import './CommunityPage.css';

const CommunityPage: React.FC = () => {
  usePageTitle('社区讨论');
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PostPagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });

  // Filters
  const [filters, setFilters] = useState<PostFilters>({
    sortBy: 'hot',
    page: 1,
    limit: 20
  });

  // UI State
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Fetch posts
  const fetchPosts = async (newFilters?: PostFilters) => {
    try {
      setLoading(true);
      setError(null);
      const finalFilters = newFilters || filters;
      const response = await postService.getPosts(finalFilters);

      if (finalFilters.page === 1) {
        setPosts(response.posts);
      } else {
        setPosts(prev => [...prev, ...response.posts]);
      }

      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPosts();
  }, []);

  // Handle filter change
  const handleFilterChange = (key: keyof PostFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    fetchPosts(newFilters);
  };

  // Handle load more
  const handleLoadMore = () => {
    const newFilters = { ...filters, page: (filters.page || 1) + 1 };
    setFilters(newFilters);
    fetchPosts(newFilters);
  };

  // Handle create post
  const handleCreatePost = () => {
    if (!user) {
      alert('请先登录');
      return;
    }
    navigate('/posts/new');
  };

  // Handle retry
  const handleRetry = () => {
    fetchPosts();
  };

  // Handle post click
  const handlePostClick = (id: number) => {
    navigate(`/posts/${id}`);
  };

  return (
    <div className="community-page">
      <div className="community-container">
        {/* Top Bar */}
        <div className="community-topbar">
          <div className="community-topbar-left">
            <h1 className="community-title">社区讨论</h1>
            <div className="community-category-tabs">
              <button
                className={`community-category-tab ${!filters.category ? 'community-category-tab--active' : ''}`}
                onClick={() => handleFilterChange('category', undefined)}
              >
                全部
              </button>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  className={`community-category-tab ${filters.category === value ? 'community-category-tab--active' : ''}`}
                  onClick={() => handleFilterChange('category', value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="community-topbar-right">
            <select
              className="community-sort-select"
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button className="community-filter-toggle" onClick={() => setShowFilterDrawer(!showFilterDrawer)}>
              <Filter size={20} />
              <span>筛选</span>
            </button>

            <button className="community-create-button" onClick={handleCreatePost}>
              <PlusCircle size={20} />
              <span>发布帖子</span>
            </button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="community-layout">
          {/* Left Sidebar - Filters */}
          <aside className={`community-sidebar community-sidebar--left ${showFilterDrawer ? 'community-sidebar--open' : ''}`}>
            <div className="community-sidebar-header">
              <h3>筛选条件</h3>
              <button className="community-sidebar-close" onClick={() => setShowFilterDrawer(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="community-filter-section">
              <h4 className="community-filter-title">分类</h4>
              <div className="community-filter-list">
                <button
                  className={`community-filter-item ${!filters.category ? 'community-filter-item--active' : ''}`}
                  onClick={() => handleFilterChange('category', undefined)}
                >
                  <span>全部分类</span>
                  <span className="community-filter-count">{pagination.total}</span>
                </button>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    className={`community-filter-item ${filters.category === value ? 'community-filter-item--active' : ''}`}
                    onClick={() => handleFilterChange('category', value)}
                  >
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="community-filter-section">
              <h4 className="community-filter-title">搜索</h4>
              <input
                type="text"
                className="community-search-input"
                placeholder="搜索帖子标题或内容..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="community-main">
            <PostList
              posts={posts}
              loading={loading}
              error={error}
              hasMore={pagination.page < pagination.totalPages}
              onLoadMore={handleLoadMore}
              onRetry={handleRetry}
              onCreatePost={handleCreatePost}
              onPostClick={handlePostClick}
            />
          </main>

          {/* Right Sidebar - Info */}
          <aside className="community-sidebar community-sidebar--right">
            <div className="community-widget">
              <div className="community-widget-header">
                <TrendingUp size={20} />
                <h3>热门标签</h3>
              </div>
              <div className="community-widget-content">
                <div className="community-tag-cloud">
                  {['期刊推荐', '投稿经验', 'SCI', 'EI', '审稿', '修改意见', '拒稿', '录用', 'OA期刊', '影响因子'].map((tag, index) => (
                    <button
                      key={index}
                      className="community-tag-cloud-item"
                      onClick={() => handleFilterChange('tag', tag)}
                    >
                      <Tag size={14} />
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="community-widget">
              <div className="community-widget-header">
                <Users size={20} />
                <h3>活跃用户</h3>
              </div>
              <div className="community-widget-content">
                <div className="community-info-text">
                  近期活跃用户数据正在统计中...
                </div>
              </div>
            </div>

            <div className="community-widget">
              <div className="community-widget-header">
                <h3>社区公告</h3>
              </div>
              <div className="community-widget-content">
                <div className="community-info-text">
                  欢迎来到学术交流社区！在这里您可以分享投稿经验、讨论学术问题、寻求帮助和交流心得。
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Filter Drawer Overlay */}
      {showFilterDrawer && (
        <div className="community-drawer-overlay" onClick={() => setShowFilterDrawer(false)} />
      )}
    </div>
  );
};

export default CommunityPage;
