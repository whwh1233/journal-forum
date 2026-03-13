/**
 * User Zod Schemas
 * User, profile, authentication related schemas
 */

import { z } from 'zod';
import { UserRoleSchema, UserStatusSchema, UserStatsSchema } from './common.schema';

// ==================== Basic User ====================

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  role: UserRoleSchema.optional(),
});

// ==================== User Profile ====================

export const UserProfileSchema = z.object({
  id: z.number().int(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  institution: z.string().optional(),
  website: z.string().optional(),
  role: UserRoleSchema,
  createdAt: z.string(),
  pinnedBadges: z.array(z.number().int()).optional(),
  stats: UserStatsSchema.optional(),
});

// ==================== Admin User ====================

export const AdminUserSchema = z.object({
  id: z.number().int(),
  email: z.string().email(),
  name: z.string().optional(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  createdAt: z.string(),
  commentCount: z.number().int(),
});

// ==================== Authentication ====================

export const LoginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RegisterDataSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ==================== Update Profile ====================

export const UpdateProfileSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  institution: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  avatar: z.string().optional(),
});

// ==================== Change Password ====================

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ['confirmPassword'],
});
