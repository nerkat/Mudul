import { z } from 'zod';

// Form schemas for CRUD operations as specified in the issue

export const NewClientForm = z.object({
  name: z.string().min(2).max(100),
  notes: z.string().max(2000).optional(),
}).strict();

export const LogCallForm = z.object({
  ts: z.string().datetime(),           // ISO
  durationSec: z.number().int().min(1).max(14400),
  sentiment: z.enum(['pos', 'neu', 'neg']),
  score: z.number().min(-1).max(1),
  bookingLikelihood: z.number().min(0).max(1),
  notes: z.string().max(2000).optional(),
}).strict();

export const NewActionItemForm = z.object({
  owner: z.string().max(120).optional(),
  text: z.string().min(2).max(500),
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