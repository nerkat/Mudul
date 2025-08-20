import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { loggingMiddleware, requestIdMiddleware } from '../middleware/security';

describe('Logging Redaction', () => {
  let app: express.Application;
  let consoleLogs: any[] = [];
  let consoleErrors: any[] = [];
  
  // Mock console.log and console.error to capture logs
  const originalLog = console.log;
  const originalError = console.error;

  beforeAll(() => {
    console.log = vi.fn((...args) => {
      consoleLogs.push(args);
    });
    
    console.error = vi.fn((...args) => {
      consoleErrors.push(args);
    });

    app = express();
    app.use(express.json());
    app.use(requestIdMiddleware);
    app.use(loggingMiddleware);
    
    // Mock authentication middleware
    app.use((req, res, next) => {
      (req as any).user = { 
        orgId: 'org-logging-test', 
        userId: 'user-logging-test' 
      };
      next();
    });

    // Test routes
    app.get('/api/test/fast', (req, res) => {
      res.json({ message: 'fast response' });
    });

    app.post('/api/test/slow', (req, res) => {
      // Simulate slow response
      setTimeout(() => {
        res.status(201).json({ 
          id: 'created-resource',
          sensitiveData: req.body.notes || 'default notes'
        });
      }, 1100); // Just over 1 second to trigger slow request logging
    });

    app.post('/api/test/error', (req, res) => {
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong'
      });
    });

    app.post('/api/test/validation-error', (req, res) => {
      res.status(422).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid data',
        details: { field: 'notes', issue: 'Contains PII data that should be redacted' }
      });
    });

    app.get('/api/test/anonymous', (req, res) => {
      // Remove user context to test anonymous logging
      delete (req as any).user;
      res.json({ message: 'anonymous response' });
    });
  });

  afterEach(() => {
    // Clear captured logs after each test
    consoleLogs = [];
    consoleErrors = [];
  });

  describe('Basic Logging Structure', () => {
    it('should log successful requests with correct structure', async () => {
      await request(app)
        .get('/api/test/fast')
        .set('User-Agent', 'test-agent/1.0')
        .expect(200);

      expect(consoleLogs).toHaveLength(1);
      const logEntry = consoleLogs[0];
      
      expect(logEntry[0]).toBe('API Request:');
      expect(logEntry[1]).toEqual({
        requestId: expect.any(String),
        orgId: 'org-logging-test',
        method: 'GET',
        route: '/api/test/fast',
        status: 200,
        latency: expect.stringMatching(/^\d+ms$/),
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        userAgent: 'test-agent/1.0'
      });
    });

    it('should log anonymous requests correctly', async () => {
      await request(app)
        .get('/api/test/anonymous')
        .expect(200);

      expect(consoleLogs).toHaveLength(1);
      const logEntry = consoleLogs[0];
      
      expect(logEntry[1].orgId).toBe('anonymous');
    });

    it('should truncate long user agent strings', async () => {
      const longUserAgent = 'a'.repeat(150); // 150 characters
      
      await request(app)
        .get('/api/test/fast')
        .set('User-Agent', longUserAgent)
        .expect(200);

      expect(consoleLogs).toHaveLength(1);
      const logEntry = consoleLogs[0];
      
      expect(logEntry[1].userAgent).toHaveLength(100);
      expect(logEntry[1].userAgent).toBe('a'.repeat(100));
    });
  });

  describe('PII and Sensitive Data Redaction', () => {
    it('should not log request body content', async () => {
      const sensitiveData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        notes: 'Contains confidential information about the client',
        ssn: '123-45-6789',
        creditCard: '4111-1111-1111-1111'
      };

      await request(app)
        .post('/api/test/validation-error')
        .send(sensitiveData)
        .expect(422);

      // Check that sensitive data is not in any of the logs
      const allLogContent = JSON.stringify([...consoleLogs, ...consoleErrors]);
      
      expect(allLogContent).not.toContain('john.doe@example.com');
      expect(allLogContent).not.toContain('confidential information');
      expect(allLogContent).not.toContain('123-45-6789');
      expect(allLogContent).not.toContain('4111-1111-1111-1111');
      expect(allLogContent).not.toContain('John Doe');
    });

    it('should not log response body content', async () => {
      await request(app)
        .get('/api/test/fast')
        .expect(200);

      const allLogContent = JSON.stringify(consoleLogs);
      expect(allLogContent).not.toContain('fast response');
    });

    it('should not include user ID in logs', async () => {
      await request(app)
        .get('/api/test/fast')
        .expect(200);

      const allLogContent = JSON.stringify(consoleLogs);
      expect(allLogContent).not.toContain('user-logging-test');
    });

    it('should not include authentication tokens or headers', async () => {
      await request(app)
        .get('/api/test/fast')
        .set('Authorization', 'Bearer secret-token-12345')
        .set('X-API-Key', 'api-key-secret')
        .expect(200);

      const allLogContent = JSON.stringify(consoleLogs);
      expect(allLogContent).not.toContain('secret-token-12345');
      expect(allLogContent).not.toContain('api-key-secret');
      expect(allLogContent).not.toContain('Bearer');
    });
  });

  describe('Error and Slow Request Logging', () => {
    it('should use console.error for error responses', async () => {
      await request(app)
        .post('/api/test/error')
        .send({ test: 'data' })
        .expect(500);

      expect(consoleErrors).toHaveLength(1);
      expect(consoleLogs).toHaveLength(0);
      
      const errorLogEntry = consoleErrors[0];
      expect(errorLogEntry[0]).toBe('API Request:');
      expect(errorLogEntry[1].status).toBe(500);
      expect(errorLogEntry[1].method).toBe('POST');
    });

    it('should use console.error for validation errors', async () => {
      await request(app)
        .post('/api/test/validation-error')
        .send({ invalid: 'data' })
        .expect(422);

      expect(consoleErrors).toHaveLength(1);
      expect(consoleLogs).toHaveLength(0);
      
      const errorLogEntry = consoleErrors[0];
      expect(errorLogEntry[1].status).toBe(422);
    });

    it('should use console.error for slow requests', async () => {
      await request(app)
        .post('/api/test/slow')
        .send({ notes: 'This will be slow' })
        .expect(201);

      expect(consoleErrors).toHaveLength(1);
      expect(consoleLogs).toHaveLength(0);
      
      const slowLogEntry = consoleErrors[0];
      expect(slowLogEntry[1].status).toBe(201);
      expect(parseInt(slowLogEntry[1].latency)).toBeGreaterThan(1000);
    }, 10000); // Increase timeout for slow test
  });

  describe('Request ID Consistency', () => {
    it('should use consistent request ID throughout request lifecycle', async () => {
      const response = await request(app)
        .get('/api/test/fast')
        .expect(200);

      const requestId = response.headers['x-request-id'];
      expect(requestId).toBeDefined();
      
      expect(consoleLogs).toHaveLength(1);
      const logEntry = consoleLogs[0];
      expect(logEntry[1].requestId).toBe(requestId);
    });

    it('should accept and use client-provided request ID', async () => {
      const clientRequestId = 'client-provided-id-12345';
      
      const response = await request(app)
        .get('/api/test/fast')
        .set('X-Request-ID', clientRequestId)
        .expect(200);

      expect(response.headers['x-request-id']).toBe(clientRequestId);
      
      expect(consoleLogs).toHaveLength(1);
      const logEntry = consoleLogs[0];
      expect(logEntry[1].requestId).toBe(clientRequestId);
    });
  });

  describe('Performance and Latency Tracking', () => {
    it('should measure and log request latency', async () => {
      await request(app)
        .get('/api/test/fast')
        .expect(200);

      expect(consoleLogs).toHaveLength(1);
      const logEntry = consoleLogs[0];
      
      const latencyStr = logEntry[1].latency;
      expect(latencyStr).toMatch(/^\d+ms$/);
      
      const latencyMs = parseInt(latencyStr);
      expect(latencyMs).toBeGreaterThan(0);
      expect(latencyMs).toBeLessThan(1000); // Should be fast
    });

    it('should accurately measure slow request latency', async () => {
      await request(app)
        .post('/api/test/slow')
        .send({ test: 'data' })
        .expect(201);

      expect(consoleErrors).toHaveLength(1);
      const logEntry = consoleErrors[0];
      
      const latencyStr = logEntry[1].latency;
      const latencyMs = parseInt(latencyStr);
      expect(latencyMs).toBeGreaterThan(1000); // Should be over 1 second
    }, 10000);
  });

  describe('Compliance and Audit Requirements', () => {
    it('should include all required audit fields', async () => {
      await request(app)
        .post('/api/test/validation-error')
        .send({ test: 'data' })
        .expect(422);

      expect(consoleErrors).toHaveLength(1);
      const logEntry = consoleErrors[0];
      const auditData = logEntry[1];
      
      // Verify all required audit fields are present
      const requiredFields = [
        'requestId', 'orgId', 'method', 'route', 'status', 
        'latency', 'timestamp', 'userAgent'
      ];
      
      requiredFields.forEach(field => {
        expect(auditData).toHaveProperty(field);
        expect(auditData[field]).toBeDefined();
      });
    });

    it('should not include any forbidden fields', async () => {
      await request(app)
        .post('/api/test/error')
        .set('Authorization', 'Bearer secret-token')
        .send({ 
          password: 'secret123',
          notes: 'Confidential client information'
        })
        .expect(500);

      expect(consoleErrors).toHaveLength(1);
      const logEntry = consoleErrors[0];
      const auditData = logEntry[1];
      
      // Verify forbidden fields are not present
      const forbiddenFields = [
        'password', 'token', 'authorization', 'body', 'response',
        'userId', 'notes', 'email', 'phone', 'address'
      ];
      
      const auditDataStr = JSON.stringify(auditData).toLowerCase();
      forbiddenFields.forEach(field => {
        expect(auditDataStr).not.toContain(field);
      });
    });

    it('should maintain log format consistency across different request types', async () => {
      const requests = [
        { method: 'get', path: '/api/test/fast', expectedStatus: 200 },
        { method: 'post', path: '/api/test/error', expectedStatus: 500 },
        { method: 'post', path: '/api/test/validation-error', expectedStatus: 422 }
      ];

      for (const req of requests) {
        consoleLogs = [];
        consoleErrors = [];
        
        await request(app)[req.method](req.path)
          .send({ test: 'data' })
          .expect(req.expectedStatus);

        const logs = req.expectedStatus >= 400 ? consoleErrors : consoleLogs;
        expect(logs).toHaveLength(1);
        
        const logEntry = logs[0];
        expect(logEntry[0]).toBe('API Request:');
        expect(typeof logEntry[1]).toBe('object');
        expect(logEntry[1].status).toBe(req.expectedStatus);
      }
    });
  });
});