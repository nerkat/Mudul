export type NodeKind =
  | "group"
  | "sales_pipeline" | "lead" | "call_session"
  | "hiring_position" | "candidate" | "interview_session"
  | "custom";

export interface Node {
  id: string;
  orgId: string;
  parentId?: string | null;
  kind: NodeKind;
  name: string;
  slug: string;                 // unique under its parent
  dashboardId?: string | null;  // optional default dashboard for this node
  dataRef?: { type: "session" | "lead" | "candidate" | "position"; id: string };
  createdAt: string;
  updatedAt: string;
}

// TODO: Enforce unique slug per parent in future database adapters

export interface Dashboard {
  id: string;
  name: string;
  version: string;              // template/config versioning
  templateId: string;           // e.g., "sales-call-default"
  params?: Record<string, any>; // config for the dashboard template
}

export interface Session {
  id: string;
  orgId: string;
  type: "call" | "interview" | "custom";
  startedAt: string;
  durationSec?: number;
  createdAt: string;
}

export interface AnalysisRecord {
  id: string;
  orgId: string;
  sessionId: string;
  json: any;                    // structured analysis data
  model: string;                // AI model version used
  createdAt: string;
}

export interface DomainEvent {
  type: string;
  payload: any;
  timestamp: string;
}