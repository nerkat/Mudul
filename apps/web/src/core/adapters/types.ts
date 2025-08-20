// src/core/adapters/types.ts
import type { SalesCallMinimal, NodeBase } from '../types';

export type ViewMode = "rich" | "paper";

export type AdapterCtx = {
  mode: ViewMode;
  currentNodeId?: string; // Current node ID for context
  orgId?: string;
  locale?: string;
  tz?: string;
  // Add repo functions for org-level adapters
  getRoot?: () => NodeBase | null;
  getNode?: (id: string) => NodeBase | null;
  getChildren?: (parentId: string) => NodeBase[];
  getAllClients?: () => NodeBase[];
  getAllCalls?: () => NodeBase[];
  getCallByNode?: (nodeId: string) => SalesCallMinimal | null;
  listCallsByClient?: (clientId: string) => NodeBase[];
  getStandaloneActionItems?: (clientId: string) => Array<{
    id: string;
    owner: string;
    text: string;
    dueDate: string | null;
    status: 'open' | 'done';
  }>;
};

// Base adapter interface
export interface WidgetAdapter<P = any, R = any> {
  slug: string;
  project: (call: SalesCallMinimal, params?: P, ctx?: AdapterCtx) => R;
}

// Specific adapter types for type safety
export interface SummaryAdapter extends WidgetAdapter<{}, { text: string }> {
  slug: 'summary';
}

export interface SentimentAdapter extends WidgetAdapter<{}, { label: string; score: number }> {
  slug: 'sentiment';
}

export interface BookingAdapter extends WidgetAdapter<{}, { value: number }> {
  slug: 'booking';
}

export interface ObjectionsAdapter extends WidgetAdapter<{ maxItems?: number }, { items: Array<{ type: string; quote: string; ts: string }> }> {
  slug: 'objections';
}

export interface ActionItemsAdapter extends WidgetAdapter<{ maxItems?: number }, { items: Array<{ owner?: string; text: string; due?: string }> }> {
  slug: 'actionItems';
}

export interface KeyMomentsAdapter extends WidgetAdapter<{ maxItems?: number }, { items: Array<{ label: string; ts: string }> }> {
  slug: 'keyMoments';
}

export interface EntitiesAdapter extends WidgetAdapter<{}, { entities: { prospect?: string[]; people?: string[]; products?: string[] } | undefined }> {
  slug: 'entities';
}

export interface ComplianceAdapter extends WidgetAdapter<{}, { complianceFlags: string[] | undefined }> {
  slug: 'compliance';
}

export interface PieChartAdapter extends WidgetAdapter<{ height?: number }, { data: any[]; height: number }> {
  slug: 'pieChart';
}

// New adapters for org and client dashboards
export interface ClientStatsAdapter extends WidgetAdapter<{}, { totalClients: number; activeClients: number; clients: Array<{ name: string; callCount: number; lastActivity: string }> }> {
  slug: 'clientStats';
}

export interface ActivitySummaryAdapter extends WidgetAdapter<{}, { totalCalls: number; recentCalls: number; avgSentiment: number; trends: string }> {
  slug: 'activitySummary';
}

export interface HealthSignalsAdapter extends WidgetAdapter<{}, { avgBookingLikelihood: number; openObjections: number; pendingActions: number; status: string }> {
  slug: 'healthSignals';
}

export interface RecentCallsAdapter extends WidgetAdapter<{ maxItems?: number }, { calls: Array<{ id: string; name: string; date: string; sentiment: string; bookingLikelihood: number }> }> {
  slug: 'recentCalls';
}

export interface FollowUpsAdapter extends WidgetAdapter<{ maxItems?: number }, { items: Array<{ text: string; due: string | null; owner: string; source: string }> }> {
  slug: 'followUps';
}

export interface ClientKPIsAdapter extends WidgetAdapter<{}, { avgSentiment: number; totalCalls: number; conversionRate: number; lastActivity: string }> {
  slug: 'clientKPIs';
}

// Discriminated union of all adapters
export type TypedAdapter = 
  | SummaryAdapter
  | SentimentAdapter
  | BookingAdapter
  | ObjectionsAdapter
  | ActionItemsAdapter
  | KeyMomentsAdapter
  | EntitiesAdapter
  | ComplianceAdapter
  | PieChartAdapter
  | ClientStatsAdapter
  | ActivitySummaryAdapter
  | HealthSignalsAdapter
  | RecentCallsAdapter
  | FollowUpsAdapter
  | ClientKPIsAdapter;

// Map type for the registry
export type AdapterMap = Record<TypedAdapter['slug'], TypedAdapter>;

// Helper types to extract params and data by slug
export type ParamsBySlug<T extends TypedAdapter['slug']> = Extract<TypedAdapter, { slug: T }> extends WidgetAdapter<infer P, any> ? P : never;
export type DataBySlug<T extends TypedAdapter['slug']> = Extract<TypedAdapter, { slug: T }> extends WidgetAdapter<any, infer R> ? R : never;

// Type-safe adapter requirement helper - ensures slugs exist at compile time
export function requireAdapter<T extends TypedAdapter['slug']>(
  slug: T, 
  adapters: AdapterMap
): Extract<TypedAdapter, { slug: T }> {
  const adapter = adapters[slug];
  if (!adapter) {
    throw new Error(`Required adapter '${slug}' not found in adapter registry`);
  }
  return adapter as Extract<TypedAdapter, { slug: T }>;
}