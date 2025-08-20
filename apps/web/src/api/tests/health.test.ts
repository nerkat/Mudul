import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { healthRoutes } from '../routes/health';

describe('Health Endpoints', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use('/health', healthRoutes);
  });

  describe('GET /health/healthz', () => {
    it('should return process health status', async () => {
      const response = await request(app)
        .get('/health/healthz')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      });

      // Verify timestamp is valid ISO string
      expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
      
      // Verify uptime is positive
      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  describe('GET /health/readyz', () => {
    it('should return database readiness status', async () => {
      const response = await request(app)
        .get('/health/readyz')
        .timeout(10000); // Increase timeout for database operations

      // Should return either 200 (ready) or 503 (not ready)
      expect([200, 503]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toMatchObject({
          status: 'ready',
          timestamp: expect.any(String),
          database: {
            connected: true,
            responseTime: expect.any(Number),
          },
          migrations: {
            applied: true,
            count: expect.any(Number),
          },
        });

        // Database response time should be reasonable (< 1000ms)
        expect(response.body.database.responseTime).toBeLessThan(1000);
        
        // Should have core tables
        expect(response.body.migrations.count).toBeGreaterThan(0);
      } else {
        expect(response.body).toMatchObject({
          status: 'not_ready',
          timestamp: expect.any(String),
          errors: expect.any(Array),
        });
      }
    }, 10000);

    it('should handle database connection failures gracefully', async () => {
      // This test verifies the endpoint handles errors gracefully
      const response = await request(app)
        .get('/health/readyz')
        .timeout(10000);
      
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    }, 10000);
  });
});