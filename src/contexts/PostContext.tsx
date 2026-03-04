import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { postService } from '@/features/posts/services/postService';
import { Post, PostFilters, PostPagination, CreatePostData, UpdatePostData } from '@/features/posts/types/post';
import { useToastContext } from './ToastContext';

interface PostContextState {
  // Data
  posts: Post[];
  currentPost: Post | null;
  pagination: PostPagination;
  filters: PostFilters;

  // Loading states
  loading: boolean;
  submitting: boolean;

  // Error state
  error: string | null;

  // Actions
  fetchPosts: (newFilters?: PostFilters) => Promise<void>;
  fetchPostById: (id: number) => Promise<void>;
  createPost: (data: CreatePostData) => Promise<Post | null>;
  updatePost: (id: number, data: UpdatePostData) => Promise<boolean>;
  deletePost: (id: number) => Promise<boolean>;
  loadMore: () => Promise<void>;
  setFilters: (filters: PostFilters) => void;
  toggleLike: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
  toggleFollow: (id: number) => Promise<void>;
  reportPost: (id: number, reason: string) => Promise<boolean>;
  incrementViewCount: (id: number) => Promise<void>;
  refreshCurrentPost: () => Promise<void>;
  clearError: () => void;
}

const PostContext = createContext<PostContextState | undefined>(undefined);

interface PostProviderProps {
  children: ReactNode;
}

