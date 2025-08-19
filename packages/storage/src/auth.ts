import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_ACCESS_EXPIRES = '15m';
const JWT_REFRESH_EXPIRES = '30d';

// Auth validation schemas
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false),
});

export const RefreshRequestSchema = z.object({
  refreshToken: z.string(),
});

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
  }),
  orgs: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.enum(['owner', 'viewer']),
  })),
  activeOrgId: z.string(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Hash password using argon2
   */
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /**
   * Generate JWT access token
   */
  generateAccessToken(userId: string, orgId: string): string {
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

  /**
   * Generate JWT refresh token and store in database
   */
  async generateRefreshToken(userId: string): Promise<string> {
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

    // Store in database with expiration
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): jwt.JwtPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'mudul-api',
        audience: 'mudul-app',
      }) as jwt.JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Login user with email/password
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    const { email, password, rememberMe } = request;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        memberships: {
          include: {
            org: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Verify password
    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Check user has at least one org membership
    if (user.memberships.length === 0) {
      throw new Error('NO_ORG_ACCESS');
    }

    // Use first org as active (in future, use last selected or user preference)
    const activeMembership = user.memberships[0];
    const activeOrgId = activeMembership.orgId;

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, activeOrgId);
    const refreshToken = rememberMe ? await this.generateRefreshToken(user.id) : undefined;

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      orgs: user.memberships.map((m: any) => ({
        id: m.org.id,
        name: m.org.name,
        role: m.role.toLowerCase() as 'owner' | 'viewer',
      })),
      activeOrgId,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(request: RefreshRequest): Promise<{ accessToken: string; refreshToken: string }> {
    const { refreshToken } = request;

    // Verify token format
    const payload = this.verifyToken(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    // Check token exists in database and is not expired
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            memberships: true,
          },
        },
      },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    // Get user's active org (use first membership for now)
    const activeOrgId = storedToken.user.memberships[0]?.orgId;
    if (!activeOrgId) {
      throw new Error('NO_ORG_ACCESS');
    }

    // Generate new access token
    const accessToken = this.generateAccessToken(storedToken.userId, activeOrgId);

    // Rotate refresh token (delete old, create new)
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });
    
    const newRefreshToken = await this.generateRefreshToken(storedToken.userId);

    return { 
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
  }

  /**
   * Get user info from access token
   */
  async getUserFromToken(accessToken: string): Promise<{ userId: string; orgId: string } | null> {
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