import { z } from "zod";

// Base schemas for adapter outputs
// These ensure data consistency and reject unknown keys

export const SummaryDataSchema = z.object({
  text: z.string()
}).strict();

export const SentimentDataSchema = z.object({
  label: z.string(),
  score: z.number()
}).strict();

export const BookingDataSchema = z.object({
  value: z.number()
}).strict();

export const ObjectionsDataSchema = z.object({
  items: z.array(z.object({
    type: z.string(),
    quote: z.string(),
    ts: z.string()
  })).default([])
}).strict();

export const ActionItemsDataSchema = z.object({
  items: z.array(z.object({
    owner: z.string().optional(),
    text: z.string(),
    due: z.string().optional()
  })).default([])
}).strict();

export const KeyMomentsDataSchema = z.object({
  items: z.array(z.object({
    label: z.string(),
    ts: z.string()
  })).default([])
}).strict();

export const EntitiesDataSchema = z.object({
  entities: z.object({
    prospect: z.array(z.string()).optional(),
    people: z.array(z.string()).optional(),
    products: z.array(z.string()).optional()
  }).optional()
}).strict();

export const ComplianceDataSchema = z.object({
  complianceFlags: z.array(z.string()).optional()
}).strict();

export const PieChartDataSchema = z.object({
  data: z.array(z.any()).default([]),
  height: z.number()
}).strict();

// New adapter schemas for org and client dashboards
export const ClientStatsDataSchema = z.object({
  totalClients: z.number(),
  activeClients: z.number(),
  clients: z.array(z.object({
    name: z.string(),
    callCount: z.number(),
    lastActivity: z.string()
  })).default([])
}).strict();

export const ActivitySummaryDataSchema = z.object({
  totalCalls: z.number(),
  recentCalls: z.number(),
  avgSentiment: z.number(),
  trends: z.string()
}).strict();

export const HealthSignalsDataSchema = z.object({
  avgBookingLikelihood: z.number(),
  openObjections: z.number(),
  pendingActions: z.number(),
  status: z.string()
}).strict();

export const RecentCallsDataSchema = z.object({
  calls: z.array(z.object({
    id: z.string(),
    name: z.string(),
    date: z.string(),
    sentiment: z.string(),
    bookingLikelihood: z.number()
  })).default([])
}).strict();

export const FollowUpsDataSchema = z.object({
  items: z.array(z.object({
    text: z.string(),
    due: z.string().nullable(),
    owner: z.string(),
    source: z.string()
  })).default([])
}).strict();

export const ClientKPIsDataSchema = z.object({
  avgSentiment: z.number(),
  totalCalls: z.number(),
  conversionRate: z.number(),
  lastActivity: z.string()
}).strict();

export const ClientMemoryPersonSchema = z.object({
  name: z.string(),
  role: z.string().nullable(),
  notes: z.string().nullable(),
});

export const ClientMemoryDataSchema = z.object({
  clientId: z.string(),
  memoryTags: z.array(z.string()).default([]),
  decisionStyle: z.string(),
  budgetSignals: z.string(),
  timelineSignals: z.string(),
  recurringRisks: z.array(z.string()).default([]),
  keyPeople: z.array(ClientMemoryPersonSchema).default([]),
  briefingBullets: z.array(z.string()).default([]),
  lastUpdatedAt: z.string(),
  isEmpty: z.boolean().default(false),
}).strict();

// Type exports
export type SummaryData = z.infer<typeof SummaryDataSchema>;
export type SentimentData = z.infer<typeof SentimentDataSchema>;
export type BookingData = z.infer<typeof BookingDataSchema>;
export type ObjectionsData = z.infer<typeof ObjectionsDataSchema>;
export type ActionItemsData = z.infer<typeof ActionItemsDataSchema>;
export type KeyMomentsData = z.infer<typeof KeyMomentsDataSchema>;
export type EntitiesData = z.infer<typeof EntitiesDataSchema>;
export type ComplianceData = z.infer<typeof ComplianceDataSchema>;
export type PieChartData = z.infer<typeof PieChartDataSchema>;
export type ClientStatsData = z.infer<typeof ClientStatsDataSchema>;
export type ActivitySummaryData = z.infer<typeof ActivitySummaryDataSchema>;
export type HealthSignalsData = z.infer<typeof HealthSignalsDataSchema>;
export type RecentCallsData = z.infer<typeof RecentCallsDataSchema>;
export type FollowUpsData = z.infer<typeof FollowUpsDataSchema>;
export type ClientKPIsData = z.infer<typeof ClientKPIsDataSchema>;
export type ClientMemoryData = z.infer<typeof ClientMemoryDataSchema>;