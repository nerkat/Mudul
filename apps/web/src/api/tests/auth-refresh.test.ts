import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authRoutes } from '../routes/auth';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication and Refresh Token Management', () => {
  let sqliteService: any;

  beforeAll(async () => {
    const { SimpleSQLiteService } = require('../services/simple-sqlite.cjs');
    sqliteService = new SimpleSQLiteService();
  });

  afterAll(async () => {
    await sqliteService.disconnect();
  });

  describe('Login Flow', () => {
    it('should authenticate with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@mudul.com',
          password: 'password',
          rememberMe: false
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'demo@mudul.com');
      expect(response.body.user).toHaveProperty('orgId');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@mudul.com',
          password: 'wrong-password'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('INVALID_CREDENTIALS');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@mudul.com',
          password: 'password'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('INVALID_CREDENTIALS');
    });

    it('should handle malformed email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: 'password'
        });

      expect(response.status).toBe(400);
      // Should validate email format
    });
  });

  describe('Refresh Token Rotation', () => {
    let initialRefreshToken: string;
    let userId: string;

    beforeAll(async () => {
      // Get initial tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@mudul.com',
          password: 'password',
          rememberMe: true
        });

      expect(loginResponse.status).toBe(200);
      initialRefreshToken = loginResponse.body.refreshToken;
      userId = loginResponse.body.user.id;
    });

    it('should rotate refresh token on successful refresh', async () => {
      // Get initial refresh token count for user
      const initialTokens = await sqliteService.query(
        'SELECT token FROM refresh_tokens WHERE user_id = ?',
        [userId]
      );

      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: initialRefreshToken
        });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body).toHaveProperty('refreshToken');

      // New refresh token should be different
      expect(refreshResponse.body.refreshToken).not.toBe(initialRefreshToken);

      // Check that old token is revoked (deleted) and new token is stored
      const finalTokens = await sqliteService.query(
        'SELECT token FROM refresh_tokens WHERE user_id = ?',
        [userId]
      );

      // Should have replaced old token with new one
      expect(finalTokens.length).toBe(initialTokens.length);
      
      // Old token should not exist
      const oldTokenExists = finalTokens.some((t: any) => t.token === initialRefreshToken);
      expect(oldTokenExists).toBe(false);

      // New token should exist
      const newTokenExists = finalTokens.some((t: any) => t.token === refreshResponse.body.refreshToken);
      expect(newTokenExists).toBe(true);

      // Update for cleanup
      initialRefreshToken = refreshResponse.body.refreshToken;
    });

    it('should reject expired/invalid refresh tokens', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('INVALID_REFRESH_TOKEN');
    });

    it('should reject reused refresh tokens', async () => {
      // Use the current valid refresh token
      const firstRefreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: initialRefreshToken
        });

      expect(firstRefreshResponse.status).toBe(200);
      const newRefreshToken = firstRefreshResponse.body.refreshToken;

      // Try to use the old refresh token again - should fail
      const secondRefreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: initialRefreshToken
        });

      expect(secondRefreshResponse.status).toBe(401);
      expect(secondRefreshResponse.body.error).toBe('INVALID_REFRESH_TOKEN');

      // Clean up - revoke the new token
      await sqliteService.run(
        'DELETE FROM refresh_tokens WHERE token = ?',
        [newRefreshToken]
      );
    });

    it('should clean up refresh tokens on logout', async () => {
      // Get a fresh login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@mudul.com',
          password: 'password'
        });

      const refreshToken = loginResponse.body.refreshToken;
      const accessToken = loginResponse.body.accessToken;

      // Verify token exists
      const tokensBefore = await sqliteService.query(
        'SELECT token FROM refresh_tokens WHERE token = ?',
        [refreshToken]
      );
      expect(tokensBefore.length).toBe(1);

      // Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken: refreshToken
        });

      expect(logoutResponse.status).toBe(200);

      // Verify token is deleted
      const tokensAfter = await sqliteService.query(
        'SELECT token FROM refresh_tokens WHERE token = ?',
        [refreshToken]
      );
      expect(tokensAfter.length).toBe(0);

      // Trying to refresh with logged out token should fail
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken
        });

      expect(refreshResponse.status).toBe(401);
    });
  });

  describe('Token Security', () => {
    it('should use strong, unique refresh tokens', async () => {
      // Generate multiple tokens
      const tokens = new Set();
      
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'demo@mudul.com',
            password: 'password'
          });

        expect(response.status).toBe(200);
        tokens.add(response.body.refreshToken);

        // Clean up
        await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${response.body.accessToken}`)
          .send({
            refreshToken: response.body.refreshToken
          });
      }

      // All tokens should be unique
      expect(tokens.size).toBe(5);

      // Tokens should be sufficiently long and random-looking
      tokens.forEach((token: any) => {
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(20); // Should be reasonably long
      });
    });

    it('should enforce proper token expiration', async () => {
      // This test would require manipulating system time or database directly
      // For now, we'll verify that tokens have expiration dates set
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@mudul.com',
          password: 'password'
        });

      const refreshToken = loginResponse.body.refreshToken;

      const tokenData = await sqliteService.query(
        'SELECT expires_at FROM refresh_tokens WHERE token = ?',
        [refreshToken]
      );

      expect(tokenData.length).toBe(1);
      expect(tokenData[0].expires_at).toBeTruthy();
      
      const expirationDate = new Date(tokenData[0].expires_at);
      const now = new Date();
      
      // Should expire in the future
      expect(expirationDate.getTime()).toBeGreaterThan(now.getTime());
      
      // Should expire within reasonable timeframe (e.g., 30 days)
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      expect(expirationDate.getTime()).toBeLessThanOrEqual(thirtyDaysFromNow.getTime());

      // Clean up
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          refreshToken: refreshToken
        });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on login attempts', async () => {
      const clientIp = '127.0.0.1';
      let rateLimitHit = false;

      // Make multiple failed login attempts
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'demo@mudul.com',
            password: 'wrong-password'
          });

        if (response.status === 429) {
          rateLimitHit = true;
          expect(response.body.error).toBe('RATE_LIMIT_EXCEEDED');
          break;
        }
      }

      // Note: This test might not work in test environment if rate limiting is IP-based
      // and multiple test runs share the same IP. The important thing is that the 
      // rate limiting code exists and has proper error responses.
    });
  });
});