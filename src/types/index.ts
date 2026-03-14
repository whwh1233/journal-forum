// ==================== 期刊系统类型 ====================

export interface Journal {
  journalId: string;
  name: string;
  supervisor?: string;
  sponsor?: string;
  issn?: string;
  cn?: string;
  publicationCycle?: string;
  articleCount?: number;
  avgCitations?: number;
  impactFactor?: number;
  totalCitations?: number;
  downloadCount?: number;
  fundPaperCount?: number;
  otherCitationRate?: number;
  fundPaperRate?: string;
  coverImageUrl?: string;
  formerName?: string;
  editorInChief?: string;
  language?: string;
  address?: string;
  postalCode?: string;
  email?: string;
  phone?: string;
  introduction?: string;
  mainColumns?: string[];
  awards?: string[];
  indexingHistory?: string[];
  levels?: string[];
  ratingCache?: JournalRatingCache;
  category?: string;
  isFavorited?: boolean;
}

export interface JournalLevel {
  id: number;
  journalId: string;
  levelName: string;
}

export interface JournalRatingCache {
  journalId: string;
  rating: number;
  ratingCount: number;
  reviewSpeed?: number;
  editorAttitude?: number;
  acceptDifficulty?: number;
  reviewQuality?: number;
  overallExperience?: number;
}

// 期刊分类
export interface Category {
  id: number;
  name: string;
  level?: number;
  parentId?: number;
  journalCount?: number;
  children?: Category[];
}

export interface Comment {
  id: string;
  userId: number;
  userName: string;
  journalId: string;
  parentId: string | null;
  content: string;
  rating?: number;
  dimensionRatings?: DimensionRatings;
  likes?: string[];
  likeCount?: number;
  isLikedByMe?: boolean;
  createdAt: string;
  updatedAt?: string;
  isDeleted: boolean;
  replies?: Comment[];
  userBadges?: Badge[];
}

// 多维评分维度
export interface DimensionRatings {
  reviewSpeed?: number;
  editorAttitude?: number;
  acceptDifficulty?: number;
  reviewQuality?: number;
  overallExperience?: number;
}

export const DIMENSION_LABELS: Record<string, string> = {
  reviewSpeed: '审稿速度',
  editorAttitude: '编辑态度',
  acceptDifficulty: '录用难度',
  reviewQuality: '审稿质量',
  overallExperience: '综合体验'
};

export const DIMENSION_KEYS = ['reviewSpeed', 'editorAttitude', 'acceptDifficulty', 'reviewQuality', 'overallExperience'] as const;

export interface RatingSummary {
  journalId: string;
  rating: number;
  ratingCount: number;
  dimensionAverages: DimensionRatings;
  dimensionLabels: Record<string, string>;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  bio?: string;
  role?: 'user' | 'admin' | 'superadmin';
}

export interface UserProfile {
  id: number;
  email: string;
  name?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  institution?: string;
  website?: string;
  role: 'user' | 'admin' | 'superadmin';
  createdAt: string;
  pinnedBadges?: number[];
  stats?: {
    commentCount: number;
    favoriteCount: number;
    followingCount: number;
    followerCount: number;
    points: number;
    level: number;
  };
}

export interface AdminUser {
  id: number;
  email: string;
  name?: string;
  role: 'user' | 'admin' | 'superadmin';
  status: 'active' | 'disabled';
  createdAt: string;
  commentCount: number;
}

export interface AdminComment {
  id: string;
  journalId: string;
  journalName: string;
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
  journalId: string;
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
  journalId: string;
  journalName: string;
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
    points: number;
    level: number;
  };
  recentActivity: any[];
}

// 徽章系统类型
export interface Badge {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'activity' | 'identity' | 'honor';
  type: 'auto' | 'manual';
  triggerCondition?: {
    metric: string;
    threshold: number;
  };
  priority: number;
  isActive: boolean;
  createdAt: string;
  grantedAt?: string;
  isNew?: boolean;
  grantedBy?: number;
  holderCount?: number;
}

export interface UserBadgesResponse {
  badges: Badge[];
  pinnedBadges: Badge[];
}

export interface MyBadgesResponse {
  badges: Badge[];
  pinnedBadges: Badge[];
  hasNewBadges: boolean;
}

export interface BadgeStats {
  totalBadges: number;
  activeBadges: number;
  inactiveBadges: number;
  byType: {
    auto: number;
    manual: number;
    identity: number;
  };
  totalGrants: number;
  usersWithBadges: number;
  topBadges: Array<{
    id: number;
    name: string;
    icon: string;
    count: number;
  }>;
  recentGrants: Array<{
    userBadgeId: number;
    badge: { id: number; name: string; icon: string } | null;
    user: { id: number; name: string; email: string } | null;
    grantedAt: string;
  }>;
}

// ==================== 投稿记录系统类型 ====================

export interface SubmissionStatusHistory {
  id: number;
  submissionId: number;
  status: string;
  date: string;
  note?: string;
  createdAt: string;
}

export interface SubmissionRecord {
  id: number;
  userId: string;
  manuscriptId: number;
  journalId?: string;
  journalName?: string;
  submissionDate: string;
  status: string;
  journal?: Journal;
  statusHistory?: SubmissionStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface Manuscript {
  id: number;
  userId: string;
  title: string;
  currentStatus: string;
  submissions?: SubmissionRecord[];
  createdAt: string;
  updatedAt: string;
}

// 预定义投稿状态（也允许用户自定义）
export const SUBMISSION_STATUS_OPTIONS = [
  { value: 'submitted', label: '已投递', color: '#3b82f6' },
  { value: 'with_editor', label: '编辑处理中', color: '#8b5cf6' },
  { value: 'under_review', label: '外审中', color: '#f59e0b' },
  { value: 'major_revision', label: '大修', color: '#ef4444' },
  { value: 'minor_revision', label: '小修', color: '#f97316' },
  { value: 'revision_submitted', label: '修回已提交', color: '#6366f1' },
  { value: 'accepted', label: '录用', color: '#10b981' },
  { value: 'rejected', label: '拒稿', color: '#dc2626' },
  { value: 'withdrawn', label: '撤稿', color: '#6b7280' },
] as const;

export const getStatusLabel = (status: string): string => {
  const found = SUBMISSION_STATUS_OPTIONS.find(s => s.value === status);
  return found ? found.label : status;
};

export const getStatusColor = (status: string): string => {
  const found = SUBMISSION_STATUS_OPTIONS.find(s => s.value === status);
  return found ? found.color : '#6b7280';
};
