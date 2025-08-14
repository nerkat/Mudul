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

  // Multiple pipelines
  const salesPipeline: Node = { 
    id: "p1", 
    orgId, 
    parentId: "root", 
    kind: "sales_pipeline", 
    name: "Sales", 
    slug: "sales", 
    createdAt: now, 
    updatedAt: now 
  };

  const csTrialsPipeline: Node = { 
    id: "p2", 
    orgId, 
    parentId: "root", 
    kind: "sales_pipeline", 
    name: "CS Trials", 
    slug: "cs-trials", 
    createdAt: now, 
    updatedAt: now 
  };

  // Sales leads
  const acmeLead: Node = { 
    id: "l1", 
    orgId, 
    parentId: "p1", 
    kind: "lead", 
    name: "Acme Co.", 
    slug: "acme-co", 
    createdAt: now, 
    updatedAt: now 
  };

  const globexLead: Node = { 
    id: "l2", 
    orgId, 
    parentId: "p1", 
    kind: "lead", 
    name: "Globex", 
    slug: "globex", 
    createdAt: now, 
    updatedAt: now 
  };

  const initechLead: Node = { 
    id: "l3", 
    orgId, 
    parentId: "p1", 
    kind: "lead", 
    name: "Initech", 
    slug: "initech", 
    createdAt: now, 
    updatedAt: now 
  };

  // CS Trials leads
  const techCorpLead: Node = { 
    id: "l4", 
    orgId, 
    parentId: "p2", 
    kind: "lead", 
    name: "TechCorp", 
    slug: "techcorp", 
    createdAt: now, 
    updatedAt: now 
  };

  // Sessions and call nodes
  const sessions: Session[] = [
    { id: "session-001", orgId, type: "call", startedAt: now, durationSec: 900, createdAt: now },
    { id: "session-002", orgId, type: "call", startedAt: now, durationSec: 1200, createdAt: now },
    { id: "session-003", orgId, type: "call", startedAt: now, durationSec: 750, createdAt: now },
    { id: "session-004", orgId, type: "call", startedAt: now, durationSec: 1050, createdAt: now },
    { id: "session-005", orgId, type: "call", startedAt: now, durationSec: 600, createdAt: now },
  ];

  const callNodes: Node[] = [
    // Acme Co calls
    {
      id: "c1", orgId, parentId: "l1", kind: "call_session", 
      name: "Call 2025-08-10", slug: "2025-08-10", 
      createdAt: now, updatedAt: now,
      dashboardId: "db-call-1", dataRef: { type: "session", id: "session-001" }
    },
    {
      id: "c2", orgId, parentId: "l1", kind: "call_session", 
      name: "Call 2025-08-11", slug: "2025-08-11", 
      createdAt: now, updatedAt: now,
      dashboardId: "db-call-2", dataRef: { type: "session", id: "session-002" }
    },
    // Globex calls
    {
      id: "c3", orgId, parentId: "l2", kind: "call_session", 
      name: "Call 2025-08-12", slug: "2025-08-12", 
      createdAt: now, updatedAt: now,
      dashboardId: "db-call-3", dataRef: { type: "session", id: "session-003" }
    },
    {
      id: "c4", orgId, parentId: "l2", kind: "call_session", 
      name: "Call 2025-08-13", slug: "2025-08-13", 
      createdAt: now, updatedAt: now,
      dashboardId: "db-call-4", dataRef: { type: "session", id: "session-004" }
    },
    // Initech calls
    {
      id: "c5", orgId, parentId: "l3", kind: "call_session", 
      name: "Call 2025-08-14", slug: "2025-08-14", 
      createdAt: now, updatedAt: now,
      dashboardId: "db-call-5", dataRef: { type: "session", id: "session-005" }
    },
  ];

  const dashboards: Dashboard[] = [
    { id: "db-call-1", name: "Sales Call", version: "1.0.0", templateId: "sales-call-default", params: { sessionId: "$node.dataRef.id" } },
    { id: "db-call-2", name: "Sales Call", version: "1.0.0", templateId: "sales-call-default", params: { sessionId: "$node.dataRef.id" } },
    { id: "db-call-3", name: "Sales Call", version: "1.0.0", templateId: "sales-call-default", params: { sessionId: "$node.dataRef.id" } },
    { id: "db-call-4", name: "Sales Call", version: "1.0.0", templateId: "sales-call-default", params: { sessionId: "$node.dataRef.id" } },
    { id: "db-call-5", name: "Sales Call", version: "1.0.0", templateId: "sales-call-default", params: { sessionId: "$node.dataRef.id" } },
  ];

  const analyses: AnalysisRecord[] = [
    {
      id: "a-1", orgId, sessionId: "session-001", model: "mock:v1", createdAt: now,
      json: {
        version: "1.0.0", callId: "session-001",
        summary: "Great call with potential customer interested in our Enterprise package. They have budget and timeline fits well.",
        sentiment: { overall: "positive", score: 0.85 },
        bookingLikelihood: 0.75,
        objections: [{ type: "price", quote: "The price seems a bit high for our current budget", ts: "00:12:45" }],
        actionItems: [
          { owner: "sales_rep", text: "Send pricing proposal with discount options", due: "2024-01-15" },
          { owner: "prospect", text: "Review proposal with team", due: "2024-01-20" }
        ],
        keyMoments: [
          { label: "Budget Discussion", ts: "00:12:30" },
          { label: "Decision Timeline", ts: "00:18:15" }
        ],
        entities: { 
          prospect: ["ACME Corp"], 
          people: ["John Smith", "Sarah Johnson"], 
          products: ["Enterprise Package", "Analytics Module"] 
        },
        complianceFlags: []
      }
    },
    {
      id: "a-2", orgId, sessionId: "session-002", model: "mock:v1", createdAt: now,
      json: {
        version: "1.0.0", callId: "session-002",
        summary: "Follow-up call to address pricing concerns. Customer showing strong interest and moving toward decision.",
        sentiment: { overall: "positive", score: 0.92 },
        bookingLikelihood: 0.85,
        objections: [],
        actionItems: [
          { owner: "sales_rep", text: "Prepare final contract", due: "2024-01-18" },
          { owner: "prospect", text: "Get legal approval", due: "2024-01-25" }
        ],
        keyMoments: [
          { label: "Pricing Agreement", ts: "00:08:20" },
          { label: "Next Steps", ts: "00:15:10" }
        ],
        entities: { 
          prospect: ["ACME Corp"], 
          people: ["John Smith", "Sarah Johnson", "Mike Wilson"], 
          products: ["Enterprise Package"] 
        },
        complianceFlags: []
      }
    },
    {
      id: "a-3", orgId, sessionId: "session-003", model: "mock:v1", createdAt: now,
      json: {
        version: "1.0.0", callId: "session-003",
        summary: "Initial discovery call with Globex. They need a solution for their analytics needs but timeline is unclear.",
        sentiment: { overall: "neutral", score: 0.60 },
        bookingLikelihood: 0.45,
        objections: [
          { type: "timeline", quote: "We're not sure when we'd be ready to implement", ts: "00:20:30" },
          { type: "budget", quote: "Need to understand total cost of ownership", ts: "00:25:15" }
        ],
        actionItems: [
          { owner: "sales_rep", text: "Send case studies and ROI calculator", due: "2024-01-16" },
          { owner: "prospect", text: "Discuss internally and provide feedback", due: "2024-01-23" }
        ],
        keyMoments: [
          { label: "Pain Points Discussion", ts: "00:15:45" },
          { label: "Feature Demo", ts: "00:30:20" }
        ],
        entities: { 
          prospect: ["Globex Corporation"], 
          people: ["Alex Chen", "Lisa Park"], 
          products: ["Analytics Suite", "Pro Plan"] 
        },
        complianceFlags: []
      }
    },
    {
      id: "a-4", orgId, sessionId: "session-004", model: "mock:v1", createdAt: now,
      json: {
        version: "1.0.0", callId: "session-004",
        summary: "Globex follow-up call. They've reviewed our proposal and are interested in moving forward with a pilot program.",
        sentiment: { overall: "positive", score: 0.78 },
        bookingLikelihood: 0.65,
        objections: [
          { type: "scope", quote: "Can we start with a smaller pilot first?", ts: "00:10:15" }
        ],
        actionItems: [
          { owner: "sales_rep", text: "Create pilot program proposal", due: "2024-01-20" },
          { owner: "prospect", text: "Review pilot scope with technical team", due: "2024-01-27" }
        ],
        keyMoments: [
          { label: "Pilot Discussion", ts: "00:10:00" },
          { label: "Technical Requirements", ts: "00:22:30" }
        ],
        entities: { 
          prospect: ["Globex Corporation"], 
          people: ["Alex Chen", "Lisa Park", "Tom Rodriguez"], 
          products: ["Analytics Suite"] 
        },
        complianceFlags: []
      }
    },
    {
      id: "a-5", orgId, sessionId: "session-005", model: "mock:v1", createdAt: now,
      json: {
        version: "1.0.0", callId: "session-005",
        summary: "Initech discovery call. Early stage company looking for cost-effective solution. Price sensitivity is high.",
        sentiment: { overall: "neutral", score: 0.55 },
        bookingLikelihood: 0.30,
        objections: [
          { type: "budget", quote: "We're a startup and need to be very cost-conscious", ts: "00:08:20" },
          { type: "features", quote: "Do we really need all these features?", ts: "00:15:45" }
        ],
        actionItems: [
          { owner: "sales_rep", text: "Prepare startup pricing options", due: "2024-01-17" },
          { owner: "prospect", text: "Define minimum feature requirements", due: "2024-01-24" }
        ],
        keyMoments: [
          { label: "Budget Constraints", ts: "00:08:00" },
          { label: "Feature Prioritization", ts: "00:15:30" }
        ],
        entities: { 
          prospect: ["Initech"], 
          people: ["Peter Gibbons", "Michael Bolton"], 
          products: ["Starter Plan"] 
        },
        complianceFlags: []
      }
    }
  ];

  const allNodes = [
    root, 
    salesPipeline, 
    csTrialsPipeline, 
    acmeLead, 
    globexLead, 
    initechLead, 
    techCorpLead,
    ...callNodes
  ];

  return makeMemoryRepos({
    nodes: allNodes,
    dashboards: dashboards,
    sessions: sessions,
    analyses: analyses
  });
}