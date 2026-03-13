/**
 * Shared Types
 * TypeScript types inferred from Zod schemas
 *
 * These types are automatically derived from the Zod schemas,
 * ensuring type safety and validation are always in sync.
 */

import { z } from 'zod';

// Import all schemas
import {
  // Common
  PaginationInfoSchema,
  FavoriteSchema,
  FollowSchema,
  UserStatsSchema,
  ActivityStatsSchema,
  UserRoleSchema,
  UserStatusSchema,
  // User
  UserSchema,
  UserProfileSchema,
  AdminUserSchema,
  LoginCredentialsSchema,
  RegisterDataSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
  // Journal
  DimensionRatingsSchema,
  DimensionKeySchema,
  JournalRatingCacheSchema,
  JournalLevelSchema,
  CategorySchema,
  JournalSchema,
  RatingSummarySchema,
  JournalSearchParamsSchema,
  JournalFilterSchema,
  // Badge
  BadgeCategorySchema,
  BadgeTypeSchema,
  TriggerConditionSchema,
  BadgeSchema,
  UserBadgesResponseSchema,
  MyBadgesResponseSchema,
  BadgeStatsSchema,
  CreateBadgeSchema,
  UpdateBadgeSchema,
  GrantBadgeSchema,
  PinBadgesSchema,
  // Comment
  MyCommentSchema,
  AdminCommentSchema,
  AdminStatsSchema,
  CreateCommentSchema,
  UpdateCommentSchema,
  CommentFiltersSchema,
  // Post
  PostCategorySchema,
  PostStatusSchema,
  PostSchema,
  CreatePostDataSchema,
  UpdatePostDataSchema,
  CreatePostCommentDataSchema,
  PostFiltersSchema,
  PostPaginationSchema,
  PostReportReasonSchema,
  CreatePostReportSchema,
  PostReportSchema,
  PostListResponseSchema,
  // Submission
  SubmissionStatusSchema,
  SubmissionStatusHistorySchema,
  SubmissionRecordSchema,
  ManuscriptSchema,
  CreateManuscriptSchema,
  UpdateManuscriptSchema,
  CreateSubmissionSchema,
  UpdateSubmissionSchema,
  AddStatusHistorySchema,
  SubmissionStatusOptionSchema,
  // API Response
  ErrorResponseSchema,
  SimpleSuccessResponseSchema,
  AuthResponseSchema,
  ValidationErrorSchema,
  RateLimitErrorSchema,
} from '../schemas';

// Re-export recursive types
export type { CommentSchemaType, PostCommentSchemaType } from '../schemas';

// Re-export API response utility types
export type { SuccessResponse, PaginatedResponse, ErrorResponse, ApiResponse } from '../schemas';

// ==================== Common Types ====================

export type PaginationInfo = z.infer<typeof PaginationInfoSchema>;
export type Favorite = z.infer<typeof FavoriteSchema>;
export type Follow = z.infer<typeof FollowSchema>;
export type UserStats = z.infer<typeof UserStatsSchema>;
export type ActivityStats = z.infer<typeof ActivityStatsSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserStatus = z.infer<typeof UserStatusSchema>;

// ==================== User Types ====================

export type User = z.infer<typeof UserSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type AdminUser = z.infer<typeof AdminUserSchema>;
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;
export type RegisterData = z.infer<typeof RegisterDataSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;

// ==================== Journal Types ====================

export type DimensionRatings = z.infer<typeof DimensionRatingsSchema>;
export type DimensionKey = z.infer<typeof DimensionKeySchema>;
export type JournalRatingCache = z.infer<typeof JournalRatingCacheSchema>;
export type JournalLevel = z.infer<typeof JournalLevelSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Journal = z.infer<typeof JournalSchema>;
export type RatingSummary = z.infer<typeof RatingSummarySchema>;
export type JournalSearchParams = z.infer<typeof JournalSearchParamsSchema>;
export type JournalFilter = z.infer<typeof JournalFilterSchema>;

// ==================== Badge Types ====================

export type BadgeCategory = z.infer<typeof BadgeCategorySchema>;
export type BadgeType = z.infer<typeof BadgeTypeSchema>;
export type TriggerCondition = z.infer<typeof TriggerConditionSchema>;
export type Badge = z.infer<typeof BadgeSchema>;
export type UserBadgesResponse = z.infer<typeof UserBadgesResponseSchema>;
export type MyBadgesResponse = z.infer<typeof MyBadgesResponseSchema>;
export type BadgeStats = z.infer<typeof BadgeStatsSchema>;
export type CreateBadge = z.infer<typeof CreateBadgeSchema>;
export type UpdateBadge = z.infer<typeof UpdateBadgeSchema>;
export type GrantBadge = z.infer<typeof GrantBadgeSchema>;
export type PinBadges = z.infer<typeof PinBadgesSchema>;

// ==================== Comment Types ====================

export type MyComment = z.infer<typeof MyCommentSchema>;
export type AdminComment = z.infer<typeof AdminCommentSchema>;
export type AdminStats = z.infer<typeof AdminStatsSchema>;
export type CreateComment = z.infer<typeof CreateCommentSchema>;
export type UpdateComment = z.infer<typeof UpdateCommentSchema>;
export type CommentFilters = z.infer<typeof CommentFiltersSchema>;

// ==================== Post Types ====================

export type PostCategory = z.infer<typeof PostCategorySchema>;
export type PostStatus = z.infer<typeof PostStatusSchema>;
export type Post = z.infer<typeof PostSchema>;
export type CreatePostData = z.infer<typeof CreatePostDataSchema>;
export type UpdatePostData = z.infer<typeof UpdatePostDataSchema>;
export type CreatePostCommentData = z.infer<typeof CreatePostCommentDataSchema>;
export type PostFilters = z.infer<typeof PostFiltersSchema>;
export type PostPagination = z.infer<typeof PostPaginationSchema>;
export type PostReportReason = z.infer<typeof PostReportReasonSchema>;
export type CreatePostReport = z.infer<typeof CreatePostReportSchema>;
export type PostReport = z.infer<typeof PostReportSchema>;
export type PostListResponse = z.infer<typeof PostListResponseSchema>;

// ==================== Submission Types ====================

export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;
export type SubmissionStatusHistory = z.infer<typeof SubmissionStatusHistorySchema>;
export type SubmissionRecord = z.infer<typeof SubmissionRecordSchema>;
export type Manuscript = z.infer<typeof ManuscriptSchema>;
export type CreateManuscript = z.infer<typeof CreateManuscriptSchema>;
export type UpdateManuscript = z.infer<typeof UpdateManuscriptSchema>;
export type CreateSubmission = z.infer<typeof CreateSubmissionSchema>;
export type UpdateSubmission = z.infer<typeof UpdateSubmissionSchema>;
export type AddStatusHistory = z.infer<typeof AddStatusHistorySchema>;
export type SubmissionStatusOption = z.infer<typeof SubmissionStatusOptionSchema>;

// ==================== API Response Types ====================

export type SimpleSuccessResponse = z.infer<typeof SimpleSuccessResponseSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type RateLimitError = z.infer<typeof RateLimitErrorSchema>;
