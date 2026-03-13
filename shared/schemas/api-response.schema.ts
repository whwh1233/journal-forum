/**
 * API Response Zod Schemas
 * Generic API response wrappers and error schemas
 */

import { z } from 'zod';
import { PaginationInfoSchema } from './common.schema';

// ==================== Base API Response ====================

/**
 * Creates a success response schema with the given data schema
 */
export const createSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

/**
 * Creates a paginated response schema with the given item schema
 */
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    pagination: PaginationInfoSchema,
    message: z.string().optional(),
  });

// ==================== Error Response ====================

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
});

// ==================== Generic API Response ====================

/**
 * Creates a generic API response schema that can be either success or error
 */
export const createApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.discriminatedUnion('success', [
    createSuccessResponseSchema(dataSchema),
    ErrorResponseSchema,
  ]);

// ==================== Common Response Types ====================

// Simple success response without data
export const SimpleSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
});

// Boolean data response (for toggle operations)
export const BooleanResponseSchema = createSuccessResponseSchema(z.boolean());

// Count response
export const CountResponseSchema = createSuccessResponseSchema(
  z.object({
    count: z.number().int(),
  })
);

// ID response (for create operations)
export const IdResponseSchema = createSuccessResponseSchema(
  z.object({
    id: z.union([z.string(), z.number()]),
  })
);

// ==================== Auth Response ====================

export const AuthResponseSchema = createSuccessResponseSchema(
  z.object({
    token: z.string(),
    user: z.object({
      id: z.string(),
      email: z.string(),
      name: z.string().optional(),
      avatar: z.string().optional(),
      role: z.enum(['user', 'admin', 'superadmin']),
    }),
  })
);

// ==================== Validation Error ====================

export const ValidationErrorSchema = z.object({
  success: z.literal(false),
  error: z.literal('Validation Error'),
  details: z.array(
    z.object({
      path: z.array(z.union([z.string(), z.number()])),
      message: z.string(),
    })
  ),
});

// ==================== Rate Limit Error ====================

export const RateLimitErrorSchema = z.object({
  success: z.literal(false),
  error: z.literal('Too Many Requests'),
  retryAfter: z.number().int(),
});

// ==================== Helper Types ====================

// Type inference helpers
export type SuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type PaginatedResponse<T> = {
  success: true;
  data: T[];
  pagination: z.infer<typeof PaginationInfoSchema>;
  message?: string;
};

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
