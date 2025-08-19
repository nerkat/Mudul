import { z } from 'zod';

// Database types that match Prisma schema
export interface DbUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface DbOrg {
  id: string;
  name: string;
  planTier: string;
  createdAt: Date;
}

export interface DbMembership {
  id: string;
  userId: string;
  orgId: string;
  role: 'OWNER' | 'VIEWER';
  createdAt: Date;
}

export interface DbClient {
  id: string;
  orgId: string;
  name: string;
  slug: string | null;
  createdAt: Date;
}

export interface DbCall {
  id: string;
  orgId: string;
  clientId: string;
  name: string | null;
  summary: string | null;
  ts: Date;
  durationSec: number | null;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  score: number | null;
  bookingLikelihood: number | null;
  createdAt: Date;
}

export interface DbActionItem {
  id: string;
  orgId: string;
  clientId: string | null;
  ownerId: string | null;
  text: string;
  due: Date | null;
  status: 'OPEN' | 'DONE';
  createdAt: Date;
}

export interface DbRefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// API response types with Zod validation
export const OrgSummarySchema = z.object({
  totalCalls: z.number(),
  avgSentimentScore: z.number(),
  bookingRate: z.number(),
  openActionItems: z.number(),
});

export const ClientRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  lastCallDate: z.string().nullable(),
  totalCalls: z.number(),
  avgSentiment: z.number(),
  bookingLikelihood: z.number(),
});

export const ClientSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  totalCalls: z.number(),
  avgSentiment: z.number(),
  bookingLikelihood: z.number(),
  topObjections: z.array(z.object({
    type: z.string(),
    count: z.number(),
  })),
});

export const CallRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string(),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  score: z.number(),
  bookingLikelihood: z.number(),
});

export const ActionItemRowSchema = z.object({
  id: z.string(),
  text: z.string(),
  due: z.string().nullable(),
  status: z.enum(['open', 'done']),
  ownerName: z.string().nullable(),
});

export type OrgSummary = z.infer<typeof OrgSummarySchema>;
export type ClientRow = z.infer<typeof ClientRowSchema>;
export type ClientSummary = z.infer<typeof ClientSummarySchema>;
export type CallRow = z.infer<typeof CallRowSchema>;
export type ActionItemRow = z.infer<typeof ActionItemRowSchema>;