/**
 * Post Zod Schemas
 * Community posts, post comments related schemas
 */

import { z } from 'zod';

// ==================== Post Category ====================

export const PostCategorySchema = z.enum([
  'experience',
  'discussion',
  'question',
  'news',
  'review',
  'other',
]);

// ==================== Post Status ====================

export const PostStatusSchema = z.enum(['published', 'draft', 'reported']);

// ==================== Post ====================

export const PostSchema = z.object({
  id: z.number().int(),
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().optional(),
  title: z.string(),
  content: z.string(),
  category: PostCategorySchema,
  tags: z.array(z.string()),
  journalId: z.number().int().optional(),
  journalTitle: z.string().optional(),

  viewCount: z.number().int(),
  likeCount: z.number().int(),
  commentCount: z.number().int(),
  favoriteCount: z.number().int(),
  followCount: z.number().int(),
  hotScore: z.number(),

  isPinned: z.boolean(),
  isDeleted: z.boolean(),
  status: PostStatusSchema,

  // User interaction state
  userLiked: z.boolean().optional(),
  userFavorited: z.boolean().optional(),
  userFollowed: z.boolean().optional(),

  createdAt: z.string(),
  updatedAt: z.string(),
});

// ==================== Post Comment (Recursive) ====================

// Define the base post comment shape
const BasePostCommentSchema = z.object({
  id: z.number().int(),
  postId: z.number().int(),
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().optional(),
  parentId: z.number().int().optional(),
  content: z.string(),
  likeCount: z.number().int(),
  isDeleted: z.boolean(),
  userLiked: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Define the recursive PostComment type
export type PostCommentSchemaType = z.infer<typeof BasePostCommentSchema> & {
  replies?: PostCommentSchemaType[];
};

// Create the recursive schema using z.lazy()
export const PostCommentSchema: z.ZodType<PostCommentSchemaType> = BasePostCommentSchema.extend({
  replies: z.lazy(() => z.array(PostCommentSchema)).optional(),
});

// ==================== Create Post Data ====================

export const CreatePostDataSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  category: PostCategorySchema,
  tags: z.array(z.string()).max(10),
  journalId: z.number().int().optional(),
});

// ==================== Update Post Data ====================

export const UpdatePostDataSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  category: PostCategorySchema.optional(),
  tags: z.array(z.string()).max(10).optional(),
  journalId: z.number().int().optional(),
});

// ==================== Create Comment Data ====================

export const CreatePostCommentDataSchema = z.object({
  content: z.string().min(1),
  parentId: z.number().int().optional(),
});

// ==================== Post Filters ====================

export const PostFiltersSchema = z.object({
  category: z.string().optional(),
  tag: z.string().optional(),
  journalId: z.number().int().optional(),
  userId: z.string().optional(),
  sortBy: z.enum(['hot', 'latest', 'likes', 'comments', 'views']).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
});

// ==================== Post Pagination ====================

export const PostPaginationSchema = z.object({
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

// ==================== Post Report ====================

export const PostReportReasonSchema = z.enum([
  'spam',
  'inappropriate',
  'harassment',
  'misinformation',
  'other',
]);

export const CreatePostReportSchema = z.object({
  reason: PostReportReasonSchema,
  description: z.string().optional(),
});

export const PostReportSchema = z.object({
  id: z.number().int(),
  postId: z.number().int(),
  userId: z.string(),
  reason: PostReportReasonSchema,
  description: z.string().optional(),
  status: z.enum(['pending', 'resolved', 'dismissed']),
  resolvedBy: z.number().int().optional(),
  resolvedAt: z.string().optional(),
  createdAt: z.string(),
});

// ==================== Post List Response ====================

export const PostListResponseSchema = z.object({
  posts: z.array(PostSchema),
  pagination: PostPaginationSchema,
});