export const PostProvider: React.FC<PostProviderProps> = ({ children }) => {
  const toast = useToastContext();

  // State
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [pagination, setPagination] = useState<PostPagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [filters, setFiltersState] = useState<PostFilters>({
    sortBy: 'hot',
    page: 1,
    limit: 20
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch posts list with filters
  const fetchPosts = useCallback(async (newFilters?: PostFilters) => {
    try {
      setLoading(true);
      setError(null);

      const finalFilters = newFilters || filters;
      const response = await postService.getPosts(finalFilters);

      // If page 1, replace posts; otherwise append
      if (finalFilters.page === 1) {
        setPosts(response.posts);
      } else {
        setPosts(prev => [...prev, ...response.posts]);
      }

      setPagination(response.pagination);

      // Update filters state if new filters provided
      if (newFilters) {
        setFiltersState(newFilters);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载帖子失败';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Fetch single post by ID
  const fetchPostById = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const post = await postService.getPostById(id);
      setCurrentPost(post);
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载帖子详情失败';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Create new post
  const createPost = useCallback(async (data: CreatePostData): Promise<Post | null> => {
    try {
      setSubmitting(true);
      setError(null);

      const post = await postService.createPost(data);
      toast.success('帖子发布成功');

      // Clear draft from localStorage if exists
      localStorage.removeItem('post_draft');

      return post;
    } catch (err) {
      const message = err instanceof Error ? err.message : '发布帖子失败';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [toast]);

  // Update existing post
  const updatePost = useCallback(async (id: number, data: UpdatePostData): Promise<boolean> => {
    try {
      setSubmitting(true);
      setError(null);

      const updated = await postService.updatePost(id, data);

      // Update current post if viewing it
      if (currentPost && currentPost.id === id) {
        setCurrentPost(updated);
      }

      // Update in posts list if present
      setPosts(prev => prev.map(p => p.id === id ? updated : p));

      toast.success('帖子更新成功');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新帖子失败';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [currentPost, toast]);

  // Delete post
  const deletePost = useCallback(async (id: number): Promise<boolean> => {
    try {
      setSubmitting(true);
      setError(null);

      await postService.deletePost(id);

      // Remove from posts list
      setPosts(prev => prev.filter(p => p.id !== id));

      // Clear current post if viewing it
      if (currentPost && currentPost.id === id) {
        setCurrentPost(null);
      }

      toast.success('帖子已删除');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除帖子失败';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [currentPost, toast]);

  // Load more posts (pagination)
  const loadMore = useCallback(async () => {
    if (loading || pagination.page >= pagination.totalPages) {
      return;
    }

    const newFilters = { ...filters, page: filters.page! + 1 };
    await fetchPosts(newFilters);
  }, [loading, pagination, filters, fetchPosts]);

  // Set filters and fetch
  const setFilters = useCallback((newFilters: PostFilters) => {
    // Reset to page 1 when filters change
    const filtersWithPage = { ...newFilters, page: 1 };
    setFiltersState(filtersWithPage);
    fetchPosts(filtersWithPage);
  }, [fetchPosts]);

  // Toggle like
  const toggleLike = useCallback(async (id: number) => {
    try {
      const result = await postService.toggleLike(id);

      // Update current post
      if (currentPost && currentPost.id === id) {
        setCurrentPost({
          ...currentPost,
          userLiked: result.liked,
          likeCount: result.likeCount
        });
      }

      // Update in posts list
      setPosts(prev => prev.map(p =>
        p.id === id
          ? { ...p, userLiked: result.liked, likeCount: result.likeCount }
          : p
      ));

      toast.success(result.liked ? '已点赞' : '已取消点赞');
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败';
      toast.error(message);
    }
  }, [currentPost, toast]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (id: number) => {
    try {
      const result = await postService.toggleFavorite(id);

      // Update current post
      if (currentPost && currentPost.id === id) {
        setCurrentPost({
          ...currentPost,
          userFavorited: result.favorited,
          favoriteCount: result.favoriteCount
        });
      }

      // Update in posts list
      setPosts(prev => prev.map(p =>
        p.id === id
          ? { ...p, userFavorited: result.favorited, favoriteCount: result.favoriteCount }
          : p
      ));

      toast.success(result.favorited ? '已收藏' : '已取消收藏');
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败';
      toast.error(message);
    }
  }, [currentPost, toast]);

  // Toggle follow
  const toggleFollow = useCallback(async (id: number) => {
    try {
      const result = await postService.toggleFollow(id);

      // Update current post
      if (currentPost && currentPost.id === id) {
        setCurrentPost({
          ...currentPost,
          userFollowed: result.followed,
          followCount: result.followCount
        });
      }

      // Update in posts list
      setPosts(prev => prev.map(p =>
        p.id === id
          ? { ...p, userFollowed: result.followed, followCount: result.followCount }
          : p
      ));

      toast.success(result.followed ? '已关注' : '已取消关注');
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败';
      toast.error(message);
    }
  }, [currentPost, toast]);

  // Report post
  const reportPost = useCallback(async (id: number, reason: string): Promise<boolean> => {
    try {
      await postService.reportPost(id, reason);
      toast.success('举报已提交，感谢您的反馈');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '举报失败';
      toast.error(message);
      return false;
    }
  }, [toast]);

  // Increment view count (silent, no error handling needed)
  const incrementViewCount = useCallback(async (id: number) => {
    try {
      await postService.incrementViewCount(id);

      // Update current post view count
      if (currentPost && currentPost.id === id) {
        setCurrentPost({
          ...currentPost,
          viewCount: currentPost.viewCount + 1
        });
      }
    } catch (err) {
      // Silent fail for view count
      console.warn('Failed to increment view count:', err);
    }
  }, [currentPost]);

  // Refresh current post (useful after commenting)
  const refreshCurrentPost = useCallback(async () => {
    if (currentPost) {
      await fetchPostById(currentPost.id);
    }
  }, [currentPost, fetchPostById]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: PostContextState = {
    posts,
    currentPost,
    pagination,
    filters,
    loading,
    submitting,
    error,
    fetchPosts,
    fetchPostById,
    createPost,
    updatePost,
    deletePost,
    loadMore,
    setFilters,
    toggleLike,
    toggleFavorite,
    toggleFollow,
    reportPost,
    incrementViewCount,
    refreshCurrentPost,
    clearError
  };

  return <PostContext.Provider value={value}>{children}</PostContext.Provider>;
};

// Custom hook to use PostContext
export const usePost = (): PostContextState => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return context;
};
