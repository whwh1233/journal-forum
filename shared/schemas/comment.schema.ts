/**
 * Comment Zod Schemas
 * Journal comments (recursive), admin comments related schemas
 */

import { z } from 'zod';
import { DimensionRatingsSchema } from './journal.schema';
import { BadgeSchema } from './badge.schema';

// ==================== Comment (Recursive) ====================

// Define the base comment shape
const BaseCommentSchema = z.object({
  id: z.string(),
  userId: z.number().int(),
  userName: z.string(),
  journalId: z.string(),
  parentId: z.string().nullable(),
  content: z.string(),
  rating: z.number().min(0).max(5).optional(),
  dimensionRatings: DimensionRatingsSchema.optional(),
  likes: z.array(z.string()).optional(),
  likeCount: z.number().int().optional(),
  isLikedByMe: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  isDeleted: z.boolean(),
  userBadges: z.array(BadgeSchema).optional(),
});

// Define the recursive Comment type
export type CommentSchemaType = z.infer<typeof BaseCommentSchema> & {
  replies?: CommentSchemaType[];
};

// Create the recursive schema using z.lazy()
export const CommentSchema: z.ZodType<CommentSchemaType> = BaseCommentSchema.extend({
  replies: z.lazy(() => z.array(CommentSchema)).optional(),
});

// ==================== My Comment ====================

export const MyCommentSchema = z.object({
  id: z.string(),
  journalId: z.string(),
  journalName: z.string(),
  content: z.string(),
  rating: z.number().min(0).max(5).optional(),
  createdAt: z.string(),
});

// ==================== Admin Comment ====================

export const AdminCommentSchema = z.object({
  id: z.string(),
  journalId: z.string(),
  journalName: z.string(),
  author: z.string(),
  rating: z.number().min(0).max(5),
  content: z.string(),
  createdAt: z.string(),
});

// ==================== Admin Stats ====================

export const AdminStatsSchema = z.object({
  userCount: z.number().int(),
  journalCount: z.number().int(),
  commentCount: z.number().int(),
});

// ==================== Create Comment ====================

export const CreateCommentSchema = z.object({
  journalId: z.string(),
  content: z.string().min(1),
  rating: z.number().min(1).max(5).optional(),
  dimensionRatings: DimensionRatingsSchema.optional(),
  parentId: z.string().optional(),
});

// ==================== Update Comment ====================

export const UpdateCommentSchema = z.object({
  content: z.string().min(1).optional(),
  rating: z.number().min(1).max(5).optional(),
  dimensionRatings: DimensionRatingsSchema.optional(),
});

// ==================== Comment Filters ====================

export const CommentFiltersSchema = z.object({
  journalId: z.string().optional(),
  userId: z.number().int().optional(),
  sortBy: z.enum(['newest', 'oldest', 'rating', 'likes']).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
