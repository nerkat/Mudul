// Real auth service using SQLite directly
import { createRequire } from 'module';
let authService: any;

if (typeof window === 'undefined') {
  const require = createRequire(import.meta.url);
  const { SimpleAuthService } = require('./simple-auth.cjs');
  authService = new SimpleAuthService();
} else {
  throw new Error('PrismaAuthService is server-only; imported in browser bundle');
}

export class PrismaAuthService {
  /**
   * Login with email and password
   */
  static async login(email: string, password: string, rememberMe = false) {
    return await authService.login(email, password, rememberMe);
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken: string) {
    return await authService.refreshToken(refreshToken);
  }

  /**
   * Logout and revoke refresh token
   */
  static async logout(refreshToken: string) {
    return await authService.logout(refreshToken);
  }

  /**
   * Get user info from access token
   */
  static getUserFromToken(token: string) {
    return authService.getUserFromToken(token);
  }

  /**
   * Close SQLite connection
   */
  static async disconnect() {
    await authService.disconnect();
  }
}