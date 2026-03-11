import type { 
  User, 
  Organization, 
  Membership, 
  AuthSession, 
  LoginCredentials, 
  AuthError, 
  AuthResponse 
} from './types';
import { getAuthItem, setAuthItem, removeAuthItem, clearAuthData } from '../utils/storage';
import {
  demoMemberships,
  demoOrganizations,
  demoUsers,
} from '../../../../packages/core/src/demo-data.js';

// Mock data for development - in production this would come from a real backend
const MOCK_USERS: Record<string, User & { password: string }> = Object.fromEntries(
  demoUsers.map((user) => [
    user.email,
    {
      id: user.id,
      email: user.email,
      name: user.name,
      password: 'password',
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
  ])
);

const MOCK_ORGS: Record<string, Organization> = Object.fromEntries(
  demoOrganizations.map((org) => [org.id, org])
);

const MOCK_MEMBERSHIPS: Membership[] = demoMemberships;

class AuthService {
  private static instance: AuthService;
  private currentSession: AuthSession | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Generate a correlation ID for error tracking
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a structured error response
   */
  private createError(code: string, message: string, details?: string[]): AuthError {
    return {
      code,
      message,
      details,
      correlationId: this.generateCorrelationId()
    };
  }

  /**
   * Generate mock JWT tokens (in production, these would come from the server)
   */
  private generateTokens(user: User, rememberMe: boolean = false): { accessToken: string; refreshToken?: string; expiresAt: string } {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (15 * 60 * 1000)); // 15 minutes

    // Simple mock token (in production, use proper JWT)
    const accessToken = `access_${user.id}_${now.getTime()}`;
    const refreshToken = rememberMe ? `refresh_${user.id}_${now.getTime()}` : undefined;

    return {
      accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString()
    };
  }

  /**
   * Simulate API delay
   */
  private async simulateDelay(ms: number = 500): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Authenticate user with email/password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await this.simulateDelay();

    const { email, password, rememberMe = false } = credentials;

    // Check if user exists
    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (!mockUser || mockUser.password !== password) {
      throw this.createError('invalid_credentials', 'Invalid email or password');
    }

    // Get user's organization and membership
    const membership = MOCK_MEMBERSHIPS.find(m => m.userId === mockUser.id);
    if (!membership) {
      throw this.createError('no_membership', 'User has no organization membership');
    }

    const organization = MOCK_ORGS[membership.orgId];
    if (!organization) {
      throw this.createError('org_not_found', 'Organization not found');
    }

    // Generate tokens
    const tokens = this.generateTokens(mockUser, rememberMe);

    // Update last login
    const user: User = {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      avatarUrl: mockUser.avatarUrl,
      createdAt: mockUser.createdAt,
      lastLoginAt: new Date().toISOString()
    };

    // Create session
    const session: AuthSession = {
      user,
      organization,
      membership,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt
    };

    // Store session
    this.currentSession = session;
    this.storeSession(session);

    return {
      session,
      isFirstLogin: false // For demo purposes, assume not first login
    };
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    await this.simulateDelay(200);

    this.currentSession = null;
    clearAuthData();
  }

  /**
   * Get current session
   */
  getCurrentSession(): AuthSession | null {
    if (this.currentSession) {
      return this.currentSession;
    }

    // Try to restore from storage
    const sessionData = getAuthItem('session');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData) as AuthSession;
        
        // Check if session is expired
        if (new Date(session.expiresAt) > new Date()) {
          this.currentSession = session;
          return session;
        } else {
          // Session expired, clear it
          this.clearStoredSession();
        }
      } catch (error) {
        // Invalid session data, clear it
        this.clearStoredSession();
      }
    }

    return null;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<AuthSession> {
    await this.simulateDelay(300);

    const session = this.getCurrentSession();
    if (!session?.refreshToken) {
      throw this.createError('no_refresh_token', 'No valid refresh token available');
    }

    // Generate new tokens
    const tokens = this.generateTokens(session.user, true);

    // Update session
    const newSession: AuthSession = {
      ...session,
      accessToken: tokens.accessToken,
      expiresAt: tokens.expiresAt
    };

    this.currentSession = newSession;
    this.storeSession(newSession);

    return newSession;
  }

  /**
   * Check if current session needs refresh
   */
  shouldRefreshToken(): boolean {
    const session = this.getCurrentSession();
    if (!session) return false;

    const expiresAt = new Date(session.expiresAt);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    // Refresh if expires in less than 5 minutes
    return timeUntilExpiry < (5 * 60 * 1000);
  }

  /**
   * Store session in localStorage
   */
  private storeSession(session: AuthSession): void {
    setAuthItem('session', JSON.stringify(session));
    
    // Store last selected org for restoration
    setAuthItem('lastOrgId', session.organization.id);
  }

  /**
   * Clear stored session
   */
  private clearStoredSession(): void {
    removeAuthItem('session');
  }

  /**
   * Get last selected organization ID
   */
  getLastOrgId(): string | null {
    return getAuthItem('lastOrgId');
  }
}

export const authService = AuthService.getInstance();
export { AuthService };