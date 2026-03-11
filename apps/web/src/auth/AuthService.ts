import type { 
  AuthSession, 
  LoginCredentials, 
  GoogleLoginRequest,
  AuthError, 
  AuthResponse 
} from './types';
import { getAuthItem, setAuthItem, removeAuthItem, clearAuthData } from '../utils/storage';

// HTTP client for API calls
class ApiClient {
  private baseUrl = ''; // Same origin

  async post(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'HTTP_ERROR');
    }

    return result;
  }

  async get(endpoint: string, token?: string): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'HTTP_ERROR');
    }

    return result;
  }
}

class AuthService {
  private static instance: AuthService;
  private currentSession: AuthSession | null = null;
  private apiClient = new ApiClient();

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
   * Simulate API delay (remove in production)
   */
  private async simulateDelay(ms: number = 300): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Authenticate user with email/password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await this.simulateDelay();

    try {
      const result = await this.apiClient.post('/api/auth/login', credentials);

      return this.consumeAuthResult(result);
    } catch (error: any) {
      console.error('Login failed:', error);

      if (error.message === 'INVALID_CREDENTIALS') {
        throw this.createError('invalid_credentials', 'Invalid email or password');
      }

      if (error.message === 'NO_ORG_ACCESS') {
        throw this.createError('no_membership', 'User has no organization membership');
      }

      if (error.message === 'RATE_LIMIT_EXCEEDED') {
        throw this.createError('rate_limit', 'Too many login attempts. Please try again later.');
      }

      throw this.createError('server_error', 'Login failed due to server error');
    }
  }

  /**
   * Authenticate user with a Google credential
   */
  async loginWithGoogle(request: GoogleLoginRequest): Promise<AuthResponse> {
    await this.simulateDelay(200);

    try {
      const result = await this.apiClient.post('/api/auth/google', request);
      return this.consumeAuthResult(result);
    } catch (error: any) {
      console.error('Google login failed:', error);

      if (error.message === 'GOOGLE_TOKEN_INVALID') {
        throw this.createError('google_token_invalid', 'Google sign-in failed. Please try again.');
      }

      if (error.message === 'GOOGLE_AUTH_NOT_CONFIGURED') {
        throw this.createError('google_not_configured', 'Google sign-in is not configured for this environment.');
      }

      if (error.message === 'RATE_LIMIT_EXCEEDED') {
        throw this.createError('rate_limit', 'Too many login attempts. Please try again later.');
      }

      throw this.createError('server_error', 'Google sign-in failed due to server error');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<AuthSession> {
    await this.simulateDelay(200);

    const session = this.getCurrentSession();
    if (!session?.refreshToken) {
      throw this.createError('no_refresh_token', 'No valid refresh token available');
    }

    try {
      const result = await this.apiClient.post('/api/auth/refresh', {
        refreshToken: session.refreshToken
      });

      // Update session with new tokens
      const newSession: AuthSession = {
        ...session,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken || session.refreshToken,
        expiresAt: this.calculateExpiryTime(15) // 15 minutes from now
      };

      this.currentSession = newSession;
      this.storeSession(newSession);

      return newSession;
    } catch (error: any) {
      console.error('Token refresh failed:', error);

      if (error.message === 'INVALID_REFRESH_TOKEN') {
        // Clear invalid session
        this.logout();
        throw this.createError('invalid_refresh_token', 'Session expired. Please log in again.');
      }

      throw this.createError('server_error', 'Token refresh failed');
    }
  }

  /**
   * Logout user and revoke tokens
   */
  async logout(): Promise<void> {
    const session = this.getCurrentSession();

    try {
      if (session?.refreshToken) {
        await this.apiClient.post('/api/auth/logout', {
          refreshToken: session.refreshToken
        });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
      // Continue with local logout even if server call fails
    }

    // Clear local session
    this.currentSession = null;
    this.clearStoredSession();
    clearAuthData();
  }

  /**
   * Get current session from memory or storage
   */
  getCurrentSession(): AuthSession | null {
    if (this.currentSession) {
      return this.currentSession;
    }

    const stored = getAuthItem('session');
    if (stored) {
      try {
        this.currentSession = JSON.parse(stored);
        return this.currentSession;
      } catch {
        // Invalid stored session, clear it
        this.clearStoredSession();
      }
    }

    return null;
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
   * Calculate expiry time
   */
  private calculateExpiryTime(minutes: number): string {
    return new Date(Date.now() + minutes * 60 * 1000).toISOString();
  }

  private consumeAuthResult(result: any): AuthResponse {
    const activeOrg = result.orgs.find((org: any) => org.id === result.activeOrgId);
    const now = new Date().toISOString();

    const session: AuthSession = {
      user: {
        ...result.user,
        createdAt: result.user.createdAt || now,
        lastLoginAt: result.user.lastLoginAt || now,
      },
      organization: {
        id: result.activeOrgId,
        name: activeOrg?.name || 'Unknown',
        planTier: 'pro',
        createdAt: now,
      },
      membership: {
        userId: result.user.id,
        orgId: result.activeOrgId,
        role: activeOrg?.role || 'viewer',
        createdAt: now,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: this.calculateExpiryTime(15)
    };

    this.currentSession = session;
    this.storeSession(session);

    return {
      session,
      isFirstLogin: false
    };
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