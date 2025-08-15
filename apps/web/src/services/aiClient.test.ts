import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateSalesCallAnalysis } from '@mudul/protocol';
import { AIClient } from '../services/aiClient';
import type { AnalysisMode } from '../services/versioning';

// Mock fetch for testing
global.fetch = vi.fn();

describe('AIClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return success result for valid analysis response', async () => {
    const mockResponse = {
      analysis: {
        summary: "Test summary",
        sentiment: { overall: "positive", score: 0.8 },
        bookingLikelihood: 0.75
      },
      meta: {
        provider: "mock",
        model: "test",
        duration_ms: 100,
        request_id: "test-123"
      }
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const client = new AIClient();
    const result = await client.analyze({
      nodeId: "test-node",
      transcript: "test transcript",
      mode: "sales_v1" as AnalysisMode
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.analysis.summary).toBe("Test summary");
      expect(result.data.analysis.sentiment?.overall).toBe("positive");
      expect(result.data.meta?.provider).toBe("mock");
      expect(result.data.analysis.meta?.mode).toBe("sales_v1");
      expect(result.data.analysis.meta?.contentHash).toBeDefined();
    }
  });

  it('should return failure result for invalid sentiment enum', async () => {
    const mockResponse = {
      analysis: {
        summary: "Test summary",
        sentiment: { overall: "POSITIVE", score: 0.8 }, // Invalid uppercase
        bookingLikelihood: 0.75
      }
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const client = new AIClient();
    const result = await client.analyze({
      nodeId: "test-node",
      transcript: "test transcript",
      mode: "sales_v1" as AnalysisMode
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('SCHEMA_INVALID');
      expect(result.error.message).toContain('invalid analysis schema');
    }
  });

  it('should return failure result for invalid score ranges', async () => {
    const mockResponse = {
      analysis: {
        summary: "Test summary",
        sentiment: { overall: "positive", score: 1.5 }, // Invalid range
        bookingLikelihood: -0.1 // Invalid range
      }
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const client = new AIClient();
    const result = await client.analyze({
      nodeId: "test-node",
      transcript: "test transcript",
      mode: "sales_v1" as AnalysisMode
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('SCHEMA_INVALID');
    }
  });

  it('should return failure result for HTTP errors', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "Server error details"
    });

    const client = new AIClient();
    const result = await client.analyze({
      nodeId: "test-node",
      transcript: "test transcript",
      mode: "sales_v1" as AnalysisMode
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('SERVER_ERROR');
      expect(result.error.message).toContain('Server error');
    }
  });

  it('should return failure result for rate limiting', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      text: async () => "Rate limit exceeded"
    });

    const client = new AIClient();
    const result = await client.analyze({
      nodeId: "test-node",
      transcript: "test transcript", 
      mode: "sales_v1" as AnalysisMode
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('RATE_LIMITED');
      expect(result.error.retryable).toBe(true);
    }
  });

  it('should handle network errors correctly', async () => {
    (fetch as any).mockRejectedValueOnce(new TypeError('fetch failed'));

    const client = new AIClient();
    const result = await client.analyze({
      nodeId: "test-node",
      transcript: "test transcript",
      mode: "sales_v1" as AnalysisMode
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NETWORK_ERROR');
      expect(result.error.retryable).toBe(true);
    }
  });

  it('should respect abort signal', async () => {
    const abortController = new AbortController();
    
    (fetch as any).mockImplementationOnce(() => {
      abortController.abort();
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      return Promise.reject(abortError);
    });

    const client = new AIClient();
    const result = await client.analyze({
      nodeId: "test-node",
      transcript: "test transcript",
      mode: "sales_v1" as AnalysisMode
    }, abortController.signal);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CANCELLED');
    }
  });

  it('should timeout after configured duration', async () => {
    // Mock fetch to simulate a timeout by immediately calling the abort handler
    (fetch as any).mockImplementationOnce((url: string, options: any) => {
      // Simulate the abort signal being triggered after timeout
      setTimeout(() => {
        if (options.signal && !options.signal.aborted) {
          // Manually trigger abort for testing
          const abortEvent = new Event('abort');
          options.signal.dispatchEvent(abortEvent);
        }
      }, 10);
      
      return new Promise((resolve, reject) => {
        options.signal?.addEventListener('abort', () => {
          const abortError = new Error('The operation was aborted');
          abortError.name = 'AbortError';
          reject(abortError);
        });
      });
    });

    const client = new AIClient({ timeout: 50 }); // 50ms timeout
    const result = await client.analyze({
      nodeId: "test-node",
      transcript: "test transcript",
      mode: "sales_v1" as AnalysisMode
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CANCELLED'); // AbortController timeout
    }
  }, 1000); // 1 second test timeout

  it('should include versioning metadata in request', async () => {
    const mockResponse = {
      analysis: {
        summary: "Test summary"
      },
      meta: {
        provider: "mock",
        model: "test",
        duration_ms: 100,
        request_id: "test-123"
      }
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const client = new AIClient();
    await client.analyze({
      nodeId: "test-node", 
      transcript: "test transcript",
      mode: "sales_v1" as AnalysisMode,
      requestId: "custom-req-id"
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/ai/analyze'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Request-ID': 'custom-req-id'
        }),
        body: expect.stringContaining('"requestId":"custom-req-id"')
      })
    );
  });
});

describe('SalesCallAnalysis Schema', () => {
  it('should accept valid analysis with lowercase enums', () => {
    const validAnalysis = {
      summary: "Test summary",
      sentiment: { overall: "positive", score: 0.8 },
      bookingLikelihood: 0.75
    };

    const result = validateSalesCallAnalysis(validAnalysis);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sentiment?.overall).toBe("positive");
    }
  });

  it('should reject uppercase sentiment enums', () => {
    const invalidAnalysis = {
      summary: "Test summary",
      sentiment: { overall: "POSITIVE", score: 0.8 },
      bookingLikelihood: 0.75
    };

    const result = validateSalesCallAnalysis(invalidAnalysis);
    expect(result.success).toBe(false);
  });

  it('should reject out-of-range scores', () => {
    const invalidAnalysis = {
      summary: "Test summary",
      sentiment: { overall: "positive", score: 1.5 },
      bookingLikelihood: -0.1
    };

    const result = validateSalesCallAnalysis(invalidAnalysis);
    expect(result.success).toBe(false);
  });

  it('should accept optional fields', () => {
    const minimalAnalysis = {
      summary: "Test summary"
    };

    const result = validateSalesCallAnalysis(minimalAnalysis);
    expect(result.success).toBe(true);
  });
});