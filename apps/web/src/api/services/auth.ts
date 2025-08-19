import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

// Mock data (same as current AuthService but structured for backend)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_ACCESS_EXPIRES = '15m';
const JWT_REFRESH_EXPIRES = '30d';

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
  userId: string;
  orgId: string;
  role: 'owner' | 'viewer';
  createdAt: string;
}

// Mock data storage (in production this would be database calls)
const MOCK_USERS: Record<string, MockUser> = {};
const MOCK_ORGS: Record<string, MockOrg> = {};
const MOCK_MEMBERSHIPS: MockMembership[] = [];
const MOCK_REFRESH_TOKENS: Record<string, { userId: string; expiresAt: Date }> = {};

// Initialize mock data
async function initializeMockData() {
  if (Object.keys(MOCK_USERS).length > 0) return; // Already initialized

  // Create mock users with hashed passwords
  MOCK_USERS['demo@mudul.com'] = {
    id: 'user-1',
    email: 'demo@mudul.com',
    name: 'Demo User',
    passwordHash: await argon2.hash('password'),
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-15T10:00:00Z'
  };

  MOCK_USERS['viewer@mudul.com'] = {
    id: 'user-2', 
    email: 'viewer@mudul.com',
    name: 'Viewer User',
    passwordHash: await argon2.hash('password'),
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-15T10:00:00Z'
  };

  // Create mock org
  MOCK_ORGS['acme'] = {
    id: 'acme',
    name: 'Acme Sales',
    planTier: 'pro',
    createdAt: '2024-01-01T00:00:00Z'
  };

  // Create mock memberships
  MOCK_MEMBERSHIPS.push({
    userId: 'user-1',
    orgId: 'acme',
    role: 'owner',
    createdAt: '2024-01-01T00:00:00Z'
  });

  MOCK_MEMBERSHIPS.push({
    userId: 'user-2',
    orgId: 'acme', 
    role: 'viewer',
    createdAt: '2024-01-01T00:00:00Z'
  });
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
    const token = jwt.sign(
      { 
        sub: userId,
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

    // Store in mock storage
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
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

  static async login(email: string, password: string, rememberMe = false) {
    await initializeMockData();

    const user = MOCK_USERS[email.toLowerCase()];
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Verify password
    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Get user's memberships
    const memberships = MOCK_MEMBERSHIPS.filter(m => m.userId === user.id);
    if (memberships.length === 0) {
      throw new Error('NO_ORG_ACCESS');
    }

    // Use first org as active
    const activeMembership = memberships[0];

    // Generate tokens
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
      orgs: memberships.map(m => ({
        id: m.orgId,
        name: MOCK_ORGS[m.orgId].name,
        role: m.role,
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

    // Get user's org membership
    const membership = MOCK_MEMBERSHIPS.find(m => m.userId === storedToken.userId);
    if (!membership) {
      throw new Error('NO_ORG_ACCESS');
    }

    // Generate new tokens and rotate refresh token
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