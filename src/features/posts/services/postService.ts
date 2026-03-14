// src/features/posts/services/postService.ts
import {
  Post,
  PostComment,
  CreatePostData,
  UpdatePostData,
  CreateCommentData,
  PostFilters,
  PostPagination
} from '../types/post';

const API_URL = '';

// 获取授权 token
const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 处理响应
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }
  return response.json();
};

// 归一化 tags：数据库 JSON 列可能返回数组或字符串，统一为 string[]
const normalizeTags = (tags: unknown): string[] => {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string' && tags.length > 0) return [tags];
  return [];
};

const normalizePost = (post: Post): Post => {
  const normalized = { ...post };

  // If tags_assoc exists (new relational format), derive tags from it for backward compat
  if (normalized.tags_assoc && Array.isArray(normalized.tags_assoc)) {
    normalized.tags = normalized.tags_assoc.map(t => t.name);
  } else {
    // Fall back to old JSON-column tags normalization
    normalized.tags = normalizeTags(post.tags);
  }

  return normalized;
};

export const postService = {
  // 获取帖子列表
  getPosts: async (filters?: PostFilters): Promise<{ posts: Post[]; pagination: PostPagination }> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_URL}/api/posts?${params}`, {
      headers: getAuthHeader()
    });
    const data = await handleResponse(response);
    data.posts = data.posts.map(normalizePost);
    return data;
  },

  // 获取帖子详情
  getPostById: async (id: number): Promise<Post> => {
    const response = await fetch(`${API_URL}/api/posts/${id}`, {
      headers: getAuthHeader()
    });
    const post = await handleResponse(response);
    return normalizePost(post);
  },

  // 创建帖子
  createPost: async (data: CreatePostData): Promise<Post> => {
    const response = await fetch(`${API_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    const post = await handleResponse(response);
    return normalizePost(post);
  },

  // 更新帖子
  updatePost: async (id: number, data: UpdatePostData): Promise<Post> => {
    const response = await fetch(`${API_URL}/api/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    const post = await handleResponse(response);
    return normalizePost(post);
  },

  // 删除帖子
  deletePost: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/posts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    await handleResponse(response);
  },

  // 点赞/取消点赞
  toggleLike: async (id: number): Promise<{ liked: boolean; likeCount: number }> => {
    const response = await fetch(`${API_URL}/api/posts/${id}/like`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  // 收藏/取消收藏
  toggleFavorite: async (id: number): Promise<{ favorited: boolean; favoriteCount: number }> => {
    const response = await fetch(`${API_URL}/api/posts/${id}/favorite`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  // 关注/取消关注
  toggleFollow: async (id: number): Promise<{ followed: boolean; followCount: number }> => {
    const response = await fetch(`${API_URL}/api/posts/${id}/follow`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  // 举报帖子
  reportPost: async (id: number, reason: string): Promise<void> => {
    const response = await fetch(`${API_URL}/api/posts/${id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ reason })
    });
    await handleResponse(response);
  },

  // 增加浏览计数
  incrementView: async (id: number): Promise<void> => {
    await fetch(`${API_URL}/api/posts/${id}/view`, {
      method: 'POST'
    });
  },

  // 获取评论列表
  getComments: async (postId: number): Promise<PostComment[]> => {
    const response = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  // 发表评论
  createComment: async (postId: number, data: CreateCommentData): Promise<PostComment> => {
    const response = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // 删除评论
  deleteComment: async (commentId: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/posts/comments/${commentId}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    await handleResponse(response);
  },

  // 点赞/取消点赞评论
  toggleCommentLike: async (commentId: number): Promise<{ liked: boolean; likeCount: number }> => {
    const response = await fetch(`${API_URL}/api/posts/comments/${commentId}/like`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    return handleResponse(response);
  },

  // 获取我的帖子
  getMyPosts: async (page = 1, limit = 20): Promise<{ posts: Post[]; pagination: PostPagination }> => {
    const response = await fetch(`${API_URL}/api/posts/my/posts?page=${page}&limit=${limit}`, {
      headers: getAuthHeader()
    });
    const data = await handleResponse(response);
    data.posts = data.posts.map(normalizePost);
    return data;
  },

  // 获取我收藏的帖子
  getMyFavorites: async (page = 1, limit = 20): Promise<{ posts: Post[]; pagination: PostPagination }> => {
    const response = await fetch(`${API_URL}/api/posts/my/favorites?page=${page}&limit=${limit}`, {
      headers: getAuthHeader()
    });
    const data = await handleResponse(response);
    data.posts = data.posts.map(normalizePost);
    return data;
  },

  // 获取我关注的帖子
  getMyFollows: async (page = 1, limit = 20): Promise<{ posts: Post[]; pagination: PostPagination }> => {
    const response = await fetch(`${API_URL}/api/posts/my/follows?page=${page}&limit=${limit}`, {
      headers: getAuthHeader()
    });
    const data = await handleResponse(response);
    data.posts = data.posts.map(normalizePost);
    return data;
  }
};
