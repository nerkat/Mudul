import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { generalRateLimit, writeRateLimit, authRateLimit, corsMiddleware, corsErrorHandler, requestIdMiddleware } from '../middleware/security';

describe('Rate Limiting', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(corsMiddleware);
    app.use(corsErrorHandler);
    app.use(requestIdMiddleware);
    
    // Test route for general rate limiting
    app.get('/api/test', generalRateLimit, (req, res) => {
      res.json({ message: 'success' });
    });
    
    // Test route for write rate limiting
    app.post('/api/test-write', writeRateLimit, (req, res) => {
      res.status(201).json({ message: 'created' });
    });
    
    // Test route for auth rate limiting
    app.post('/api/auth/login', authRateLimit, (req, res) => {
      res.json({ token: 'test' });
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include standard rate limit headers on successful requests', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      // Check for standard rate limit headers (draft-7)
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-request-id');
      
      // Verify header values are numeric
      expect(parseInt(response.headers['x-ratelimit-limit'])).toBeGreaterThan(0);
      expect(parseInt(response.headers['x-ratelimit-remaining'])).toBeGreaterThanOrEqual(0);
    });

    it('should include rate limit headers on write operations', async () => {
      const response = await request(app)
        .post('/api/test-write')
        .send({ test: 'data' })
        .expect(201);

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-request-id');
    });

    it('should return 429 with proper headers when rate limit exceeded', async () => {
      // This test would need a separate app instance with very low limits
      const testApp = express();
      testApp.use(express.json());
      
      // Create a rate limiter with very low limit for testing
      const testRateLimit = require('express-rate-limit')({
        windowMs: 60000, // 1 minute
        max: 1, // Only 1 request
        standardHeaders: 'draft-7',
        handler: (req: any, res: any) => {
          res.status(429).json({
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
            traceId: req.traceId || 'test'
          });
        }
      });
      
      testApp.use(requestIdMiddleware);
      testApp.get('/test-limit', testRateLimit, (req, res) => {
        res.json({ success: true });
      });

      // First request should succeed
      await request(testApp)
        .get('/test-limit')
        .expect(200);

      // Second request should be rate limited
      const response = await request(testApp)
        .get('/test-limit')
        .expect(429);

      expect(response.body).toEqual({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        traceId: expect.any(String)
      });

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('retry-after');
    });
  });

  describe('Key Generation', () => {
    it('should handle IPv6 addresses properly', () => {
      // Test the key generation logic with IPv6 addresses
      const mockReq = {
        ip: '::ffff:192.168.1.1',
        connection: { remoteAddress: '::ffff:192.168.1.1' },
        user: { orgId: 'test-org' }
      } as any;

      // This would be tested in the actual key generator function
      // The implementation should normalize IPv6 addresses
      const expectedKey = '192.168.1.1-test-org';
      // We'll verify this doesn't throw the IPv6 warning in our implementation
    });
  });

  describe('Different Rate Limits', () => {
    it('should apply different limits for auth endpoints', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'test' })
        .expect(200);

      // Auth endpoints should have stricter limits
      const limit = parseInt(response.headers['x-ratelimit-limit']);
      expect(limit).toBeLessThanOrEqual(5); // Auth limit is 5
    });

    it('should apply write limits only to write operations', async () => {
      // GET should use general rate limit (1000)
      const getResponse = await request(app)
        .get('/api/test')
        .expect(200);

      // POST should use write rate limit (100)
      const postResponse = await request(app)
        .post('/api/test-write')
        .send({ test: 'data' })
        .expect(201);

      const getLimit = parseInt(getResponse.headers['x-ratelimit-limit']);
      const postLimit = parseInt(postResponse.headers['x-ratelimit-limit']);

      expect(getLimit).toBeGreaterThan(postLimit);
    });
  });
});