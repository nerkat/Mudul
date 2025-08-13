import { makeMemoryRepos } from "./repos.js";
import type { Node, Dashboard, Session, AnalysisRecord } from "./types.js";

export function seedRepos() {
  const now = new Date().toISOString();
  const orgId = "acme";

  const root: Node = { 
    id: "root", 
    orgId, 
    parentId: null, 
    kind: "group", 
    name: "Acme", 
    slug: "", 
    createdAt: now, 
    updatedAt: now 
  };

  const pipeline: Node = { 
    id: "p1", 
    orgId, 
    parentId: "root", 
    kind: "sales_pipeline", 
    name: "Sales", 
    slug: "sales", 
    createdAt: now, 
    updatedAt: now 
  };

  const lead: Node = { 
    id: "l1", 
    orgId, 
    parentId: "p1", 
    kind: "lead", 
    name: "Acme Co.", 
    slug: "acme-co", 
    createdAt: now, 
    updatedAt: now 
  };

  const callSession: Session = { 
    id: "session-001", 
    orgId, 
    type: "call", 
    startedAt: now, 
    durationSec: 900, 
    createdAt: now 
  };

  const callNode: Node = {
    id: "c1", 
    orgId, 
    parentId: "l1", 
    kind: "call_session", 
    name: "Call 2025-08-10",
    slug: "2025-08-10", 
    createdAt: now, 
    updatedAt: now,
    dashboardId: "db-call-1", 
    dataRef: { type: "session", id: callSession.id }
  };

  const callDash: Dashboard = {
    id: "db-call-1",
    name: "Sales Call",
    version: "1.0.0",
    templateId: "sales-call-default",
    params: { sessionId: "$node.dataRef.id" }
  };

  const sampleAnalysis: AnalysisRecord = {
    id: "a-1",
    orgId,
    sessionId: callSession.id,
    json: {
      version: "1.0.0",
      callId: callSession.id,
      summary: "Prospect is interested; budget concern.",
      sentiment: { overall: "neutral", score: 0.55 },
      bookingLikelihood: 0.6,
      objections: [{ type: "budget", quote: "pricey", ts: "00:05:12" }],
      actionItems: [{ owner: "rep", text: "Send proposal", due: null }],
      keyMoments: [{ label: "pricing", ts: "00:04:31" }],
      entities: { prospect: ["Acme"], people: ["Jane"], products: ["Pro Plan"] },
      complianceFlags: []
    },
    model: "mock:v1",
    createdAt: now
  };

  return makeMemoryRepos({
    nodes: [root, pipeline, lead, callNode],
    dashboards: [callDash],
    sessions: [callSession],
    analyses: [sampleAnalysis]
  });
}