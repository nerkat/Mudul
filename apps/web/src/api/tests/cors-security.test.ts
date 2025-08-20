import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { corsMiddleware, corsErrorHandler, requestIdMiddleware } from '../middleware/security';

describe('CORS Security', () => {
  let app: express.Application;

  beforeAll(() => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.CORS_ALLOWED_ORIGINS = 'https://app.example.com,https://api.example.com';
    
    app = express();
    app.use(express.json());
    app.use(requestIdMiddleware);
    app.use(corsMiddleware);
    app.use(corsErrorHandler);
    
    app.get('/api/test', (req, res) => {
      res.json({ message: 'success' });
    });
    
    app.post('/api/test', (req, res) => {
      res.json({ message: 'created' });
    });
  });

  afterAll(() => {
    delete process.env.CORS_ALLOWED_ORIGINS;
  });

  describe('Allowed Origins', () => {
    it('should allow requests from configured origins', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'https://app.example.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://app.example.com');
    });

    it('should allow requests with no origin in test environment', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body).toEqual({ message: 'success' });
    });

    it('should allow localhost in test environment', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'http://localhost')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost');
    });
  });

  describe('Blocked Origins', () => {
    it('should return 403 JSON for blocked origins', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'https://malicious.example.com')
        .expect(403);

      expect(response.body).toEqual({
        code: 'CORS_BLOCKED',
        message: 'Origin not allowed by CORS policy',
        traceId: expect.any(String)
      });

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should reject requests with unknown origins', async () => {
      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'https://evil.com')
        .expect(403);

      expect(response.body.code).toBe('CORS_BLOCKED');
    });
  });

  describe('Wildcard Protection', () => {
    it('should reject wildcard origins in production mode', async () => {
      // Temporarily set production mode
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      process.env.CORS_ALLOWED_ORIGINS = '*,https://app.example.com';

      const prodApp = express();
      prodApp.use(requestIdMiddleware);
      prodApp.use(corsMiddleware);
      prodApp.use(corsErrorHandler);
      prodApp.get('/test', (req, res) => res.json({ ok: true }));

      const response = await request(prodApp)
        .get('/test')
        .set('Origin', 'https://anything.com')
        .expect(403);

      expect(response.body.message).toContain('Wildcard origin');

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('CORS Headers', () => {
    it('should include proper CORS headers', async () => {
      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'https://app.example.com')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

      expect(response.headers['access-control-allow-origin']).toBe('https://app.example.com');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-headers']).toContain('Authorization');
      expect(response.headers['access-control-allow-headers']).toContain('Idempotency-Key');
    });

    it('should handle preflight requests correctly', async () => {
      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'https://app.example.com')
        .set('Access-Control-Request-Method', 'POST')
        .expect(200);

      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });
  });

  describe('Development vs Production', () => {
    it('should be more permissive in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const devApp = express();
      devApp.use(requestIdMiddleware);
      devApp.use(corsMiddleware);
      devApp.use(corsErrorHandler);
      devApp.get('/test', (req, res) => res.json({ ok: true }));

      // Should allow localhost variants in development
      await request(devApp)
        .get('/test')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      await request(devApp)
        .get('/test')
        .set('Origin', 'http://127.0.0.1:5173')
        .expect(200);

      process.env.NODE_ENV = originalEnv;
    });
  });
});