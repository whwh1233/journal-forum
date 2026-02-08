export interface Journal {
  id: number;
  title: string;
  issn: string;
  category: string;
  rating: number;
  description: string;
  reviews: Review[];
}

export interface Review {
  author: string;
  rating: number;
  content: string;
}

export interface Comment {
  id: string;                    // journalId-timestamp-nanoid
  userId: number;
  userName: string;
  journalId: number;
  parentId: string | null;       // 父评论ID
  content: string;
  rating?: number;               // 仅顶级评论有评分
  createdAt: string;
  updatedAt?: string;
  isDeleted: boolean;
  replies?: Comment[];           // 前端组装
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: 'user' | 'admin';
}

export interface UserProfile {
  id: number;
  email: string;
  name?: string;
  avatar?: string;              // 头像 URL
  bio?: string;                 // 个人简介
  location?: string;
  institution?: string;
  website?: string;
  role: 'user' | 'admin';
  createdAt: string;
  stats?: {
    commentCount: number;
    favoriteCount: number;
    followingCount: number;
    followerCount: number;
  };
}

export interface AdminUser {
  id: number;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  status: 'active' | 'disabled';
  createdAt: string;
  commentCount: number;
}

export interface AdminComment {
  id: string;
  journalId: number;
  journalTitle: string;
  author: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface AdminStats {
  userCount: number;
  journalCount: number;
  commentCount: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface Favorite {
  id: number;
  userId: number;
  journalId: number;
  createdAt: string;
}

export interface Follow {
  id: number;
  followerId: number;
  followingId: number;
  createdAt: string;
}

export interface MyComment {
  id: string;
  journalId: number;
  journalTitle: string;
  content: string;
  rating?: number;
  createdAt: string;
}

export interface ActivityStats {
  stats: {
    commentCount: number;
    favoriteCount: number;
    followingCount: number;
    followerCount: number;
  };
  recentActivity: any[];  // Will be defined later
}

export type CategoryMap = {
  [key: string]: string;
};