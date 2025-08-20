// Real auth service using SQLite directly
let SimpleAuthService: any;
let authService: any;

// Lazy initialization to avoid SQLite loading during config phase
function getAuthService() {
  if (!authService) {
    const { SimpleAuthService: AuthClass } = require('./simple-auth.cjs');
    authService = new AuthClass();
  }
  return authService;
}

export class PrismaAuthService {
  /**
   * Login with email and password
   */
  static async login(email: string, password: string, rememberMe = false) {
    return await getAuthService().login(email, password, rememberMe);
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken: string) {
    return await getAuthService().refreshToken(refreshToken);
  }

  /**
   * Logout and revoke refresh token
   */
  static async logout(refreshToken: string) {
    return await getAuthService().logout(refreshToken);
  }

  /**
   * Get user info from access token
   */
  static getUserFromToken(token: string) {
    return getAuthService().getUserFromToken(token);
  }

  /**
   * Close SQLite connection
   */
  static async disconnect() {
    if (authService) {
      await authService.disconnect();
    }
  }
}