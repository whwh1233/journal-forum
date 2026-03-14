// src/features/posts/types/post.ts

export type PostCategory = 'experience' | 'discussion' | 'question' | 'news' | 'review' | 'other';

export type PostStatus = 'published' | 'draft' | 'reported';

export interface Post {
  id: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  content: string;
  category: PostCategory;
  tags: string[];
  journalId?: number;
  journalTitle?: string;

  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  followCount: number;
  hotScore: number;

  isPinned: boolean;
  isDeleted: boolean;
  status: PostStatus;

  userLiked?: boolean;
  userFavorited?: boolean;
  userFollowed?: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  id: number;
  postId: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  parentId?: number;
  content: string;
  likeCount: number;
  isDeleted: boolean;
  userLiked?: boolean;
  replies?: PostComment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  category: PostCategory;
  tags: string[];
  journalId?: number;
  status?: PostStatus;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  category?: PostCategory;
  tags?: string[];
  journalId?: number;
}

export interface CreateCommentData {
  content: string;
  parentId?: number;
}

export interface PostFilters {
  category?: string;
  tag?: string;
  journalId?: number;
  userId?: string;
  sortBy?: 'hot' | 'latest' | 'likes' | 'comments' | 'views';
  page?: number;
  limit?: number;
  search?: string;
}

export interface PostPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  experience: '投稿经验',
  discussion: '学术讨论',
  question: '求助问答',
  news: '资讯分享',
  review: '文献评述',
  other: '其他'
};

export const SORT_OPTIONS = [
  { value: 'hot', label: '综合热度' },
  { value: 'latest', label: '最新发布' },
  { value: 'likes', label: '最多点赞' },
  { value: 'comments', label: '最多回复' },
  { value: 'views', label: '最多浏览' }
];
