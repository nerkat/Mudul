// Re-export types from packages/core that we need
export type { Node, NodeKind, Dashboard, Session, AnalysisRecord } from "@mudul/core";

// Core types for web app
export interface NodeBase {
  id: string;
  orgId: string;
  parentId?: string | null;
  kind: NodeKind;
  name: string;
  slug: string;
  dashboardId?: string | null;
  dataRef?: { type: "session" | "lead" | "candidate" | "position"; id: string };
  createdAt: string;
  updatedAt: string;
}

// Sales call minimal data structure for widgets
export interface SalesCallMinimal {
  summary?: string;
  sentiment?: { overall?: string; score?: number };
  bookingLikelihood?: number;
  objections?: { type: string; quote: string; ts: string }[];
  actionItems?: { owner: string; text: string; due?: string | null }[];
  keyMoments?: { label: string; ts: string }[];
  entities?: { prospect?: string[]; people?: string[]; products?: string[] };
  complianceFlags?: string[];
}

// Widget configuration
export type WidgetKey = 
  | "summary" 
  | "sentiment" 
  | "booking" 
  | "objections" 
  | "actionItems" 
  | "keyMoments" 
  | "entities" 
  | "compliance";

// Dashboard templates mapping
export type DashboardTemplateId = string;
export type DashboardTemplate = WidgetKey[];