/**
 * Common Zod Schemas
 * Shared types used across multiple modules
 */

import { z } from 'zod';

// ==================== Pagination ====================

export const PaginationInfoSchema = z.object({
  currentPage: z.number().int().min(1),
  totalPages: z.number().int().min(0),
  totalItems: z.number().int().min(0),
  itemsPerPage: z.number().int().min(1),
});

// ==================== Favorite ====================

export const FavoriteSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  journalId: z.string(),
  createdAt: z.string(),
});

// ==================== Follow ====================

export const FollowSchema = z.object({
  id: z.number().int(),
  followerId: z.number().int(),
  followingId: z.number().int(),
  createdAt: z.string(),
});

// ==================== User Stats ====================

export const UserStatsSchema = z.object({
  commentCount: z.number().int().min(0),
  favoriteCount: z.number().int().min(0),
  followingCount: z.number().int().min(0),
  followerCount: z.number().int().min(0),
  points: z.number().int().min(0),
  level: z.number().int().min(0),
});

// ==================== Activity Stats ====================

export const ActivityStatsSchema = z.object({
  stats: UserStatsSchema,
  recentActivity: z.array(z.any()),
});

// ==================== Role ====================

export const UserRoleSchema = z.enum(['user', 'admin', 'superadmin']);

// ==================== Status ====================

export const UserStatusSchema = z.enum(['active', 'disabled']);
