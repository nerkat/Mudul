import { z } from 'zod';
import { VALIDATION_LIMITS, VALIDATION_ENUMS } from './constants';

// Form schemas for CRUD operations as specified in the issue

export const NewClientForm = z.object({
  name: z.string().min(VALIDATION_LIMITS.CLIENT_NAME_MIN).max(VALIDATION_LIMITS.CLIENT_NAME_MAX),
  notes: z.string().max(VALIDATION_LIMITS.CLIENT_NOTES_MAX).optional(),
}).strict();

export const LogCallForm = z.object({
  ts: z.string().datetime(),           // ISO
  durationSec: z.number().int().min(VALIDATION_LIMITS.CALL_DURATION_MIN).max(VALIDATION_LIMITS.CALL_DURATION_MAX),
  sentiment: z.enum(VALIDATION_ENUMS.SENTIMENT),
  score: z.number().min(VALIDATION_LIMITS.CALL_SCORE_MIN).max(VALIDATION_LIMITS.CALL_SCORE_MAX),
  bookingLikelihood: z.number().min(VALIDATION_LIMITS.CALL_BOOKING_LIKELIHOOD_MIN).max(VALIDATION_LIMITS.CALL_BOOKING_LIKELIHOOD_MAX),
  notes: z.string().max(VALIDATION_LIMITS.CALL_NOTES_MAX).optional(),
}).strict();

export const NewActionItemForm = z.object({
  owner: z.string().max(VALIDATION_LIMITS.ACTION_ITEM_OWNER_MAX).optional(),
  text: z.string().min(VALIDATION_LIMITS.ACTION_ITEM_TEXT_MIN).max(VALIDATION_LIMITS.ACTION_ITEM_TEXT_MAX),
  dueDate: z.string().datetime().optional(), // ISO
}).strict();

// Response schemas for the created entities
export const CreatedClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).strict();

export const CreatedCallSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  ts: z.string(),
  durationSec: z.number(),
  sentiment: z.enum(['pos', 'neu', 'neg']),
  score: z.number(),
  bookingLikelihood: z.number(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).strict();

export const CreatedActionItemSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  owner: z.string().optional(),
  text: z.string(),
  due: z.string().optional(),
  status: z.enum(['open', 'done']),
  createdAt: z.string(),
  updatedAt: z.string(),
}).strict();

// Type exports
export type NewClientFormData = z.infer<typeof NewClientForm>;
export type LogCallFormData = z.infer<typeof LogCallForm>;
export type NewActionItemFormData = z.infer<typeof NewActionItemForm>;
export type CreatedClient = z.infer<typeof CreatedClientSchema>;
export type CreatedCall = z.infer<typeof CreatedCallSchema>;
export type CreatedActionItem = z.infer<typeof CreatedActionItemSchema>;