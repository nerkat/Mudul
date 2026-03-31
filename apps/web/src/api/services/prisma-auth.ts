// Real auth service using SQLite directly
// Note: Vite bundles its config as ESM; using Node's `createRequire` ensures
// the native sqlite3 dependency is loaded via real CJS `require` (not a shim).
import { createRequire } from 'node:module';
import { MockAuthService } from './auth';

export class PrismaAuthService {
  private static service: any = null;
  private static warned = false;

  private static getService() {
    if (!this.service) {
      try {
        const require = createRequire(import.meta.url);
        const { SimpleAuthService } = require('./simple-auth.cjs') as { SimpleAuthService: any };
        this.service = new SimpleAuthService();
      } catch (error) {
        if (process.env.NODE_ENV === 'production') {
          throw error;
        }

        if (!this.warned) {
          console.warn('[PrismaAuthService] SQLite auth unavailable; falling back to MockAuthService in non-production.');
          this.warned = true;
        }

        this.service = MockAuthService;
      }
    }
    return this.service;
  }

  /**
   * Login with a Google credential token
   */
  static async loginWithGoogle(credential: string, rememberMe = true) {
    return await this.getService().loginWithGoogle(credential, rememberMe);
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken: string) {
    return await this.getService().refreshToken(refreshToken);
  }

  /**
   * Logout and revoke refresh token
   */
  static async logout(refreshToken: string) {
    return await this.getService().logout(refreshToken);
  }

  /**
   * Get user info from access token
   */
  static getUserFromToken(token: string) {
    return this.getService().getUserFromToken(token);
  }

  static async ensureOrgHasSeedData(userId: string, orgId: string) {
    const service = this.getService();
    if (typeof service.ensureOrgHasSeedData === 'function') {
      await service.ensureOrgHasSeedData(orgId, userId);
    }
  }

  /**
   * Login as the built-in demo user (development/showcase only)
   */
  static async loginAsDemoUser() {
    return await this.getService().loginAsDemoUser();
  }

  /**
   * Close SQLite connection
   */
  static async disconnect() {
    if (!this.service) return;
    if (typeof this.service.disconnect === 'function') {
      await this.service.disconnect();
    }
    this.service = null;
  }
}