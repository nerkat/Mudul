import { describe, it, expect } from 'vitest';
import { 
  createAnalysisContentHash, 
  isAnalysisDuplicate, 
  createAnalysisMeta,
  updateAnalysisMeta,
  ANALYSIS_SCHEMA_VERSION 
} from '../services/versioning';

describe('Content Hashing and Versioning', () => {
  it('should create consistent content hashes', () => {
    const transcript = "This is a test transcript";
    const mode = "sales_v1";
    
    const hash1 = createAnalysisContentHash(transcript, mode);
    const hash2 = createAnalysisContentHash(transcript, mode);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(6); // Base36 encoded hash should be reasonably short
  });

  it('should create different hashes for different content', () => {
    const transcript1 = "This is a test transcript";
    const transcript2 = "This is a different transcript";
    const mode = "sales_v1";
    
    const hash1 = createAnalysisContentHash(transcript1, mode);
    const hash2 = createAnalysisContentHash(transcript2, mode);
    
    expect(hash1).not.toBe(hash2);
  });

  it('should create different hashes for different modes', () => {
    const transcript = "This is a test transcript";
    
    const hash1 = createAnalysisContentHash(transcript, "sales_v1");
    // Mock a different mode by changing the content
    const hash2 = createAnalysisContentHash(transcript + ":different_mode", "sales_v1");
    
    expect(hash1).not.toBe(hash2);
  });

  it('should detect duplicate analysis correctly', () => {
    const contentHash = "abc123";
    const schemaVersion = "v1.0.0";
    
    const existingAnalysis = {
      summary: "Test summary",
      meta: {
        mode: "sales_v1" as const,
        schemaVersion,
        contentHash,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      }
    };

    expect(isAnalysisDuplicate(existingAnalysis, contentHash, schemaVersion)).toBe(true);
    expect(isAnalysisDuplicate(existingAnalysis, "different", schemaVersion)).toBe(false);
    expect(isAnalysisDuplicate(existingAnalysis, contentHash, "v2.0.0")).toBe(false);
    expect(isAnalysisDuplicate(null, contentHash, schemaVersion)).toBe(false);
  });

  it('should create analysis metadata correctly', () => {
    const mode = "sales_v1";
    const contentHash = "abc123";
    const requestId = "req_123";
    const provider = "openai";
    const model = "gpt-4";
    const durationMs = 1500;

    const meta = createAnalysisMeta(mode, contentHash, requestId, provider, model, durationMs);

    expect(meta).toEqual({
      mode,
      schemaVersion: ANALYSIS_SCHEMA_VERSION,
      contentHash,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      requestId,
      provider,
      model,
      durationMs
    });

    expect(meta.createdAt).toBe(meta.updatedAt);
    expect(new Date(meta.createdAt).getTime()).toBeGreaterThan(Date.now() - 1000);
  });

  it('should update analysis metadata correctly', () => {
    const originalMeta = {
      mode: "sales_v1" as const,
      schemaVersion: "v1.0.0",
      contentHash: "abc123",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      requestId: "req_original",
      provider: "mock",
      model: "test",
      durationMs: 500
    };

    const updatedMeta = updateAnalysisMeta(
      originalMeta,
      "req_updated",
      "openai", 
      "gpt-4",
      1500
    );

    expect(updatedMeta.createdAt).toBe(originalMeta.createdAt); // Should preserve
    expect(updatedMeta.updatedAt).not.toBe(originalMeta.updatedAt); // Should update
    expect(updatedMeta.requestId).toBe("req_updated");
    expect(updatedMeta.provider).toBe("openai");
    expect(updatedMeta.model).toBe("gpt-4");
    expect(updatedMeta.durationMs).toBe(1500);
  });

  it('should throw error when updating missing metadata', () => {
    expect(() => {
      updateAnalysisMeta(undefined as any, "req_123");
    }).toThrow("Cannot update missing metadata");
  });
});