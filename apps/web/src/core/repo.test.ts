import { describe, it, expect, beforeEach } from 'vitest';
import { upsertCall, setDashboard, getCallByNode, hasExistingAnalysis } from '../core/repo';
import { DashboardTemplates } from '../core/registry-json';
import { calls } from '../core/seed';

describe('Repository Mutation Methods', () => {
  beforeEach(() => {
    // Clean up any test data
    Object.keys(calls).forEach(key => {
      if (key.startsWith('test-')) {
        delete calls[key];
      }
    });
  });

  it('should upsert call data correctly', () => {
    const nodeId = 'test-node-123';
    const analysisData = {
      summary: "Great call with high engagement",
      sentiment: { overall: "positive", score: 0.85 },
      bookingLikelihood: 0.75,
      meta: {
        mode: "sales_v1",
        schemaVersion: "v1.0.0",
        contentHash: "abc123",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      }
    };

    // Add initial data
    const result1 = upsertCall(nodeId, analysisData);
    expect(result1.updated).toBe(true);
    expect(result1.isDuplicate).toBe(false);
    
    let callData = getCallByNode(nodeId);
    expect(callData?.summary).toBe("Great call with high engagement");
    expect(callData?.sentiment?.score).toBe(0.85);
    expect(callData?.meta?.contentHash).toBe("abc123");

    // Update with partial data - should preserve existing fields
    const partialUpdate = { 
      bookingLikelihood: 0.9,
      objections: [{ type: "pricing", quote: "Too expensive" }],
      meta: {
        requestId: "req_456",
        provider: "openai"
      }
    };
    
    const result2 = upsertCall(nodeId, partialUpdate);
    expect(result2.updated).toBe(true);
    expect(result2.isDuplicate).toBe(false);
    
    callData = getCallByNode(nodeId);
    expect(callData?.summary).toBe("Great call with high engagement"); // preserved
    expect(callData?.sentiment?.score).toBe(0.85); // preserved
    expect(callData?.bookingLikelihood).toBe(0.9); // updated
    expect(callData?.objections).toHaveLength(1); // added
    expect(callData?.meta?.contentHash).toBe("abc123"); // preserved
    expect(callData?.meta?.requestId).toBe("req_456"); // updated
    expect(callData?.meta?.provider).toBe("openai"); // added
  });

  it('should detect and prevent duplicate analysis', () => {
    const nodeId = 'test-node-456';
    const contentHash = "duplicate123";
    const schemaVersion = "v1.0.0";
    
    const originalData = {
      summary: "Original analysis",
      meta: {
        mode: "sales_v1",
        schemaVersion,
        contentHash,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      }
    };

    // First upsert should succeed
    const result1 = upsertCall(nodeId, originalData);
    expect(result1.updated).toBe(true);
    expect(result1.isDuplicate).toBe(false);

    // Duplicate upsert should be rejected
    const duplicateData = {
      summary: "Attempted duplicate",
      meta: {
        mode: "sales_v1",
        schemaVersion,
        contentHash, // Same content hash
        createdAt: "2024-01-02T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z"
      }
    };

    const result2 = upsertCall(nodeId, duplicateData);
    expect(result2.updated).toBe(false);
    expect(result2.isDuplicate).toBe(true);
    expect(result2.reason).toContain('already exists');

    // Original data should be preserved
    const callData = getCallByNode(nodeId);
    expect(callData?.summary).toBe("Original analysis");
  });

  it('should handle undefined values correctly in merge', () => {
    const nodeId = 'test-node-789';
    
    // Initial data
    const initialData = {
      summary: "Initial summary",
      sentiment: { overall: "positive", score: 0.8 },
      bookingLikelihood: 0.7
    };
    
    upsertCall(nodeId, initialData);

    // Update with some undefined values - should not overwrite existing
    const updateWithUndefined = {
      summary: "Updated summary",
      sentiment: undefined, // Should not overwrite existing sentiment
      bookingLikelihood: 0.9,
      objections: [{ type: "price", quote: "Too expensive" }]
    };

    const result = upsertCall(nodeId, updateWithUndefined);
    expect(result.updated).toBe(true);

    const callData = getCallByNode(nodeId);
    expect(callData?.summary).toBe("Updated summary"); // updated
    expect(callData?.sentiment?.overall).toBe("positive"); // preserved
    expect(callData?.sentiment?.score).toBe(0.8); // preserved
    expect(callData?.bookingLikelihood).toBe(0.9); // updated
    expect(callData?.objections).toHaveLength(1); // added
  });

  it('should check for existing analysis correctly', () => {
    const nodeId = 'test-node-existing';
    const contentHash = "existing123";
    const schemaVersion = "v1.0.0";

    // No existing analysis
    expect(hasExistingAnalysis(nodeId, contentHash, schemaVersion)).toBe(false);

    // Add analysis
    upsertCall(nodeId, {
      summary: "Test analysis",
      meta: {
        mode: "sales_v1",
        schemaVersion,
        contentHash,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      }
    });

    // Should now detect existing analysis
    expect(hasExistingAnalysis(nodeId, contentHash, schemaVersion)).toBe(true);
    expect(hasExistingAnalysis(nodeId, "different", schemaVersion)).toBe(false);
    expect(hasExistingAnalysis(nodeId, contentHash, "v2.0.0")).toBe(false);
  });

  it('should set dashboard template correctly', () => {
    const nodeId = 'test-node-dashboard';
    const template = {
      version: "1.0.0" as const,
      layout: { columns: 12 },
      widgets: [
        { slug: "summary" as const, params: { maxLength: 300 } },
        { slug: "sentiment" as const, params: { showScore: true } }
      ]
    };

    setDashboard(nodeId, template);

    // Check that a new template was created with ai-generated prefix
    const aiTemplateKey = `ai-generated-${nodeId}`;
    expect(DashboardTemplates[aiTemplateKey]).toBeDefined();
    expect(DashboardTemplates[aiTemplateKey].widgets).toHaveLength(2);
    expect(DashboardTemplates[aiTemplateKey].widgets[0].slug).toBe("summary");
  });
});