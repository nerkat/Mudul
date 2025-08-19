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
  } as PieChartAdapter,

  // Org dashboard adapters
  clientStats: {
    slug: 'clientStats',
    project: (_call, _params, ctx) => {
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

      return {
        totalClients: clients.length,
        activeClients: clients.filter(client => {
          const clientCalls = allCalls.filter(call => call.parentId === client.id);
          return clientCalls.length > 0;
        }).length,
        clients: clientData
      };
    }
  } as ClientStatsAdapter,

  activitySummary: {
    slug: 'activitySummary',
    project: (_call, _params, ctx) => {
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

      return {
        totalCalls: allCalls.length,
        recentCalls,
        avgSentiment: Math.round(avgSentiment * 100) / 100,
        trends: recentCalls > 0 ? `${recentCalls} calls in last 7 days` : 'No recent activity'
      };
    }
  } as ActivitySummaryAdapter,

  healthSignals: {
    slug: 'healthSignals',
    project: (_call, _params, ctx) => {
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

      return {
        avgBookingLikelihood: Math.round(avgBooking * 100) / 100,
        openObjections: totalObjections,
        pendingActions: totalActions,
        status
      };
    }
  } as HealthSignalsAdapter,

  // Client dashboard adapters  
  recentCalls: {
    slug: 'recentCalls',
    project: (_call, params, ctx) => {
      // For client dashboards, use the current node to find its calls
      const nodeId = ctx?.currentNodeId;
      if (!nodeId) return { calls: [] };
      
      const clientCalls = ctx?.listCallsByClient?.(nodeId) ?? [];
      const recentCalls = clientCalls
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, params?.maxItems ?? 5);

      return {
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
    }
  } as RecentCallsAdapter,

  followUps: {
    slug: 'followUps',
    project: (_call, params, ctx) => {
      // For client dashboards, use the current node to find its calls
      const nodeId = ctx?.currentNodeId;
      if (!nodeId) return { items: [] };
      
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

      return {
        items: sortedActions.slice(0, params?.maxItems ?? 10)
      };
    }
  } as FollowUpsAdapter,

  clientKPIs: {
    slug: 'clientKPIs',
    project: (_call, _params, ctx) => {
      // For client dashboards, use the current node to find its calls
      const nodeId = ctx?.currentNodeId;
      if (!nodeId) return { avgSentiment: 0, totalCalls: 0, conversionRate: 0, lastActivity: 'Unknown' };
      
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

      return {
        avgSentiment: sentimentCount > 0 ? Math.round((totalSentiment / sentimentCount) * 100) / 100 : 0,
        totalCalls: clientCalls.length,
        conversionRate: clientCalls.length > 0 ? Math.round((positiveOutcomes / clientCalls.length) * 100) / 100 : 0,
        lastActivity: lastActivityDate ? new Date(lastActivityDate).toLocaleDateString() : 'No activity'
      };
    }
  } as ClientKPIsAdapter
};