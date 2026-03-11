import { z } from "zod";

// ----- Widget Parameter Schemas -----
export const SummaryParams = z.object({
  maxLength: z.number().int().min(50).max(2000).default(600)
});

export const SentimentParams = z.object({
  showScore: z.boolean().default(true)
});

export const BookingParams = z.object({
  showAsPercentage: z.boolean().default(false)
});

export const ObjectionsParams = z.object({
  maxItems: z.number().int().min(1).max(20).default(10),
  showTimestamps: z.boolean().default(true)
});

export const ActionItemsParams = z.object({
  maxItems: z.number().int().min(1).max(20).default(10),
  showDueDates: z.boolean().default(true)
});

export const KeyMomentsParams = z.object({
  maxItems: z.number().int().min(1).max(20).default(10),
  showTimestamps: z.boolean().default(true)
});

export const EntitiesParams = z.object({
  showProspects: z.boolean().default(true),
  showPeople: z.boolean().default(true),
  showProducts: z.boolean().default(true)
});

export const ComplianceParams = z.object({
  showCount: z.boolean().default(false)
});

export const PieChartParams = z.object({
  height: z.number().int().min(120).max(720).default(240),
  valueKey: z.string().default("value"),
  nameKey: z.string().default("name"),
  // optional color scheme token, not actual color list to keep UI themeable
  colorScheme: z.string().default("auto")
});

// Org dashboard widget params
export const ClientStatsParams = z.object({});

export const ActivitySummaryParams = z.object({});

export const HealthSignalsParams = z.object({});

// Client dashboard widget params
export const RecentCallsParams = z.object({
  maxItems: z.number().int().min(1).max(50).default(5)
});

export const FollowUpsParams = z.object({
  maxItems: z.number().int().min(1).max(50).default(10)
});

export const ClientKPIsParams = z.object({});

// Export param types
export type SummaryParams = z.infer<typeof SummaryParams>;
export type SentimentParams = z.infer<typeof SentimentParams>;
export type BookingParams = z.infer<typeof BookingParams>;
export type ObjectionsParams = z.infer<typeof ObjectionsParams>;
export type ActionItemsParams = z.infer<typeof ActionItemsParams>;
export type KeyMomentsParams = z.infer<typeof KeyMomentsParams>;
export type EntitiesParams = z.infer<typeof EntitiesParams>;
export type ComplianceParams = z.infer<typeof ComplianceParams>;
export type PieChartParams = z.infer<typeof PieChartParams>;
export type ClientStatsParams = z.infer<typeof ClientStatsParams>;
export type ActivitySummaryParams = z.infer<typeof ActivitySummaryParams>;
export type HealthSignalsParams = z.infer<typeof HealthSignalsParams>;
export type RecentCallsParams = z.infer<typeof RecentCallsParams>;
export type FollowUpsParams = z.infer<typeof FollowUpsParams>;
export type ClientKPIsParams = z.infer<typeof ClientKPIsParams>;