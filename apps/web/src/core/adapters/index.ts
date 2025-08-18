// src/core/adapters/index.ts
import type { 
  AdapterMap,
  SummaryAdapter,
  SentimentAdapter,
  BookingAdapter,
  ObjectionsAdapter,
  ActionItemsAdapter,
  KeyMomentsAdapter,
  EntitiesAdapter,
  ComplianceAdapter,
  PieChartAdapter
} from './types';

export const Adapters: AdapterMap = {
  summary: {
    slug: 'summary',
    project: (call) => ({ text: call.summary ?? "" })
  } as SummaryAdapter,

  sentiment: {
    slug: 'sentiment',
    project: (call) => ({
      label: call.sentiment?.overall ?? "neutral",
      score: call.sentiment?.score ?? 0
    })
  } as SentimentAdapter,

  booking: {
    slug: 'booking',
    project: (call) => ({ value: call.bookingLikelihood ?? 0 })
  } as BookingAdapter,

  objections: {
    slug: 'objections',
    project: (call, params) => ({
      items: (call.objections ?? []).slice(0, params?.maxItems ?? 5)
    })
  } as ObjectionsAdapter,

  actionItems: {
    slug: 'actionItems',
    project: (call, params) => ({
      items: (call.actionItems ?? []).slice(0, params?.maxItems ?? 5)
    })
  } as ActionItemsAdapter,

  keyMoments: {
    slug: 'keyMoments',
    project: (call, params) => ({
      items: (call.keyMoments ?? []).slice(0, params?.maxItems ?? 5)
    })
  } as KeyMomentsAdapter,

  entities: {
    slug: 'entities',
    project: (call) => ({
      entities: call.entities ?? { prospect: [], people: [], products: [] }
    })
  } as EntitiesAdapter,

  compliance: {
    slug: 'compliance',
    project: (call) => ({
      complianceFlags: call.complianceFlags ?? []
    })
  } as ComplianceAdapter,

  pieChart: {
    slug: 'pieChart',
    project: (_call, params) => ({
      data: [], // explicit empty array instead of undefined
      height: params?.height ?? 240
    })
  } as PieChartAdapter
};