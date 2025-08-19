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
  PieChartAdapter,
  ClientStatsAdapter,
  ActivitySummaryAdapter,
  HealthSignalsAdapter,
  RecentCallsAdapter,
  FollowUpsAdapter,
  ClientKPIsAdapter
} from './types';

import {
  SummaryDataSchema,
  SentimentDataSchema,
  BookingDataSchema,
  ObjectionsDataSchema,
  ActionItemsDataSchema,
  KeyMomentsDataSchema,
  EntitiesDataSchema,
  ComplianceDataSchema,
  PieChartDataSchema,
  ClientStatsDataSchema,
  ActivitySummaryDataSchema,
  HealthSignalsDataSchema,
  RecentCallsDataSchema,
  FollowUpsDataSchema,
  ClientKPIsDataSchema
} from './schemas';

// Simple memoization cache for adapter results
const adapterCache = new Map<string, any>();

// Helper to create cache key from context and params
function createCacheKey(slug: string, callId?: string, ctx?: any, params?: any): string {
  const contextKey = ctx ? `${ctx.orgId || ''}-${ctx.currentNodeId || ''}` : '';
  const paramsKey = params ? JSON.stringify(params) : '';
  return `${slug}-${callId || 'no-call'}-${contextKey}-${paramsKey}`;
}

// Helper to validate and cache adapter output
function validateAndCache<T>(
  cacheKey: string,
  data: T,
  schema: any,
  ttl: number = 60000 // 1 minute default TTL
): T {
  try {
    const validated = schema.parse(data);
    adapterCache.set(cacheKey, { data: validated, expires: Date.now() + ttl });
    return validated;
  } catch (error) {
    console.warn(`Adapter validation failed for ${cacheKey}:`, error);
    return data; // Return unvalidated data as fallback
  }
}

// Helper to get cached result if still valid
function getCachedResult(cacheKey: string): any | null {
  const cached = adapterCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  if (cached) {
    adapterCache.delete(cacheKey); // Clean up expired entry
  }
  return null;
}

