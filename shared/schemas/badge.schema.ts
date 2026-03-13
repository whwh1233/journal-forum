/**
 * Badge Zod Schemas
 * Badge, user badges, badge stats related schemas
 */

import { z } from 'zod';

// ==================== Badge Category ====================

export const BadgeCategorySchema = z.enum(['activity', 'identity', 'honor']);

// ==================== Badge Type ====================

export const BadgeTypeSchema = z.enum(['auto', 'manual']);

// ==================== Trigger Condition ====================

export const TriggerConditionSchema = z.object({
  metric: z.string(),
  threshold: z.number(),
});

// ==================== Badge ====================

export const BadgeSchema = z.object({
  id: z.number().int(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  color: z.string(),
  category: BadgeCategorySchema,
  type: BadgeTypeSchema,
  triggerCondition: TriggerConditionSchema.optional(),
  priority: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string(),
  // Additional fields when queried with user context
  grantedAt: z.string().optional(),
  isNew: z.boolean().optional(),
  grantedBy: z.number().int().optional(),
  holderCount: z.number().int().optional(),
});

// ==================== User Badges Response ====================

export const UserBadgesResponseSchema = z.object({
  badges: z.array(BadgeSchema),
  pinnedBadges: z.array(BadgeSchema),
});

// ==================== My Badges Response ====================

export const MyBadgesResponseSchema = z.object({
  badges: z.array(BadgeSchema),
  pinnedBadges: z.array(BadgeSchema),
  hasNewBadges: z.boolean(),
});

// ==================== Badge Stats ====================

export const TopBadgeSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  icon: z.string(),
  count: z.number().int(),
});

export const RecentGrantSchema = z.object({
  userBadgeId: z.number().int(),
  badge: z.object({
    id: z.number().int(),
    name: z.string(),
    icon: z.string(),
  }).nullable(),
  user: z.object({
    id: z.number().int(),
    name: z.string(),
    email: z.string(),
  }).nullable(),
  grantedAt: z.string(),
});

export const BadgeStatsSchema = z.object({
  totalBadges: z.number().int(),
  activeBadges: z.number().int(),
  inactiveBadges: z.number().int(),
  byType: z.object({
    auto: z.number().int(),
    manual: z.number().int(),
    identity: z.number().int(),
  }),
  totalGrants: z.number().int(),
  usersWithBadges: z.number().int(),
  topBadges: z.array(TopBadgeSchema),
  recentGrants: z.array(RecentGrantSchema),
});

// ==================== Create/Update Badge ====================

export const CreateBadgeSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().min(1),
  category: BadgeCategorySchema,
  type: BadgeTypeSchema,
  triggerCondition: TriggerConditionSchema.optional(),
  priority: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateBadgeSchema = CreateBadgeSchema.partial();

// ==================== Grant Badge ====================

export const GrantBadgeSchema = z.object({
  userId: z.number().int(),
  badgeId: z.number().int(),
  reason: z.string().optional(),
});

// ==================== Pin Badges ====================

export const PinBadgesSchema = z.object({
  badgeIds: z.array(z.number().int()).max(5),
});
