import { z } from 'zod';
import { VALIDATION_LIMITS, VALIDATION_ENUMS } from './constants';

/**
 * Output validation schemas for API responses
 * These ensure our API contract is strictly enforced
 */

// Common fields
export const TimestampSchema = z.string().datetime();
export const UuidSchema = z.string().uuid();

// Enum schemas to match database values exactly
export const SentimentEnumSchema = z.enum(VALIDATION_ENUMS.SENTIMENT);
export const ActionItemStatusSchema = z.enum(VALIDATION_ENUMS.ACTION_ITEM_STATUS);

// Output schemas for created entities (201 responses)
export const CreatedClientOutSchema = z.object({
  id: UuidSchema,
  name: z.string().min(VALIDATION_LIMITS.CLIENT_NAME_MIN).max(VALIDATION_LIMITS.CLIENT_NAME_MAX),
  notes: z.string().nullable(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
}).strict();

export const CreatedCallOutSchema = z.object({
  id: UuidSchema,
  clientId: UuidSchema,
  ts: TimestampSchema,
  durationSec: z.number().int().min(VALIDATION_LIMITS.CALL_DURATION_MIN).max(VALIDATION_LIMITS.CALL_DURATION_MAX),
  sentiment: SentimentEnumSchema,
  score: z.number().min(VALIDATION_LIMITS.CALL_SCORE_MIN).max(VALIDATION_LIMITS.CALL_SCORE_MAX),
  bookingLikelihood: z.number().min(VALIDATION_LIMITS.CALL_BOOKING_LIKELIHOOD_MIN).max(VALIDATION_LIMITS.CALL_BOOKING_LIKELIHOOD_MAX),
  notes: z.string().nullable(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
}).strict();

export const CreatedActionItemOutSchema = z.object({
  id: UuidSchema,
  clientId: UuidSchema,
  owner: z.string().nullable(),
  text: z.string().min(VALIDATION_LIMITS.ACTION_ITEM_TEXT_MIN).max(VALIDATION_LIMITS.ACTION_ITEM_TEXT_MAX),
  due: TimestampSchema.nullable(),
  status: ActionItemStatusSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
}).strict();

// Error response schema
export const ErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  traceId: z.string().optional(),
}).strict();

// Type exports for TypeScript
export type CreatedClientOut = z.infer<typeof CreatedClientOutSchema>;
export type CreatedCallOut = z.infer<typeof CreatedCallOutSchema>;
export type CreatedActionItemOut = z.infer<typeof CreatedActionItemOutSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;