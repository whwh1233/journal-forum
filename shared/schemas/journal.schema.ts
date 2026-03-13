/**
 * Journal Zod Schemas
 * Journal, category, rating related schemas
 */

import { z } from 'zod';

// ==================== Dimension Ratings ====================

export const DimensionRatingsSchema = z.object({
  reviewSpeed: z.number().min(0).max(5).optional(),
  editorAttitude: z.number().min(0).max(5).optional(),
  acceptDifficulty: z.number().min(0).max(5).optional(),
  reviewQuality: z.number().min(0).max(5).optional(),
  overallExperience: z.number().min(0).max(5).optional(),
});

export const DIMENSION_KEYS = [
  'reviewSpeed',
  'editorAttitude',
  'acceptDifficulty',
  'reviewQuality',
  'overallExperience',
] as const;

export const DimensionKeySchema = z.enum(DIMENSION_KEYS);

// ==================== Journal Rating Cache ====================

export const JournalRatingCacheSchema = z.object({
  journalId: z.string(),
  rating: z.number().min(0).max(5),
  ratingCount: z.number().int().min(0),
  reviewSpeed: z.number().min(0).max(5).optional(),
  editorAttitude: z.number().min(0).max(5).optional(),
  acceptDifficulty: z.number().min(0).max(5).optional(),
  reviewQuality: z.number().min(0).max(5).optional(),
  overallExperience: z.number().min(0).max(5).optional(),
});

// ==================== Journal Level ====================

export const JournalLevelSchema = z.object({
  id: z.number().int(),
  journalId: z.string(),
  levelName: z.string(),
});

// ==================== Category ====================

export const CategorySchema: z.ZodType<{
  id: number;
  name: string;
  level?: number;
  parentId?: number;
  journalCount?: number;
  children?: Array<{
    id: number;
    name: string;
    level?: number;
    parentId?: number;
    journalCount?: number;
    children?: any[];
  }>;
}> = z.lazy(() =>
  z.object({
    id: z.number().int(),
    name: z.string(),
    level: z.number().int().optional(),
    parentId: z.number().int().optional(),
    journalCount: z.number().int().optional(),
    children: z.array(CategorySchema).optional(),
  })
);

// ==================== Journal ====================

export const JournalSchema = z.object({
  journalId: z.string(),
  name: z.string(),
  supervisor: z.string().optional(),
  sponsor: z.string().optional(),
  issn: z.string().optional(),
  cn: z.string().optional(),
  publicationCycle: z.string().optional(),
  articleCount: z.number().int().optional(),
  avgCitations: z.number().optional(),
  impactFactor: z.number().optional(),
  totalCitations: z.number().int().optional(),
  downloadCount: z.number().int().optional(),
  fundPaperCount: z.number().int().optional(),
  otherCitationRate: z.number().optional(),
  fundPaperRate: z.string().optional(),
  coverImageUrl: z.string().optional(),
  formerName: z.string().optional(),
  editorInChief: z.string().optional(),
  language: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  introduction: z.string().optional(),
  mainColumns: z.array(z.string()).optional(),
  awards: z.array(z.string()).optional(),
  indexingHistory: z.array(z.string()).optional(),
  levels: z.array(z.string()).optional(),
  ratingCache: JournalRatingCacheSchema.optional(),
  category: z.string().optional(),
});

// ==================== Rating Summary ====================

export const RatingSummarySchema = z.object({
  journalId: z.string(),
  rating: z.number().min(0).max(5),
  ratingCount: z.number().int().min(0),
  dimensionAverages: DimensionRatingsSchema,
  dimensionLabels: z.record(z.string()),
});

// ==================== Journal Search ====================

export const JournalSearchParamsSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// ==================== Journal Filter ====================

export const JournalFilterSchema = z.object({
  category: z.string().optional(),
  level: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'rating', 'ratingCount', 'impactFactor']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
