export interface DemoOrganization {
  id: string;
  name: string;
  planTier: string;
  createdAt: string;
}

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface DemoMembership {
  id: string;
  userId: string;
  orgId: string;
  role: 'owner' | 'viewer';
  createdAt: string;
}

export interface DemoClient {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface DemoObjection {
  type: string;
  quote: string;
  ts?: string;
}

export interface DemoKeyMoment {
  label: string;
  ts?: string;
}

export interface DemoEntities {
  prospect: string[];
  people: string[];
  products: string[];
}

export interface DemoCall {
  id: string;
  orgId: string;
  clientId: string;
  name: string;
  slug: string;
  sessionId: string;
  summary: string;
  ts: string;
  durationSec: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  bookingLikelihood: number;
  objections: DemoObjection[];
  keyMoments: DemoKeyMoment[];
  entities: DemoEntities;
  complianceFlags: string[];
}

export interface DemoActionItem {
  id: string;
  orgId: string;
  clientId: string;
  callId: string;
  owner: string;
  ownerId: string | null;
  text: string;
  due: string | null;
  status: 'open' | 'done';
}

export const demoOrganizations: DemoOrganization[];
export const demoUsers: DemoUser[];
export const demoMemberships: DemoMembership[];
export const demoClients: DemoClient[];
export const demoCalls: DemoCall[];
export const demoActionItems: DemoActionItem[];