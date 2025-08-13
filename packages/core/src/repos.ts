import type { Node, Dashboard, Session, AnalysisRecord } from "./types.js";

export interface NodeRepo {
  byId(id: string): Promise<Node | null>;
  byPath(orgId: string, slugs: string[]): Promise<Node | null>;
  children(parentId: string, orgId: string): Promise<Node[]>;
  create(node: Node): Promise<void>;
}

export interface DashboardRepo {
  get(id: string): Promise<Dashboard | null>;
  save(dashboard: Dashboard): Promise<void>;
}

export interface SessionRepo {
  get(id: string): Promise<Session | null>;
  save(session: Session): Promise<void>;
}

export interface AnalysisRepo {
  get(id: string): Promise<AnalysisRecord | null>;
  latestForSession(sessionId: string): Promise<AnalysisRecord | null>;
  save(analysis: AnalysisRecord): Promise<void>;
}

export interface Repos {
  nodes: NodeRepo;
  dashboards: DashboardRepo;
  sessions: SessionRepo;
  analyses: AnalysisRepo;
}

interface MemoryReposSeed {
  nodes?: Node[];
  dashboards?: Dashboard[];
  sessions?: Session[];
  analyses?: AnalysisRecord[];
}

class MemoryNodeRepo implements NodeRepo {
  private nodes = new Map<string, Node>();
  private nodesByParent = new Map<string, Node[]>();

  constructor(nodes: Node[] = []) {
    for (const node of nodes) {
      this.nodes.set(node.id, node);
      const parentId = node.parentId || "root";
      if (!this.nodesByParent.has(parentId)) {
        this.nodesByParent.set(parentId, []);
      }
      this.nodesByParent.get(parentId)!.push(node);
    }
  }

  async byId(id: string): Promise<Node | null> {
    return this.nodes.get(id) || null;
  }

  async byPath(orgId: string, slugs: string[]): Promise<Node | null> {
    // Start with root nodes
    const currentNodes = this.nodesByParent.get("root") || [];
    let currentNode: Node | null = null;

    // Find root node for orgId
    for (const node of currentNodes) {
      if (node.orgId === orgId && node.parentId === null) {
        currentNode = node;
        break;
      }
    }

    if (!currentNode) return null;

    // Navigate through slugs
    for (const slug of slugs) {
      const children: Node[] = this.nodesByParent.get(currentNode.id) || [];
      const found: Node | undefined = children.find((child: Node) => child.slug === slug);
      if (!found) return null;
      currentNode = found;
    }

    return currentNode;
  }

  async children(parentId: string, orgId: string): Promise<Node[]> {
    const allChildren = this.nodesByParent.get(parentId) || [];
    return allChildren.filter(node => node.orgId === orgId);
  }

  async create(node: Node): Promise<void> {
    this.nodes.set(node.id, node);
    const parentId = node.parentId || "root";
    if (!this.nodesByParent.has(parentId)) {
      this.nodesByParent.set(parentId, []);
    }
    this.nodesByParent.get(parentId)!.push(node);
  }
}

class MemoryDashboardRepo implements DashboardRepo {
  private dashboards = new Map<string, Dashboard>();

  constructor(dashboards: Dashboard[] = []) {
    for (const dashboard of dashboards) {
      this.dashboards.set(dashboard.id, dashboard);
    }
  }

  async get(id: string): Promise<Dashboard | null> {
    return this.dashboards.get(id) || null;
  }

  async save(dashboard: Dashboard): Promise<void> {
    this.dashboards.set(dashboard.id, dashboard);
  }
}

class MemorySessionRepo implements SessionRepo {
  private sessions = new Map<string, Session>();

  constructor(sessions: Session[] = []) {
    for (const session of sessions) {
      this.sessions.set(session.id, session);
    }
  }

  async get(id: string): Promise<Session | null> {
    return this.sessions.get(id) || null;
  }

  async save(session: Session): Promise<void> {
    this.sessions.set(session.id, session);
  }
}

class MemoryAnalysisRepo implements AnalysisRepo {
  private analyses = new Map<string, AnalysisRecord>();
  private analysesBySession = new Map<string, AnalysisRecord[]>();

  constructor(analyses: AnalysisRecord[] = []) {
    for (const analysis of analyses) {
      this.analyses.set(analysis.id, analysis);
      if (!this.analysesBySession.has(analysis.sessionId)) {
        this.analysesBySession.set(analysis.sessionId, []);
      }
      this.analysesBySession.get(analysis.sessionId)!.push(analysis);
    }
  }

  async get(id: string): Promise<AnalysisRecord | null> {
    return this.analyses.get(id) || null;
  }

  async latestForSession(sessionId: string): Promise<AnalysisRecord | null> {
    const sessionAnalyses = this.analysesBySession.get(sessionId) || [];
    if (sessionAnalyses.length === 0) return null;
    
    // Return the most recent one by createdAt
    return sessionAnalyses.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }

  async save(analysis: AnalysisRecord): Promise<void> {
    this.analyses.set(analysis.id, analysis);
    if (!this.analysesBySession.has(analysis.sessionId)) {
      this.analysesBySession.set(analysis.sessionId, []);
    }
    this.analysesBySession.get(analysis.sessionId)!.push(analysis);
  }
}

export function makeMemoryRepos(seed: MemoryReposSeed = {}): Repos {
  return {
    nodes: new MemoryNodeRepo(seed.nodes),
    dashboards: new MemoryDashboardRepo(seed.dashboards),
    sessions: new MemorySessionRepo(seed.sessions),
    analyses: new MemoryAnalysisRepo(seed.analyses),
  };
}