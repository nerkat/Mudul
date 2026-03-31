import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import {
  demoMemberships,
  demoOrganizations,
  demoUsers,
  demoClients,
  demoCalls,
  demoActionItems,
} from '../../../../../packages/core/src/demo-data.js';
// The mock fallback service directly mutates the shared in-memory seed stores (nodes/calls)
// so that MockDataService (data.ts) reflects seeded org data. This is intentional for the
// mock/fallback path only — production code uses the SQLite service.
import { nodes, calls } from '../../core/seed';
import type { NodeBase, SalesCallMinimal } from '../../core/types';

const DEFAULT_JWT_SECRET = 'dev-secret-key-change-in-production';

function getJwtSecret(): string {
  const configuredSecret = process.env.JWT_SECRET?.trim();

  if (process.env.NODE_ENV === 'production') {
    if (!configuredSecret || configuredSecret === DEFAULT_JWT_SECRET) {
      throw new Error('JWT_SECRET_NOT_CONFIGURED');
    }
  }

  return configuredSecret || DEFAULT_JWT_SECRET;
}

const JWT_SECRET = getJwtSecret();
const JWT_ACCESS_EXPIRES = '15m';
const JWT_REFRESH_EXPIRES = '30d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

// Reference org whose demo data is copied into every new workspace
const DEMO_SEED_ORG_ID = 'acme-sales-org';

interface MockUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt: string;
}

interface MockOrg {
  id: string;
  name: string;
  planTier: string;
  createdAt: string;
}

interface MockMembership {
  id?: string;
  userId: string;
  orgId: string;
  role: 'owner' | 'viewer';
  createdAt: string;
}

const MOCK_USERS: Record<string, MockUser> = {};
const MOCK_ORGS: Record<string, MockOrg> = {};
const MOCK_MEMBERSHIPS: MockMembership[] = [];
const MOCK_REFRESH_TOKENS: Record<string, { userId: string; expiresAt: Date }> = {};
const MOCK_GOOGLE_IDENTITIES: Record<string, { userId: string; email: string }> = {};

let googleClientPromise: Promise<any> | null = null;

async function verifyGoogleCredential(credential: string): Promise<{ sub: string; email: string; name: string }> {
  if (process.env.NODE_ENV === 'test' && credential.startsWith('test-google-token:')) {
    const [, rawEmail = '', rawName = 'Test User'] = credential.split(':');
    const email = decodeURIComponent(rawEmail).toLowerCase();
    const name = decodeURIComponent(rawName || 'Test User');

    if (!email.includes('@')) {
      throw new Error('GOOGLE_TOKEN_INVALID');
    }

    return {
      sub: `test-${email}`,
      email,
      name,
    };
  }

  if (!GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_AUTH_NOT_CONFIGURED');
  }

  if (!googleClientPromise) {
    googleClientPromise = import('google-auth-library').then(({ OAuth2Client }) => new OAuth2Client(GOOGLE_CLIENT_ID));
  }

  const client = await googleClientPromise;
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email || !payload.email_verified) {
    throw new Error('GOOGLE_TOKEN_INVALID');
  }

  if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
    throw new Error('GOOGLE_TOKEN_INVALID');
  }

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split('@')[0],
  };
}

function createMockId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

function createWorkspaceName(name: string, email: string): string {
  const base = (name || email.split('@')[0] || 'New user').trim();
  return `${base}'s Workspace`;
}

function slugify(value: string): string {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled';
}

function getMembershipsForUser(userId: string) {
  return MOCK_MEMBERSHIPS.filter((membership) => membership.userId === userId);
}

