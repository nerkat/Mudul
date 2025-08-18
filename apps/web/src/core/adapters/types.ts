// src/core/adapters/types.ts
import type { SalesCallMinimal } from '../types';

export type ViewMode = "rich" | "paper";

export type AdapterCtx = {
  mode: ViewMode;
  orgId?: string;
  locale?: string;
  tz?: string;
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
  | PieChartAdapter;

// Map type for the registry
export type AdapterMap = Record<TypedAdapter['slug'], TypedAdapter>;

// Helper types to extract params and data by slug
export type ParamsBySlug<T extends TypedAdapter['slug']> = Extract<TypedAdapter, { slug: T }> extends WidgetAdapter<infer P, any> ? P : never;
export type DataBySlug<T extends TypedAdapter['slug']> = Extract<TypedAdapter, { slug: T }> extends WidgetAdapter<any, infer R> ? R : never;