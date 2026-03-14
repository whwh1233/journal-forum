import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Filter, X, TrendingUp, Tag, Search } from 'lucide-react';
import PostList from '../components/PostList';
import { postService } from '../services/postService';
import { Post, PostFilters, PostPagination, PostCategoryInfo, TagInfo, CATEGORY_LABELS, SORT_OPTIONS } from '../types/post';
import { postCategoryService } from '../../../services/postCategoryService';
import { tagService } from '../../../services/tagService';
import { useAuth } from '../../../hooks/useAuth';
import { usePageTitle } from '@/contexts/PageContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { useToast } from '../../../hooks/useToast';
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

  // Dynamic categories and hot tags
  const [categories, setCategories] = useState<PostCategoryInfo[]>([]);
  const [hotTags, setHotTags] = useState<TagInfo[]>([]);

  // Filters
  const [filters, setFilters] = useState<PostFilters>({
    sortBy: 'hot',
    page: 1,
    limit: 20
  });

  // UI State
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const toast = useToast();

  // Load categories and hot tags on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { categories: cats } = await postCategoryService.getCategories();
        setCategories(cats);
      } catch {
        // Fallback: categories stays empty, tabs won't render
      }
    };
    const loadHotTags = async () => {
      try {
        const { tags } = await tagService.getHotTags();
        setHotTags(tags);
      } catch {
        // Fallback: hotTags stays empty
      }
    };
    loadCategories();
    loadHotTags();
  }, []);

  // Handle filter change — must be defined before the debounce effect that depends on it
  const handleFilterChange = useCallback((key: keyof PostFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []); // setFilters is stable, no deps needed

  // Separate search input state for debouncing
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 300);
  const isFirstRender = useRef(true);

  // Sync debounced search value to filters — safe because handleFilterChange is stable (useCallback)
  useEffect(() => {
    // Skip on initial mount to avoid a redundant extra fetch
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    handleFilterChange('search', debouncedSearch || undefined);
  }, [debouncedSearch, handleFilterChange]);

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

  // Fetch when filters change
  useEffect(() => {
    fetchPosts();
  }, [filters]);

  // Handle load more
  const handleLoadMore = () => {
    setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
  };

  // Handle create post
  const handleCreatePost = () => {
    if (!user) {
      toast.warning('请先登录后再发布帖子');
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

  // Build category label lookup for sidebar (fallback-compatible)
  const getCategoryLabel = (slug: string): string => {
    const cat = categories.find(c => c.slug === slug);
    if (cat) return cat.name;
    return CATEGORY_LABELS[slug as keyof typeof CATEGORY_LABELS] || slug;
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
              {categories.length > 0
                ? categories.map((cat) => (
                    <button
                      key={cat.id}
                      className={`community-category-tab ${filters.category === cat.slug ? 'community-category-tab--active' : ''}`}
                      onClick={() => handleFilterChange('category', cat.slug)}
                    >
                      {cat.name}
                    </button>
                  ))
                : /* Fallback to hardcoded categories if API hasn't loaded */
                  Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      className={`community-category-tab ${filters.category === value ? 'community-category-tab--active' : ''}`}
                      onClick={() => handleFilterChange('category', value)}
                    >
                      {label}
                    </button>
                  ))
              }
            </div>
          </div>

          <div className="community-topbar-right">
            {/* Search — moved from sidebar */}
            <div className="community-search-bar">
              <Search size={16} className="community-search-icon" />
              <input
                type="text"
                className="community-search-input"
                placeholder="搜索帖子..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            {/* Active tag badge — only shown when a tag filter is active */}
            {filters.tag && (
              <div className="community-active-tag">
                <Tag size={16} />
                <span>{filters.tag}</span>
                <button
                  className="community-active-tag__clear"
                  onClick={() => handleFilterChange('tag', undefined)}
                  aria-label="清除标签筛选"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Sort select — position unchanged, already in topbar */}
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

            {/* Filter toggle — mobile only (kept for mobile sidebar) */}
            <button className="community-filter-toggle" onClick={() => setShowFilterDrawer(!showFilterDrawer)}>
              <Filter size={18} />
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
              <h3>分类统计</h3>
              <button className="community-sidebar-close" onClick={() => setShowFilterDrawer(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="community-filter-section">
              <div className="community-filter-list">
                <div className="community-stat-row">
                  <span className="community-stat-label">全部</span>
                  <span className="community-stat-badge">{pagination.total}</span>
                </div>
                {categories.length > 0
                  ? categories.map((cat) => (
                      <div key={cat.id} className="community-stat-row">
                        <span className="community-stat-label">{cat.name}</span>
                        <span className="community-stat-badge">{cat.postCount ?? '—'}</span>
                      </div>
                    ))
                  : Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <div key={value} className="community-stat-row">
                        <span className="community-stat-label">{label}</span>
                        <span className="community-stat-badge">—</span>
                      </div>
                    ))
                }
              </div>
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
            {/* 社区公告 */}
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

            {/* 热门标签 */}
            <div className="community-widget">
              <div className="community-widget-header">
                <TrendingUp size={20} />
                <h3>热门标签</h3>
              </div>
              <div className="community-widget-content">
                <div className="community-tag-cloud">
                  {hotTags.length > 0
                    ? hotTags.map((tag) => (
                        <button
                          key={tag.id}
                          className="community-tag-cloud-item"
                          onClick={() => handleFilterChange('tag', tag.name)}
                        >
                          <Tag size={16} />
                          <span>{tag.name}</span>
                          {tag.postCount !== undefined && tag.postCount > 0 && (
                            <span className="community-tag-cloud-count">{tag.postCount}</span>
                          )}
                        </button>
                      ))
                    : /* Fallback to hardcoded tags if API hasn't loaded */
                      ['期刊推荐', '投稿经验', 'SCI', 'EI', '审稿', '修改意见', '拒稿', '录用', 'OA期刊', '影响因子'].map((tag, index) => (
                        <button
                          key={index}
                          className="community-tag-cloud-item"
                          onClick={() => handleFilterChange('tag', tag)}
                        >
                          <Tag size={16} />
                          <span>{tag}</span>
                        </button>
                      ))
                  }
                </div>
              </div>
            </div>

            {/* 社区统计 */}
            <div className="community-widget">
              <div className="community-widget-header">
                <h3>社区统计</h3>
              </div>
              <div className="community-widget-content">
                <div className="community-stat-grid">
                  <div className="community-stat-item">
                    <span className="community-stat-number">{pagination.total}</span>
                    <span className="community-stat-desc">总帖子</span>
                  </div>
                  <div className="community-stat-item">
                    <span className="community-stat-number">{categories.length || 6}</span>
                    <span className="community-stat-desc">讨论分类</span>
                  </div>
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
