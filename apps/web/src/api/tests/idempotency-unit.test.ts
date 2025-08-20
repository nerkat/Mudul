import { describe, it, expect, beforeEach } from 'vitest';
import { idempotencyMiddleware } from '../middleware/security';
import express from 'express';

describe('Idempotency Middleware Unit Tests', () => {
  let mockReq: any;
  let mockRes: any;
  let nextCalled: boolean;
  let responseData: any;
  let statusCode: number;

  beforeEach(() => {
    nextCalled = false;
    responseData = null;
    statusCode = 200;

    mockReq = {
      method: 'POST',
      path: '/api/test',
      headers: {},
      body: { test: 'data' },
      user: { orgId: 'test-org' }
    };

    mockRes = {
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: (data: any) => {
        responseData = data;
        return mockRes;
      },
      statusCode: 201
    };

    const next = () => {
      nextCalled = true;
    };
  });

  it('should skip idempotency when no key provided', (done) => {
    idempotencyMiddleware(mockReq, mockRes, () => {
      expect(nextCalled).toBe(false); // next should be called directly
      done();
    });
  });

  it('should skip idempotency for GET requests', (done) => {
    mockReq.method = 'GET';
    mockReq.headers['idempotency-key'] = 'test-key';
    
    idempotencyMiddleware(mockReq, mockRes, () => {
      done();
    });
  });

  it('should skip idempotency when no user context', (done) => {
    mockReq.headers['idempotency-key'] = 'test-key';
    delete mockReq.user;
    
    idempotencyMiddleware(mockReq, mockRes, () => {
      done();
    });
  });

  it('should proceed with request when idempotency key is new', (done) => {
    mockReq.headers['idempotency-key'] = 'new-key';
    
    idempotencyMiddleware(mockReq, mockRes, () => {
      expect(mockReq.idempotencyKey).toBe('new-key');
      expect(mockReq.idempotencyCompoundKey).toContain('new-key');
      expect(mockReq.idempotencyCompoundKey).toContain('test-org');
      done();
    });
  });

  it('should cache response and return cached version on duplicate', () => {
    const key = 'cache-test-key';
    mockReq.headers['idempotency-key'] = key;
    
    // First request
    let nextCallCount = 0;
    const next = () => { nextCallCount++; };
    
    idempotencyMiddleware(mockReq, mockRes, next);
    expect(nextCallCount).toBe(1);
    
    // Simulate storing the response (normally done by the route handler)
    const testResponse = { id: 'test-id', name: 'test' };
    mockRes.statusCode = 201;
    mockRes.json(testResponse);
    
    // Second request with same key
    const mockReq2 = { ...mockReq };
    let mockRes2Called = false;
    const mockRes2 = {
      status: (code: number) => {
        expect(code).toBe(200); // Should return 200 for cached
        return mockRes2;
      },
      json: (data: any) => {
        expect(data).toEqual(testResponse);
        mockRes2Called = true;
        return mockRes2;
      }
    };
    
    // This should return cached response immediately
    idempotencyMiddleware(mockReq2, mockRes2, () => {
      throw new Error('Next should not be called for cached response');
    });
    
    expect(mockRes2Called).toBe(true);
  });
});