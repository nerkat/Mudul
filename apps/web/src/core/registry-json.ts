import { ProtocolVersion } from "./widgets/protocol";
import type { DashboardTemplate } from "./widgets/protocol";

// Dashboard templates in the new JSON format
export const DashboardTemplates: Record<string, DashboardTemplate> = {
  "sales-call-default": {
    version: ProtocolVersion,
    layout: { columns: 12 },
    widgets: [
      { slug: "summary", params: { maxLength: 600 } },
      { slug: "sentiment", params: { showScore: true } },
      { slug: "booking", params: { showAsPercentage: false } },
      { slug: "objections", params: { maxItems: 10, showTimestamps: true } },
      { slug: "actionItems", params: { maxItems: 10, showDueDates: true } },
      { slug: "keyMoments", params: { maxItems: 10, showTimestamps: true } },
      { slug: "entities", params: { showProspects: true, showPeople: true, showProducts: true } },
      { slug: "compliance", params: { showCount: false } }
    ]
  },
  
  "client-dashboard": {
    version: ProtocolVersion,
    layout: { columns: 12 },
    widgets: [
      { slug: "clientMemory", params: {} },
      { slug: "recentCalls", params: { maxItems: 5 } },
      { slug: "clientKPIs", params: {} },
      { slug: "followUps", params: { maxItems: 10 } },
      { slug: "sentiment", params: { showScore: true } },
      { slug: "booking", params: { showAsPercentage: true } }
    ]
  },

  "org-dashboard": {
    version: ProtocolVersion,
    layout: { columns: 12 },
    widgets: [
      { slug: "clientStats", params: {} },
      { slug: "activitySummary", params: {} },
      { slug: "healthSignals", params: {} }
    ]
  }
};