export const Adapters: AdapterMap = {
  summary: {
    slug: 'summary',
    project: (call, params, ctx) => {
      const cacheKey = createCacheKey('summary', ctx?.currentNodeId, ctx, params);
      const cached = getCachedResult(cacheKey);
      if (cached) return cached;
      
      const result = { text: call.summary ?? "" };
      return validateAndCache(cacheKey, result, SummaryDataSchema);
    }
  } as SummaryAdapter,

  sentiment: {
    slug: 'sentiment',
    project: (call, params, ctx) => {
      const cacheKey = createCacheKey('sentiment', ctx?.currentNodeId, ctx, params);
      const cached = getCachedResult(cacheKey);
      if (cached) return cached;
      
      const result = {
        label: call.sentiment?.overall ?? "neutral",
        score: call.sentiment?.score ?? 0
      };
      return validateAndCache(cacheKey, result, SentimentDataSchema);
    }
  } as SentimentAdapter,

  booking: {
    slug: 'booking',
    project: (call, params, ctx) => {
      const cacheKey = createCacheKey('booking', ctx?.currentNodeId, ctx, params);
      const cached = getCachedResult(cacheKey);
      if (cached) return cached;
      
      const result = { value: call.bookingLikelihood ?? 0 };
      return validateAndCache(cacheKey, result, BookingDataSchema);
    }
  } as BookingAdapter,

  objections: {
    slug: 'objections',
    project: (call, params, ctx) => {
      const cacheKey = createCacheKey('objections', ctx?.currentNodeId, ctx, params);
      const cached = getCachedResult(cacheKey);
      if (cached) return cached;
      
      const result = {
        items: (call.objections ?? []).slice(0, params?.maxItems ?? 5)
      };
      return validateAndCache(cacheKey, result, ObjectionsDataSchema);
    }
  } as ObjectionsAdapter,

  actionItems: {
    slug: 'actionItems',
    project: (call, params, ctx) => {
      const cacheKey = createCacheKey('actionItems', ctx?.currentNodeId, ctx, params);
      const cached = getCachedResult(cacheKey);
      if (cached) return cached;
      
      const result = {
        items: (call.actionItems ?? []).slice(0, params?.maxItems ?? 5)
      };
      return validateAndCache(cacheKey, result, ActionItemsDataSchema);
    }
  } as ActionItemsAdapter,

  keyMoments: {
    slug: 'keyMoments',
    project: (call, params, ctx) => {
      const cacheKey = createCacheKey('keyMoments', ctx?.currentNodeId, ctx, params);
      const cached = getCachedResult(cacheKey);
      if (cached) return cached;
      
      const result = {
        items: (call.keyMoments ?? []).slice(0, params?.maxItems ?? 5)
      };
      return validateAndCache(cacheKey, result, KeyMomentsDataSchema);
    }
  } as KeyMomentsAdapter,

  entities: {
    slug: 'entities',
    project: (call, params, ctx) => {
      const cacheKey = createCacheKey('entities', ctx?.currentNodeId, ctx, params);
      const cached = getCachedResult(cacheKey);
      if (cached) return cached;
      
      const result = {
        entities: call.entities ?? { prospect: [], people: [], products: [] }
      };
      return validateAndCache(cacheKey, result, EntitiesDataSchema);
    }
  } as EntitiesAdapter,

  compliance: {
    slug: 'compliance',
    project: (call, params, ctx) => {
      const cacheKey = createCacheKey('compliance', ctx?.currentNodeId, ctx, params);
      const cached = getCachedResult(cacheKey);
      if (cached) return cached;
      
      const result = {
        complianceFlags: call.complianceFlags ?? []
      };
      return validateAndCache(cacheKey, result, ComplianceDataSchema);
    }
  } as ComplianceAdapter,

  pieChart: {
    slug: 'pieChart',
    project: (_call, params, ctx) => {
      const cacheKey = createCacheKey('pieChart', ctx?.currentNodeId, ctx, params);
      const cached = getCachedResult(cacheKey);
      if (cached) return cached;
      
      const result = {
        data: [], // explicit empty array instead of undefined
        height: params?.height ?? 240
      };
      return validateAndCache(cacheKey, result, PieChartDataSchema);
    }
  } as PieChartAdapter,

  // Org dashboard adapters - these need heavy caching since they aggregate across all data
  clientStats: {
    slug: 'clientStats',
    project: (_call, params, ctx) => {
      // Use org-wide cache key for this data
      const cacheKey = createCacheKey('clientStats', 'org-wide', ctx, params);
      const cached = getCachedResult(cacheKey);
      if (cached) return cached;
      
      const clients = ctx?.getAllClients?.() ?? [];
      const allCalls = ctx?.getAllCalls?.() ?? [];
      
      const clientData = clients.map(client => {
        const clientCalls = allCalls.filter(call => call.parentId === client.id);
        const lastCall = clientCalls.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
        
        return {
          name: client.name,
          callCount: clientCalls.length,
          lastActivity: lastCall ? new Date(lastCall.updatedAt).toLocaleDateString() : 'No activity'
        };
      });

      const result = {
        totalClients: clients.length,
        activeClients: clients.filter(client => {
          const clientCalls = allCalls.filter(call => call.parentId === client.id);
          return clientCalls.length > 0;
        }).length,
        clients: clientData
      };
      
      // Cache org-level data for longer since it's expensive to compute
      return validateAndCache(cacheKey, result, ClientStatsDataSchema, 300000); // 5 minutes
    }
  } as ClientStatsAdapter,

  activitySummary: {
    slug: 'activitySummary',
    project: (_call, params, ctx) => {
      const cacheKey = createCacheKey('activitySummary', 'org-wide', ctx, params);
      const cached = getCachedResult(cacheKey);
      if (cached) return cached;
      
      const allCalls = ctx?.getAllCalls?.() ?? [];
      const callData: { sentiment: number; count: number }[] = [];
      
      allCalls.forEach(callNode => {
        const callDetail = ctx?.getCallByNode?.(callNode.id);
        if (callDetail?.sentiment?.score) {
          callData.push({ sentiment: callDetail.sentiment.score, count: 1 });
        }
      });

      const avgSentiment = callData.length > 0 
        ? callData.reduce((sum, item) => sum + item.sentiment, 0) / callData.length 
        : 0;

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 7);
      const recentCalls = allCalls.filter(call => 
        new Date(call.updatedAt) > recentDate
      ).length;

      const result = {
        totalCalls: allCalls.length,
        recentCalls,
        avgSentiment: Math.round(avgSentiment * 100) / 100,
        trends: recentCalls > 0 ? `${recentCalls} calls in last 7 days` : 'No recent activity'
      };
      
      return validateAndCache(cacheKey, result, ActivitySummaryDataSchema, 300000); // 5 minutes
    }
  } as ActivitySummaryAdapter,

  healthSignals: {
    slug: 'healthSignals',
    project: (_call, params, ctx) => {
      const cacheKey = createCacheKey('healthSignals', 'org-wide', ctx, params);
      const cached = getCachedResult(cacheKey);
      if (cached) return cached;
      
      const allCalls = ctx?.getAllCalls?.() ?? [];
      let totalBooking = 0;
      let totalObjections = 0;
      let totalActions = 0;
      let callCount = 0;

      allCalls.forEach(callNode => {
        const callDetail = ctx?.getCallByNode?.(callNode.id);
        if (callDetail) {
          callCount++;
          totalBooking += callDetail.bookingLikelihood ?? 0;
          totalObjections += callDetail.objections?.length ?? 0;
          totalActions += callDetail.actionItems?.filter(item => !item.due || new Date(item.due) > new Date()).length ?? 0;
        }
      });

      const avgBooking = callCount > 0 ? totalBooking / callCount : 0;
      const status = avgBooking > 0.7 ? 'Excellent' : avgBooking > 0.5 ? 'Good' : avgBooking > 0.3 ? 'Fair' : 'Needs Attention';

      const result = {
        avgBookingLikelihood: Math.round(avgBooking * 100) / 100,
        openObjections: totalObjections,
        pendingActions: totalActions,
        status
      };
      
      return validateAndCache(cacheKey, result, HealthSignalsDataSchema, 300000); // 5 minutes
    }
  } as HealthSignalsAdapter,

  // Client dashboard adapters  
  recentCalls: {
    slug: 'recentCalls',
    project: (_call, params, ctx) => {
      const nodeId = ctx?.currentNodeId;
      const cacheKey = createCacheKey('recentCalls', nodeId, ctx, params);
      const cached = getCachedResult(cacheKey);
      if (cached) return cached;
      
      if (!nodeId) {
        const result = { calls: [] };
        return validateAndCache(cacheKey, result, RecentCallsDataSchema);
      }
      
      const clientCalls = ctx?.listCallsByClient?.(nodeId) ?? [];
      const recentCalls = clientCalls
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, params?.maxItems ?? 5);

      const result = {
        calls: recentCalls.map(callNode => {
          const callDetail = ctx?.getCallByNode?.(callNode.id);
          return {
            id: callNode.id,
            name: callNode.name,
            date: new Date(callNode.updatedAt).toLocaleDateString(),
            sentiment: callDetail?.sentiment?.overall ?? 'neutral',
            bookingLikelihood: callDetail?.bookingLikelihood ?? 0
          };
        })
      };
      
      return validateAndCache(cacheKey, result, RecentCallsDataSchema);
    }
  } as RecentCallsAdapter,

  followUps: {
    slug: 'followUps',
    project: (_call, params, ctx) => {
      const nodeId = ctx?.currentNodeId;
      const cacheKey = createCacheKey('followUps', nodeId, ctx, params);
      const cached = getCachedResult(cacheKey);
      if (cached) return cached;
      
      if (!nodeId) {
        const result = { items: [] };
        return validateAndCache(cacheKey, result, FollowUpsDataSchema);
      }
      
      const clientCalls = ctx?.listCallsByClient?.(nodeId) ?? [];
      const allActions: Array<{ text: string; due: string | null; owner: string; source: string }> = [];

      clientCalls.forEach(callNode => {
        const callDetail = ctx?.getCallByNode?.(callNode.id);
        if (callDetail?.actionItems) {
          callDetail.actionItems.forEach(action => {
            allActions.push({
              text: action.text,
              due: action.due || null,
              owner: action.owner,
              source: callNode.name
            });
          });
        }
      });

      // Sort by due date, prioritizing items with due dates
      const sortedActions = allActions.sort((a, b) => {
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return new Date(a.due).getTime() - new Date(b.due).getTime();
      });

      const result = {
        items: sortedActions.slice(0, params?.maxItems ?? 10)
      };
      
      return validateAndCache(cacheKey, result, FollowUpsDataSchema);
    }
  } as FollowUpsAdapter,

  clientKPIs: {
    slug: 'clientKPIs',
    project: (_call, params, ctx) => {
      const nodeId = ctx?.currentNodeId;
      const cacheKey = createCacheKey('clientKPIs', nodeId, ctx, params);
      const cached = getCachedResult(cacheKey);
      if (cached) return cached;
      
      if (!nodeId) {
        const result = { avgSentiment: 0, totalCalls: 0, conversionRate: 0, lastActivity: 'Unknown' };
        return validateAndCache(cacheKey, result, ClientKPIsDataSchema);
      }
      
      const clientCalls = ctx?.listCallsByClient?.(nodeId) ?? [];
      let totalSentiment = 0;
      let sentimentCount = 0;
      let positiveOutcomes = 0;

      let lastActivityDate = '';
      clientCalls.forEach(callNode => {
        if (!lastActivityDate || new Date(callNode.updatedAt) > new Date(lastActivityDate)) {
          lastActivityDate = callNode.updatedAt;
        }
        
        const callDetail = ctx?.getCallByNode?.(callNode.id);
        if (callDetail?.sentiment?.score) {
          totalSentiment += callDetail.sentiment.score;
          sentimentCount++;
        }
        if (callDetail?.bookingLikelihood && callDetail.bookingLikelihood > 0.7) {
          positiveOutcomes++;
        }
      });

      const result = {
        avgSentiment: sentimentCount > 0 ? Math.round((totalSentiment / sentimentCount) * 100) / 100 : 0,
        totalCalls: clientCalls.length,
        conversionRate: clientCalls.length > 0 ? Math.round((positiveOutcomes / clientCalls.length) * 100) / 100 : 0,
        lastActivity: lastActivityDate ? new Date(lastActivityDate).toLocaleDateString() : 'No activity'
      };
      
      return validateAndCache(cacheKey, result, ClientKPIsDataSchema);
    }
  } as ClientKPIsAdapter
};