function seedDemoDataForMockOrg(orgId: string, orgName: string) {
  // Add a root node for the new org
  const rootId = `root-${orgId}`;
  nodes[rootId] = {
    id: rootId,
    orgId,
    parentId: null,
    kind: 'group',
    name: orgName,
    slug: slugify(orgName),
    dashboardId: 'org-dashboard',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as NodeBase;

  // Map demo client IDs to new org-scoped IDs
  const clientIdMap: Record<string, string> = {};
  for (const client of demoClients.filter((c) => c.orgId === DEMO_SEED_ORG_ID)) {
    const newClientId = `${orgId}-${client.id}`;
    clientIdMap[client.id] = newClientId;
    nodes[newClientId] = {
      id: newClientId,
      orgId,
      parentId: rootId,
      kind: 'lead',
      name: client.name,
      slug: client.slug,
      dashboardId: 'client-dashboard',
      createdAt: client.createdAt,
      updatedAt: client.createdAt,
    } as NodeBase;
  }

  // Map demo call IDs to new org-scoped IDs and populate call data
  for (const call of demoCalls.filter((c) => c.orgId === DEMO_SEED_ORG_ID)) {
    if (!clientIdMap[call.clientId]) continue;
    const newCallId = `${orgId}-${call.id}`;
    nodes[newCallId] = {
      id: newCallId,
      orgId,
      parentId: clientIdMap[call.clientId],
      kind: 'call_session',
      name: call.name,
      slug: call.slug,
      dashboardId: 'sales-call-default',
      dataRef: { type: 'session', id: `session-${newCallId}` },
      createdAt: call.ts,
      updatedAt: call.ts,
    } as NodeBase;

    calls[newCallId] = {
      id: newCallId,
      summary: call.summary,
      sentiment: { overall: call.sentiment as 'positive' | 'neutral' | 'negative', score: call.score },
      bookingLikelihood: call.bookingLikelihood,
      objections: call.objections,
      actionItems: demoActionItems
        .filter((ai) => ai.callId === call.id)
        .map((ai) => ({ owner: ai.owner, text: ai.text, due: ai.due })),
      keyMoments: call.keyMoments,
      entities: call.entities,
      complianceFlags: call.complianceFlags,
    } as SalesCallMinimal;
  }
}

function orgHasSeedVisibleData(orgId: string): boolean {
  return Object.values(nodes).some(
    (node) => node.orgId === orgId && !node.archivedAt && (node.kind === 'lead' || node.kind === 'call_session')
  );
}

function ensureMockOrgHasSeedData(orgId: string, orgName: string) {
  if (!orgId || orgHasSeedVisibleData(orgId)) {
    return;
  }

  seedDemoDataForMockOrg(orgId, orgName);
}

function ensureMembershipForUser(userId: string, email: string, name: string) {
  const memberships = getMembershipsForUser(userId);
  if (memberships.length > 0) {
    const activeMembership = memberships[0];
    const activeOrg = MOCK_ORGS[activeMembership.orgId];
    if (activeOrg) {
      ensureMockOrgHasSeedData(activeMembership.orgId, activeOrg.name);
    }
    return getMembershipsForUser(userId);
  }

  const orgId = createMockId('org');
  const orgName = createWorkspaceName(name, email);
  MOCK_ORGS[orgId] = {
    id: orgId,
    name: orgName,
    planTier: 'pro',
    createdAt: new Date().toISOString(),
  };
  MOCK_MEMBERSHIPS.push({
    id: createMockId('membership'),
    userId,
    orgId,
    role: 'owner',
    createdAt: new Date().toISOString(),
  });

  // Seed demo data into new org so all users start with example content
  seedDemoDataForMockOrg(orgId, orgName);

  return getMembershipsForUser(userId);
}

async function initializeMockData() {
  if (Object.keys(MOCK_USERS).length > 0) return;

  for (const user of demoUsers) {
    MOCK_USERS[user.email] = {
      ...user,
      passwordHash: `GOOGLE_AUTH_ONLY:${user.id}`,
    };
  }

  for (const org of demoOrganizations) {
    MOCK_ORGS[org.id] = org;
  }

  for (const membership of demoMemberships) {
    MOCK_MEMBERSHIPS.push(membership);
  }
}

export class MockAuthService {
  static async initialize() {
    await initializeMockData();
  }

  static async ensureOrgHasSeedData(orgId: string, userId: string) {
    await initializeMockData();

    const memberships = getMembershipsForUser(userId);
    const membership = memberships.find((item) => item.orgId === orgId) || memberships[0];
    if (!membership) {
      return;
    }

    const org = MOCK_ORGS[membership.orgId];
    if (!org) {
      return;
    }

    ensureMockOrgHasSeedData(membership.orgId, org.name);
  }

  static generateAccessToken(userId: string, orgId: string): string {
    return jwt.sign(
      {
        sub: userId,
        orgId,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      {
        expiresIn: JWT_ACCESS_EXPIRES,
        issuer: 'mudul-api',
        audience: 'mudul-app',
      }
    );
  }

  static generateRefreshToken(userId: string): string {
    const tokenId = createMockId('rt');
    const token = jwt.sign(
      {
        sub: userId,
        jti: tokenId,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      {
        expiresIn: JWT_REFRESH_EXPIRES,
        issuer: 'mudul-api',
        audience: 'mudul-app',
      }
    );

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    MOCK_REFRESH_TOKENS[token] = { userId, expiresAt };

    return token;
  }

  static verifyToken(token: string): jwt.JwtPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'mudul-api',
        audience: 'mudul-app',
      }) as jwt.JwtPayload;
    } catch {
      return null;
    }
  }

  static async loginWithGoogle(credential: string, rememberMe = true) {
    await initializeMockData();

    const profile = await verifyGoogleCredential(credential);
    const googleKey = `google:${profile.sub}`;
    let userId = MOCK_GOOGLE_IDENTITIES[googleKey]?.userId;

    if (!userId) {
      const existingUser = MOCK_USERS[profile.email];

      if (existingUser) {
        userId = existingUser.id;
        existingUser.name = profile.name;
        existingUser.lastLoginAt = new Date().toISOString();
      } else {
        userId = createMockId('user');
        MOCK_USERS[profile.email] = {
          id: userId,
          email: profile.email,
          name: profile.name,
          passwordHash: `GOOGLE_AUTH_ONLY:${profile.sub}`,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
      }

      MOCK_GOOGLE_IDENTITIES[googleKey] = {
        userId,
        email: profile.email,
      };
    }

    const user = MOCK_USERS[profile.email] || Object.values(MOCK_USERS).find((candidate) => candidate.id === userId);
    if (!user) {
      throw new Error('INTERNAL_ERROR');
    }

    user.name = profile.name;
    user.lastLoginAt = new Date().toISOString();

    const memberships = ensureMembershipForUser(user.id, profile.email, profile.name);
    const activeMembership = memberships[0];
    const accessToken = this.generateAccessToken(user.id, activeMembership.orgId);
    const refreshToken = rememberMe ? this.generateRefreshToken(user.id) : undefined;

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      orgs: memberships.map((membership) => ({
        id: membership.orgId,
        name: MOCK_ORGS[membership.orgId].name,
        role: membership.role,
      })),
      activeOrgId: activeMembership.orgId,
    };
  }

  static async refreshToken(refreshToken: string) {
    const payload = this.verifyToken(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const storedToken = MOCK_REFRESH_TOKENS[refreshToken];
    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const membership = MOCK_MEMBERSHIPS.find((entry) => entry.userId === storedToken.userId);
    if (!membership) {
      throw new Error('NO_ORG_ACCESS');
    }

    const accessToken = this.generateAccessToken(storedToken.userId, membership.orgId);
    delete MOCK_REFRESH_TOKENS[refreshToken];
    const newRefreshToken = this.generateRefreshToken(storedToken.userId);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  static logout(refreshToken?: string) {
    if (refreshToken && MOCK_REFRESH_TOKENS[refreshToken]) {
      delete MOCK_REFRESH_TOKENS[refreshToken];
    }
  }

  static getUserFromToken(accessToken: string): { userId: string; orgId: string } | null {
    const payload = this.verifyToken(accessToken);
    if (!payload || payload.type !== 'access') {
      return null;
    }

    return {
      userId: payload.sub!,
      orgId: payload.orgId!,
    };
  }

  static async loginAsDemoUser() {
    await initializeMockData();

    const demoUser = MOCK_USERS['demo@mudul.com'];
    if (!demoUser) throw new Error('DEMO_USER_NOT_FOUND');

    const memberships = ensureMembershipForUser(demoUser.id, demoUser.email, demoUser.name);
    const activeMembership = memberships[0];
    const accessToken = this.generateAccessToken(demoUser.id, activeMembership.orgId);
    const refreshToken = this.generateRefreshToken(demoUser.id);

    return {
      accessToken,
      refreshToken,
      user: { id: demoUser.id, email: demoUser.email, name: demoUser.name },
      orgs: memberships.map((m) => ({ id: m.orgId, name: MOCK_ORGS[m.orgId].name, role: m.role })),
      activeOrgId: activeMembership.orgId,
    };
  }
}