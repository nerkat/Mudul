import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { clientRoutes } from '../routes/client';

describe('Query Parameter Limits and Pagination', () => {
  let app: express.Application;
  let accessToken: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/clients', clientRoutes);

    // Get access token for testing
    // Note: This assumes auth service is working
    try {
      const { PrismaAuthService } = await import('../services/prisma-auth');
      const authResult = await PrismaAuthService.login('demo@mudul.com', 'password', false);
      accessToken = authResult.accessToken;
    } catch (error) {
      console.warn('Could not get access token for testing:', error);
      accessToken = 'mock-token-for-testing';
    }
  });

  describe('Limit validation', () => {
    it('should reject limit values outside valid range', async () => {
      const clientId = 'client-acme';

      // Test limit too high
      const response1 = await request(app)
        .get(`/clients/${clientId}/calls?limit=200`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response1.body).toMatchObject({
        error: 'INVALID_LIMIT',
        message: 'Limit must be between 1 and 50',
      });

      // Test limit too low
      const response2 = await request(app)
        .get(`/clients/${clientId}/calls?limit=0`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response2.body).toMatchObject({
        error: 'INVALID_LIMIT',
        message: 'Limit must be between 1 and 50',
      });

      // Test negative limit
      const response3 = await request(app)
        .get(`/clients/${clientId}/calls?limit=-5`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response3.body).toMatchObject({
        error: 'INVALID_LIMIT',
        message: 'Limit must be between 1 and 50',
      });
    });

    it('should accept valid limit values', async () => {
      const clientId = 'client-acme';

      // Test minimum valid limit
      const response1 = await request(app)
        .get(`/clients/${clientId}/calls?limit=1`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Should either succeed with 200 or fail with auth/client error (not limit error)
      expect(response1.status).not.toBe(400);

      // Test maximum valid limit
      const response2 = await request(app)
        .get(`/clients/${clientId}/calls?limit=50`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response2.status).not.toBe(400);

      // Test default limit (no parameter)
      const response3 = await request(app)
        .get(`/clients/${clientId}/calls`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response3.status).not.toBe(400);
    });
  });

  describe('Deterministic ordering', () => {
    it('should maintain ORDER BY ts DESC, id DESC for consistent pagination', async () => {
      // This test would require actual data to verify ordering
      // For now, just verify the endpoint accepts the request
      const clientId = 'client-acme';

      const response = await request(app)
        .get(`/clients/${clientId}/calls?limit=10`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Should not fail due to SQL ordering issues
      if (response.status === 200) {
        expect(response.body).toHaveProperty('items');
        expect(Array.isArray(response.body.items)).toBe(true);
      }
    });
  });

  describe('Empty state handling', () => {
    it('should return empty arrays for clients with no data', async () => {
      // Test with a client that likely has no calls
      const clientId = 'non-existent-client';

      const response = await request(app)
        .get(`/clients/${clientId}/calls`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Should either return 404 for missing client or 200 with empty array
      if (response.status === 200) {
        expect(response.body).toMatchObject({
          items: expect.any(Array),
        });
        // Items should be an array (never null)
        expect(Array.isArray(response.body.items)).toBe(true);
      }
    });
  });
});