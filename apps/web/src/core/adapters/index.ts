// src/core/adapters/index.ts
import type { AdapterMap } from './types';

export const Adapters: AdapterMap = {
  summary: {
    slug: 'summary',
    project: (call) => ({ text: call.summary ?? "" })
  },
  sentiment: {
    slug: 'sentiment',
    project: (call) => ({
      label: call.sentiment?.overall ?? "neutral",
      score: call.sentiment?.score ?? 0
    })
  },
  booking: {
    slug: 'booking',
    project: (call) => ({ value: call.bookingLikelihood ?? 0 })
  },
  objections: {
    slug: 'objections',
    project: (call, params) => ({
      items: (call.objections ?? []).slice(0, params?.maxItems ?? 5)
    })
  },
  actionItems: {
    slug: 'actionItems',
    project: (call, params) => ({
      items: (call.actionItems ?? []).slice(0, params?.maxItems ?? 5)
    })
  },
  keyMoments: {
    slug: 'keyMoments',
    project: (call, params) => ({
      items: (call.keyMoments ?? []).slice(0, params?.maxItems ?? 5)
    })
  },
  entities: {
    slug: 'entities',
    project: (call) => ({
      entities: call.entities
    })
  },
  compliance: {
    slug: 'compliance',
    project: (call) => ({
      complianceFlags: call.complianceFlags
    })
  },
  pieChart: {
    slug: 'pieChart',
    project: (_call, params) => ({
      data: [], // placeholder for chart data
      height: params?.height ?? 240
    })
  }
};