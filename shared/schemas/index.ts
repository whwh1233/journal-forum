/**
 * Shared Zod Schemas
 * Central export point for all validation schemas
 */

// ==================== Common Schemas ====================
export {
  PaginationInfoSchema,
  FavoriteSchema,
  FollowSchema,
  UserStatsSchema,
  ActivityStatsSchema,
  UserRoleSchema,
  UserStatusSchema,
} from './common.schema';

// ==================== User Schemas ====================
export {
  UserSchema,
  UserProfileSchema,
  AdminUserSchema,
  LoginCredentialsSchema,
  RegisterDataSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
} from './user.schema';

// ==================== Journal Schemas ====================
export {
  DimensionRatingsSchema,
  DimensionKeySchema,
  DIMENSION_KEYS,
  JournalRatingCacheSchema,
  JournalLevelSchema,
  CategorySchema,
  JournalSchema,
  RatingSummarySchema,
  JournalSearchParamsSchema,
  JournalFilterSchema,
} from './journal.schema';

// ==================== Badge Schemas ====================
export {
  BadgeCategorySchema,
  BadgeTypeSchema,
  TriggerConditionSchema,
  BadgeSchema,
  UserBadgesResponseSchema,
  MyBadgesResponseSchema,
  TopBadgeSchema,
  RecentGrantSchema,
  BadgeStatsSchema,
  CreateBadgeSchema,
  UpdateBadgeSchema,
  GrantBadgeSchema,
  PinBadgesSchema,
} from './badge.schema';

// ==================== Comment Schemas ====================
export {
  CommentSchema,
  MyCommentSchema,
  AdminCommentSchema,
  AdminStatsSchema,
  CreateCommentSchema,
  UpdateCommentSchema,
  CommentFiltersSchema,
} from './comment.schema';
export type { CommentSchemaType } from './comment.schema';

// ==================== Post Schemas ====================
export {
  PostCategorySchema,
  PostStatusSchema,
  PostSchema,
  PostCommentSchema,
  CreatePostDataSchema,
  UpdatePostDataSchema,
  CreatePostCommentDataSchema,
  PostFiltersSchema,
  PostPaginationSchema,
  PostReportReasonSchema,
  CreatePostReportSchema,
  PostReportSchema,
  PostListResponseSchema,
} from './post.schema';
export type { PostCommentSchemaType } from './post.schema';

// ==================== Submission Schemas ====================
export {
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
  SUBMISSION_STATUS_OPTIONS,
} from './submission.schema';

// ==================== API Response Schemas ====================
export {
  createSuccessResponseSchema,
  createPaginatedResponseSchema,
  createApiResponseSchema,
  ErrorResponseSchema,
  SimpleSuccessResponseSchema,
  BooleanResponseSchema,
  CountResponseSchema,
  IdResponseSchema,
  AuthResponseSchema,
  ValidationErrorSchema,
  RateLimitErrorSchema,
} from './api-response.schema';
export type {
  SuccessResponse,
  PaginatedResponse,
  ErrorResponse,
  ApiResponse,
} from './api-response.schema';
