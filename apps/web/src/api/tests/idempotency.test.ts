import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { idempotencyMiddleware, requestIdMiddleware } from '../middleware/security';

describe('Idempotency', () => {
  let app: express.Application;
  let createdIds: string[] = [];

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(requestIdMiddleware);
    app.use(idempotencyMiddleware);
    
    // Mock user middleware
    app.use((req, res, next) => {
      (req as any).user = { orgId: 'test-org-123', userId: 'user-456' };
      next();
    });
    
    // Test route that creates resources
    app.post('/api/clients', (req, res) => {
      const id = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      createdIds.push(id);
      
      const client = {
        id,
        name: req.body.name,
        notes: req.body.notes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      res.status(201).json(client);
    });
    
    // Test route for calls
    app.post('/api/clients/:id/calls', (req, res) => {
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      createdIds.push(callId);
      
      const call = {
        id: callId,
        clientId: req.params.id,
        ts: req.body.ts,
        durationSec: req.body.durationSec,
        sentiment: req.body.sentiment,
        score: req.body.score,
        bookingLikelihood: req.body.bookingLikelihood,
        notes: req.body.notes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      res.status(201).json(call);
    });
  });

  beforeEach(() => {
    createdIds = [];
  });

  describe('Basic Idempotency', () => {
    it('should process first request normally and return 201', async () => {
      const idempotencyKey = 'test-key-1';
      const clientData = { name: 'Test Client', notes: 'Test notes' };

      const response = await request(app)
        .post('/api/clients')
        .set('Idempotency-Key', idempotencyKey)
        .send(clientData)
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        name: 'Test Client',
        notes: 'Test notes',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      expect(createdIds).toHaveLength(1);
    });

    it('should return cached response on duplicate request with 200 status', async () => {
      const idempotencyKey = 'test-key-duplicate';
      const clientData = { name: 'Duplicate Client', notes: 'Will be cached' };

      // First request
      const firstResponse = await request(app)
        .post('/api/clients')
        .set('Idempotency-Key', idempotencyKey)
        .send(clientData)
        .expect(201);

      expect(createdIds).toHaveLength(1);
      const firstId = firstResponse.body.id;

      // Second request with same idempotency key
      const secondResponse = await request(app)
        .post('/api/clients')
        .set('Idempotency-Key', idempotencyKey)
        .send(clientData)
        .expect(200); // Should return 200 for cached response

      expect(secondResponse.body).toEqual(firstResponse.body);
      expect(secondResponse.body.id).toBe(firstId);
      expect(createdIds).toHaveLength(1); // No new resource created
    });
  });

  describe('Key Composition', () => {
    it('should treat same key with different body as different requests', async () => {
      const idempotencyKey = 'test-key-body-diff';

      // First request
      const firstResponse = await request(app)
        .post('/api/clients')
        .set('Idempotency-Key', idempotencyKey)
        .send({ name: 'Client A', notes: 'First client' })
        .expect(201);

      // Second request with same key but different body
      const secondResponse = await request(app)
        .post('/api/clients')
        .set('Idempotency-Key', idempotencyKey)
        .send({ name: 'Client B', notes: 'Different client' })
        .expect(201);

      expect(firstResponse.body.id).not.toBe(secondResponse.body.id);
      expect(firstResponse.body.name).toBe('Client A');
      expect(secondResponse.body.name).toBe('Client B');
      expect(createdIds).toHaveLength(2);
    });

    it('should treat same key on different routes as different requests', async () => {
      const idempotencyKey = 'test-key-route-diff';
      const clientId = 'client-123';

      // Create client
      const clientResponse = await request(app)
        .post('/api/clients')
        .set('Idempotency-Key', idempotencyKey)
        .send({ name: 'Test Client' })
        .expect(201);

      // Create call with same idempotency key
      const callResponse = await request(app)
        .post(`/api/clients/${clientId}/calls`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          ts: '2024-01-15T10:00:00Z',
          durationSec: 1800,
          sentiment: 'pos',
          score: 0.8,
          bookingLikelihood: 0.7
        })
        .expect(201);

      expect(clientResponse.body.id).not.toBe(callResponse.body.id);
      expect(createdIds).toHaveLength(2);
    });
  });

  describe('Org Isolation', () => {
    it('should isolate idempotency keys by org', async () => {
      const idempotencyKey = 'shared-key-different-orgs';
      const clientData = { name: 'Shared Name' };

      // Override user for first request
      const app1 = express();
      app1.use(express.json());
      app1.use(requestIdMiddleware);
      app1.use(idempotencyMiddleware);
      app1.use((req, res, next) => {
        (req as any).user = { orgId: 'org-1', userId: 'user-1' };
        next();
      });
      app1.post('/api/clients', (req, res) => {
        res.status(201).json({
          id: 'client-org1',
          name: req.body.name,
          orgId: 'org-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      const app2 = express();
      app2.use(express.json());
      app2.use(requestIdMiddleware);
      app2.use(idempotencyMiddleware);
      app2.use((req, res, next) => {
        (req as any).user = { orgId: 'org-2', userId: 'user-2' };
        next();
      });
      app2.post('/api/clients', (req, res) => {
        res.status(201).json({
          id: 'client-org2',
          name: req.body.name,
          orgId: 'org-2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      // Same idempotency key, different orgs
      const response1 = await request(app1)
        .post('/api/clients')
        .set('Idempotency-Key', idempotencyKey)
        .send(clientData)
        .expect(201);

      const response2 = await request(app2)
        .post('/api/clients')
        .set('Idempotency-Key', idempotencyKey)
        .send(clientData)
        .expect(201);

      expect(response1.body.id).not.toBe(response2.body.id);
      expect(response1.body.orgId).toBe('org-1');
      expect(response2.body.orgId).toBe('org-2');
    });
  });

  describe('Error Conditions', () => {
    it('should not cache error responses', async () => {
      const errorApp = express();
      errorApp.use(express.json());
      errorApp.use(requestIdMiddleware);
      errorApp.use(idempotencyMiddleware);
      errorApp.use((req, res, next) => {
        (req as any).user = { orgId: 'test-org', userId: 'test-user' };
        next();
      });
      
      let callCount = 0;
      errorApp.post('/api/error-test', (req, res) => {
        callCount++;
        if (callCount === 1) {
          res.status(500).json({ error: 'Server error' });
        } else {
          res.status(201).json({ id: 'success', callCount });
        }
      });

      const idempotencyKey = 'error-test-key';

      // First request fails
      await request(errorApp)
        .post('/api/error-test')
        .set('Idempotency-Key', idempotencyKey)
        .send({ test: 'data' })
        .expect(500);

      // Second request should succeed (not cached because first was error)
      const successResponse = await request(errorApp)
        .post('/api/error-test')
        .set('Idempotency-Key', idempotencyKey)
        .send({ test: 'data' })
        .expect(201);

      expect(successResponse.body.callCount).toBe(2);
    });

    it('should skip idempotency for requests without user context', async () => {
      const noAuthApp = express();
      noAuthApp.use(express.json());
      noAuthApp.use(requestIdMiddleware);
      noAuthApp.use(idempotencyMiddleware);
      // No user middleware
      
      let callCount = 0;
      noAuthApp.post('/api/no-auth', (req, res) => {
        callCount++;
        res.status(201).json({ id: `call-${callCount}` });
      });

      const idempotencyKey = 'no-auth-key';

      // Both requests should succeed and create different resources
      const response1 = await request(noAuthApp)
        .post('/api/no-auth')
        .set('Idempotency-Key', idempotencyKey)
        .send({ test: 'data' })
        .expect(201);

      const response2 = await request(noAuthApp)
        .post('/api/no-auth')
        .set('Idempotency-Key', idempotencyKey)
        .send({ test: 'data' })
        .expect(201);

      expect(response1.body.id).not.toBe(response2.body.id);
      expect(callCount).toBe(2);
    });
  });

  describe('Method Filtering', () => {
    it('should only apply to POST, PUT, PATCH methods', async () => {
      let getCallCount = 0;
      const methodApp = express();
      methodApp.use(express.json());
      methodApp.use(requestIdMiddleware);
      methodApp.use(idempotencyMiddleware);
      methodApp.use((req, res, next) => {
        (req as any).user = { orgId: 'test-org', userId: 'test-user' };
        next();
      });
      
      methodApp.get('/api/method-test', (req, res) => {
        getCallCount++;
        res.json({ getCallCount });
      });

      const idempotencyKey = 'method-test-key';

      // GET requests should not be affected by idempotency
      const response1 = await request(methodApp)
        .get('/api/method-test')
        .set('Idempotency-Key', idempotencyKey)
        .expect(200);

      const response2 = await request(methodApp)
        .get('/api/method-test')
        .set('Idempotency-Key', idempotencyKey)
        .expect(200);

      expect(response1.body.getCallCount).toBe(1);
      expect(response2.body.getCallCount).toBe(2);
    });
  });
});