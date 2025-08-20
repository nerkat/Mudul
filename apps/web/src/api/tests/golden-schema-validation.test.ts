import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { 
  CreatedClientOutSchema,
  CreatedCallOutSchema,
  CreatedActionItemOutSchema,
  ErrorResponseSchema
} from '../schemas/output';
import { requestIdMiddleware, idempotencyMiddleware } from '../middleware/security';

describe('Golden Schema Validation Tests', () => {
  let app: express.Application;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(requestIdMiddleware);
    app.use(idempotencyMiddleware);
    
    // Mock authentication middleware
    app.use((req, res, next) => {
      (req as any).user = { 
        orgId: 'org-golden-test', 
        userId: 'user-golden-test' 
      };
      next();
    });
    
    // Mock routes that return properly formatted data
    app.post('/api/org/clients', (req, res) => {
      const client = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: req.body.name,
        notes: req.body.notes || null,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z'
      };
      
      res.setHeader('Location', `/api/clients/${client.id}`);
      res.status(201).json(client);
    });
    
    app.post('/api/clients/:id/calls', (req, res) => {
      const call = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        clientId: req.params.id,
        ts: req.body.ts,
        durationSec: req.body.durationSec,
        sentiment: req.body.sentiment,
        score: req.body.score,
        bookingLikelihood: req.body.bookingLikelihood,
        notes: req.body.notes || null,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z'
      };
      
      res.setHeader('Location', `/api/clients/${req.params.id}/calls/${call.id}`);
      res.status(201).json(call);
    });
    
    app.post('/api/clients/:id/action-items', (req, res) => {
      const actionItem = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        clientId: req.params.id,
        owner: req.body.owner || null,
        text: req.body.text,
        due: req.body.dueDate || null,
        status: 'open' as const,
        createdAt: '2024-01-15T11:00:00.000Z',
        updatedAt: '2024-01-15T11:00:00.000Z'
      };
      
      res.setHeader('Location', `/api/clients/${req.params.id}/action-items/${actionItem.id}`);
      res.status(201).json(actionItem);
    });
    
    // Error test routes
    app.post('/api/test/validation-error', (req, res) => {
      res.status(422).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: {
          field: 'name',
          issue: 'too_small',
          minimum: 2
        },
        traceId: 'trace-validation-error'
      });
    });
    
    app.post('/api/test/server-error', (req, res) => {
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong on the server',
        traceId: 'trace-server-error'
      });
    });
  });

  describe('Client Creation Schema Stability', () => {
    it('should validate complete client creation response against schema', async () => {
      const clientData = {
        name: 'Golden Test Client',
        notes: 'This is a test client for golden schema validation'
      };

      const response = await request(app)
        .post('/api/org/clients')
        .send(clientData)
        .expect(201);

      // Validate response against output schema
      const validationResult = CreatedClientOutSchema.safeParse(response.body);
      
      expect(validationResult.success).toBe(true);
      
      if (validationResult.success) {
        expect(validationResult.data).toEqual({
          id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
          name: 'Golden Test Client',
          notes: 'This is a test client for golden schema validation',
          createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        });
      }

      // Validate required response headers
      expect(response.headers.location).toMatch(/^\/api\/clients\/[0-9a-f-]+$/);
      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should validate client creation with minimal data', async () => {
      const clientData = {
        name: 'Minimal Client'
        // notes omitted (optional)
      };

      const response = await request(app)
        .post('/api/org/clients')
        .send(clientData)
        .expect(201);

      const validationResult = CreatedClientOutSchema.safeParse(response.body);
      
      expect(validationResult.success).toBe(true);
      
      if (validationResult.success) {
        expect(validationResult.data.notes).toBeNull();
        expect(validationResult.data.name).toBe('Minimal Client');
      }
    });
  });

  describe('Call Creation Schema Stability', () => {
    it('should validate complete call creation response against schema', async () => {
      const callData = {
        ts: '2024-01-15T10:00:00.000Z',
        durationSec: 1800,
        sentiment: 'pos' as const,
        score: 0.8,
        bookingLikelihood: 0.75,
        notes: 'Very productive call with clear next steps'
      };

      const clientId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await request(app)
        .post(`/api/clients/${clientId}/calls`)
        .send(callData)
        .expect(201);

      const validationResult = CreatedCallOutSchema.safeParse(response.body);
      
      expect(validationResult.success).toBe(true);
      
      if (validationResult.success) {
        expect(validationResult.data).toEqual({
          id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
          clientId: clientId,
          ts: '2024-01-15T10:00:00.000Z',
          durationSec: 1800,
          sentiment: 'pos',
          score: 0.8,
          bookingLikelihood: 0.75,
          notes: 'Very productive call with clear next steps',
          createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        });
      }

      expect(response.headers.location).toMatch(/^\/api\/clients\/[0-9a-f-]+\/calls\/[0-9a-f-]+$/);
    });

    it('should validate call creation with different sentiment values', async () => {
      const sentimentTests = [
        { sentiment: 'pos' as const, score: 0.5 },
        { sentiment: 'neu' as const, score: 0.0 },
        { sentiment: 'neg' as const, score: -0.5 }
      ];

      for (const test of sentimentTests) {
        const callData = {
          ts: '2024-01-15T10:00:00.000Z',
          durationSec: 900,
          sentiment: test.sentiment,
          score: test.score,
          bookingLikelihood: 0.5,
          notes: `Test call with ${test.sentiment} sentiment`
        };

        const response = await request(app)
          .post('/api/clients/550e8400-e29b-41d4-a716-446655440000/calls')
          .send(callData)
          .expect(201);

        const validationResult = CreatedCallOutSchema.safeParse(response.body);
        expect(validationResult.success).toBe(true);
        
        if (validationResult.success) {
          expect(validationResult.data.sentiment).toBe(test.sentiment);
          expect(validationResult.data.score).toBe(test.score);
        }
      }
    });
  });

  describe('Action Item Creation Schema Stability', () => {
    it('should validate complete action item creation response against schema', async () => {
      const actionItemData = {
        owner: 'John Doe',
        text: 'Follow up with procurement team regarding implementation timeline',
        dueDate: '2024-01-20T00:00:00.000Z'
      };

      const clientId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await request(app)
        .post(`/api/clients/${clientId}/action-items`)
        .send(actionItemData)
        .expect(201);

      const validationResult = CreatedActionItemOutSchema.safeParse(response.body);
      
      expect(validationResult.success).toBe(true);
      
      if (validationResult.success) {
        expect(validationResult.data).toEqual({
          id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
          clientId: clientId,
          owner: 'John Doe',
          text: 'Follow up with procurement team regarding implementation timeline',
          due: '2024-01-20T00:00:00.000Z',
          status: 'open',
          createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        });
      }

      expect(response.headers.location).toMatch(/^\/api\/clients\/[0-9a-f-]+\/action-items\/[0-9a-f-]+$/);
    });

    it('should validate action item creation with minimal data', async () => {
      const actionItemData = {
        text: 'Simple follow-up task'
        // owner and dueDate omitted (optional)
      };

      const response = await request(app)
        .post('/api/clients/550e8400-e29b-41d4-a716-446655440000/action-items')
        .send(actionItemData)
        .expect(201);

      const validationResult = CreatedActionItemOutSchema.safeParse(response.body);
      
      expect(validationResult.success).toBe(true);
      
      if (validationResult.success) {
        expect(validationResult.data.owner).toBeNull();
        expect(validationResult.data.due).toBeNull();
        expect(validationResult.data.text).toBe('Simple follow-up task');
        expect(validationResult.data.status).toBe('open');
      }
    });
  });

  describe('Error Response Schema Stability', () => {
    it('should validate validation error response against schema', async () => {
      const response = await request(app)
        .post('/api/test/validation-error')
        .send({ invalid: 'data' })
        .expect(422);

      const validationResult = ErrorResponseSchema.safeParse(response.body);
      
      expect(validationResult.success).toBe(true);
      
      if (validationResult.success) {
        expect(validationResult.data).toEqual({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: {
            field: 'name',
            issue: 'too_small',
            minimum: 2
          },
          traceId: 'trace-validation-error'
        });
      }
    });

    it('should validate server error response against schema', async () => {
      const response = await request(app)
        .post('/api/test/server-error')
        .send({})
        .expect(500);

      const validationResult = ErrorResponseSchema.safeParse(response.body);
      
      expect(validationResult.success).toBe(true);
      
      if (validationResult.success) {
        expect(validationResult.data).toEqual({
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong on the server',
          traceId: 'trace-server-error'
        });
      }
    });
  });

  describe('Schema Stability Against Field Changes', () => {
    it('should detect when response contains extra fields', async () => {
      // Mock a response with extra fields that shouldn't be there
      const appWithExtraFields = express();
      appWithExtraFields.use(express.json());
      appWithExtraFields.post('/api/clients', (req, res) => {
        res.status(201).json({
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test Client',
          notes: null,
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
          extraField: 'This should not be here', // Extra field
          internalId: 12345 // Another extra field
        });
      });

      const response = await request(appWithExtraFields)
        .post('/api/clients')
        .send({ name: 'Test Client' })
        .expect(201);

      const validationResult = CreatedClientOutSchema.safeParse(response.body);
      
      // Should fail due to strict mode rejecting extra fields
      expect(validationResult.success).toBe(false);
      
      if (!validationResult.success) {
        const errors = validationResult.error.issues;
        expect(errors.some(e => e.code === 'unrecognized_keys')).toBe(true);
      }
    });

    it('should detect when response is missing required fields', async () => {
      const appWithMissingFields = express();
      appWithMissingFields.use(express.json());
      appWithMissingFields.post('/api/clients', (req, res) => {
        res.status(201).json({
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test Client',
          // Missing notes, createdAt, updatedAt
        });
      });

      const response = await request(appWithMissingFields)
        .post('/api/clients')
        .send({ name: 'Test Client' })
        .expect(201);

      const validationResult = CreatedClientOutSchema.safeParse(response.body);
      
      expect(validationResult.success).toBe(false);
      
      if (!validationResult.success) {
        const errors = validationResult.error.issues;
        const missingFields = errors.filter(e => e.code === 'invalid_type').map(e => e.path[0]);
        expect(missingFields).toContain('notes');
        expect(missingFields).toContain('createdAt');
        expect(missingFields).toContain('updatedAt');
      }
    });

    it('should detect when field types change', async () => {
      const appWithWrongTypes = express();
      appWithWrongTypes.use(express.json());
      appWithWrongTypes.post('/api/calls', (req, res) => {
        res.status(201).json({
          id: '550e8400-e29b-41d4-a716-446655440001',
          clientId: '550e8400-e29b-41d4-a716-446655440000',
          ts: '2024-01-15T10:00:00.000Z',
          durationSec: '1800', // Should be number, not string
          sentiment: 'positive', // Should be 'pos', not 'positive'
          score: '0.8', // Should be number, not string
          bookingLikelihood: 0.75,
          notes: null,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z'
        });
      });

      const response = await request(appWithWrongTypes)
        .post('/api/calls')
        .send({
          ts: '2024-01-15T10:00:00.000Z',
          durationSec: 1800,
          sentiment: 'pos',
          score: 0.8,
          bookingLikelihood: 0.75
        })
        .expect(201);

      const validationResult = CreatedCallOutSchema.safeParse(response.body);
      
      expect(validationResult.success).toBe(false);
      
      if (!validationResult.success) {
        const errors = validationResult.error.issues;
        expect(errors.some(e => e.path.includes('durationSec') && e.code === 'invalid_type')).toBe(true);
        expect(errors.some(e => e.path.includes('sentiment') && e.code === 'invalid_enum_value')).toBe(true);
        expect(errors.some(e => e.path.includes('score') && e.code === 'invalid_type')).toBe(true);
      }
    });
  });
});