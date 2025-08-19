import type { NodeBase, SalesCallMinimal } from "./types";

const now = new Date().toISOString();

// Node hierarchy: Root (Acme) -> Clients (multiple) -> Calls (multiple per client)
export const nodes: Record<string, NodeBase> = {
  "root": {
    id: "root",
    orgId: "acme",
    parentId: null,
    kind: "group",
    name: "Acme Sales Org",
    slug: "",
    dashboardId: "org-dashboard",
    createdAt: now,
    updatedAt: now
  },
  
  // Client 1: Acme Corp
  "client-acme": {
    id: "client-acme",
    orgId: "acme", 
    parentId: "root",
    kind: "lead",
    name: "Acme Corp",
    slug: "acme-corp",
    dashboardId: "client-dashboard",
    createdAt: now,
    updatedAt: now
  },
  
  "call-acme-1": {
    id: "call-acme-1",
    orgId: "acme",
    parentId: "client-acme",
    kind: "call_session",
    name: "Discovery Call - Jan 15",
    slug: "discovery-jan-15",
    dashboardId: "sales-call-default",
    dataRef: { type: "session", id: "session-acme-1" },
    createdAt: now,
    updatedAt: now
  },
  
  "call-acme-2": {
    id: "call-acme-2",
    orgId: "acme",
    parentId: "client-acme",
    kind: "call_session",
    name: "Follow-up Call - Jan 20",
    slug: "followup-jan-20",
    dashboardId: "sales-call-default",
    dataRef: { type: "session", id: "session-acme-2" },
    createdAt: now,
    updatedAt: now
  },
  
  // Client 2: Beta Systems
  "client-beta": {
    id: "client-beta",
    orgId: "acme",
    parentId: "root", 
    kind: "lead",
    name: "Beta Systems",
    slug: "beta-systems",
    dashboardId: "client-dashboard",
    createdAt: now,
    updatedAt: now
  },
  
  "call-beta-1": {
    id: "call-beta-1",
    orgId: "acme",
    parentId: "client-beta",
    kind: "call_session",
    name: "Initial Contact - Jan 12",
    slug: "initial-jan-12",
    dashboardId: "sales-call-default",
    dataRef: { type: "session", id: "session-beta-1" },
    createdAt: now,
    updatedAt: now
  },
  
  "call-beta-2": {
    id: "call-beta-2",
    orgId: "acme",
    parentId: "client-beta",
    kind: "call_session",
    name: "Demo Call - Jan 18",
    slug: "demo-jan-18",
    dashboardId: "sales-call-default", 
    dataRef: { type: "session", id: "session-beta-2" },
    createdAt: now,
    updatedAt: now
  },
  
  // Client 3: Gamma Industries
  "client-gamma": {
    id: "client-gamma",
    orgId: "acme",
    parentId: "root",
    kind: "lead", 
    name: "Gamma Industries",
    slug: "gamma-industries",
    dashboardId: "client-dashboard",
    createdAt: now,
    updatedAt: now
  },
  
  "call-gamma-1": {
    id: "call-gamma-1",
    orgId: "acme",
    parentId: "client-gamma",
    kind: "call_session",
    name: "Qualification Call - Jan 22",
    slug: "qualification-jan-22",
    dashboardId: "sales-call-default",
    dataRef: { type: "session", id: "session-gamma-1" },
    createdAt: now,
    updatedAt: now
  }
};

