import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateSalesCallAnalysis } from '@mudul/protocol';
import { AIClient } from '../services/aiClient';

// Mock fetch for testing
global.fetch = vi.fn();

describe('AIClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate successful analysis response', async () => {
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
      mode: "sales_v1"
    });

    expect(result.analysis.summary).toBe("Test summary");
    expect(result.analysis.sentiment?.overall).toBe("positive");
    expect(result.meta?.provider).toBe("mock");
  });

  it('should reject invalid sentiment enum', async () => {
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
    await expect(client.analyze({
      nodeId: "test-node",
      transcript: "test transcript",
      mode: "sales_v1"
    })).rejects.toThrow("Invalid analysis response");
  });

  it('should reject invalid score ranges', async () => {
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
    await expect(client.analyze({
      nodeId: "test-node",
      transcript: "test transcript",
      mode: "sales_v1"
    })).rejects.toThrow("Invalid analysis response");
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