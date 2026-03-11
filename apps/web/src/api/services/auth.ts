import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import {
  demoMemberships,
  demoOrganizations,
  demoUsers,
} from '../../../../../packages/core/src/demo-data.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_ACCESS_EXPIRES = '15m';
const JWT_REFRESH_EXPIRES = '30d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

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

function getMembershipsForUser(userId: string) {
  return MOCK_MEMBERSHIPS.filter((membership) => membership.userId === userId);
}

function ensureMembershipForUser(userId: string, email: string, name: string) {
  const memberships = getMembershipsForUser(userId);
  if (memberships.length > 0) {
    return memberships;
  }

  const orgId = createMockId('org');
  MOCK_ORGS[orgId] = {
    id: orgId,
    name: createWorkspaceName(name, email),
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
}