// Sales call data keyed by nodeId
export const calls: Record<string, SalesCallMinimal> = {
  "call-acme-1": {
    summary: "Great discovery call with Acme Corp. They're interested in our enterprise solution to solve their scaling challenges.",
    sentiment: { overall: "positive", score: 0.8 },
    bookingLikelihood: 0.75,
    objections: [
      { type: "budget", quote: "Need to discuss budget with CFO", ts: "00:15:30" }
    ],
    actionItems: [
      { owner: "rep", text: "Send enterprise pricing proposal", due: "2024-01-18" },
      { owner: "prospect", text: "Review with technical team", due: "2024-01-17" }
    ],
    keyMoments: [
      { label: "pain point identified", ts: "00:05:45" },
      { label: "budget discussion", ts: "00:15:30" }
    ],
    entities: { 
      prospect: ["Acme Corp"], 
      people: ["John Smith", "Sarah Johnson"], 
      products: ["Enterprise Plan"] 
    },
    complianceFlags: []
  },
  
  "call-acme-2": {
    summary: "Follow-up call went well. Acme Corp is ready to move forward with pilot program.",
    sentiment: { overall: "positive", score: 0.9 },
    bookingLikelihood: 0.9,
    objections: [],
    actionItems: [
      { owner: "rep", text: "Prepare pilot program proposal", due: "2024-01-25" },
      { owner: "rep", text: "Schedule technical onboarding", due: null }
    ],
    keyMoments: [
      { label: "pilot agreement", ts: "00:08:15" },
      { label: "timeline discussion", ts: "00:12:00" }
    ],
    entities: { 
      prospect: ["Acme Corp"], 
      people: ["John Smith", "Michael Davis"], 
      products: ["Enterprise Plan", "Professional Services"] 
    },
    complianceFlags: []
  },
  
  "call-beta-1": {
    summary: "Initial contact with Beta Systems. They have budget constraints but are interested in our basic offering.",
    sentiment: { overall: "neutral", score: 0.6 },
    bookingLikelihood: 0.4,
    objections: [
      { type: "budget", quote: "Our budget is quite limited this quarter", ts: "00:10:15" },
      { type: "timing", quote: "Might need to wait until Q2", ts: "00:18:45" }
    ],
    actionItems: [
      { owner: "rep", text: "Send basic plan pricing", due: "2024-01-15" },
      { owner: "prospect", text: "Discuss with procurement", due: "2024-01-20" }
    ],
    keyMoments: [
      { label: "budget concerns", ts: "00:10:15" },
      { label: "Q2 timeline", ts: "00:18:45" }
    ],
    entities: { 
      prospect: ["Beta Systems"], 
      people: ["Lisa Wong", "David Kim"], 
      products: ["Basic Plan"] 
    },
    complianceFlags: []
  },
  
  "call-beta-2": {
    summary: "Demo went very well! Beta Systems loved the user interface and core features.",
    sentiment: { overall: "positive", score: 0.85 },
    bookingLikelihood: 0.7,
    objections: [
      { type: "integration", quote: "Need to ensure it works with our existing systems", ts: "00:22:30" }
    ],
    actionItems: [
      { owner: "rep", text: "Provide integration documentation", due: "2024-01-22" },
      { owner: "rep", text: "Schedule technical Q&A session", due: "2024-01-25" }
    ],
    keyMoments: [
      { label: "demo highlight", ts: "00:08:00" },
      { label: "integration questions", ts: "00:22:30" }
    ],
    entities: { 
      prospect: ["Beta Systems"], 
      people: ["Lisa Wong", "Robert Chen"], 
      products: ["Basic Plan", "API Integration"] 
    },
    complianceFlags: []
  },
  
  "call-gamma-1": {
    summary: "Qualification call with Gamma Industries. Large enterprise with complex needs.",
    sentiment: { overall: "neutral", score: 0.55 },
    bookingLikelihood: 0.5,
    objections: [
      { type: "complexity", quote: "Our requirements are quite complex", ts: "00:12:00" },
      { type: "decision_making", quote: "Multiple stakeholders need to be involved", ts: "00:20:15" }
    ],
    actionItems: [
      { owner: "rep", text: "Schedule stakeholder presentation", due: "2024-01-30" },
      { owner: "prospect", text: "Compile detailed requirements", due: "2024-01-28" }
    ],
    keyMoments: [
      { label: "requirements discussion", ts: "00:12:00" },
      { label: "stakeholder identification", ts: "00:20:15" }
    ],
    entities: { 
      prospect: ["Gamma Industries"], 
      people: ["Amanda Rodriguez", "Thomas Wilson", "Jennifer Lee"], 
      products: ["Enterprise Plan", "Custom Integration"] 
    },
    complianceFlags: ["multi-stakeholder-approval"]
  }
};