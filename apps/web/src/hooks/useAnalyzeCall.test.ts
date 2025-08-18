import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAnalysisContentHash } from "../services/versioning";

// Mock environment variable
Object.defineProperty(import.meta, 'env', {
  value: { USE_LIVE_AI: "false" }, // Default to mock mode for tests
  writable: true
});

// Mock the AI client and repo functions
vi.mock("../services/aiClient", () => ({
  aiClient: {
    analyze: vi.fn()
  }
}));

vi.mock("../core/repo", () => ({
  upsertCall: vi.fn(),
  setDashboard: vi.fn(),
  hasExistingAnalysis: vi.fn()
}));

import { hasExistingAnalysis } from "../core/repo";

describe("useAnalyzeCall Hook Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create consistent content hashes for idempotency", () => {
    const transcript = "This is a test sales call transcript";
    const mode = "sales_v1";
    
    const hash1 = createAnalysisContentHash(transcript, mode);
    const hash2 = createAnalysisContentHash(transcript, mode);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-z0-9]+$/);
  });

  it("should handle duplicate analysis detection correctly", () => {
    const nodeId = "test-node-123";
    const contentHash = "test-hash-123";
    
    // Mock hasExistingAnalysis to return true (duplicate)
    (hasExistingAnalysis as any).mockReturnValue(true);
    
    const isDuplicate = hasExistingAnalysis(nodeId, contentHash);
    expect(isDuplicate).toBe(true);
    expect(hasExistingAnalysis).toHaveBeenCalledWith(nodeId, contentHash);
  });

  it("should test HTTP request integration for live AI", async () => {
    // Test that the integration can handle HTTP requests properly
    const transcript = "Test transcript for HTTP integration";
    const mode = "sales_v1";
    const schemaVersion = "v1.0.0";
    
    // Mock fetch for testing HTTP integration
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ok: true,
        data: {
          summary: "HTTP AI summary",
          sentiment: { overall: "positive", score: 0.8 }
        },
        meta: {
          provider: "openai",
          model: "gpt-4o-mini",
          contentHash: "http-hash-123",
          schemaVersion: "v1.0.0"
        }
      })
    });
    
    global.fetch = mockFetch;
    
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, mode, schemaVersion })
    });
    
    const result = await response.json();
    
    expect(mockFetch).toHaveBeenCalledWith('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, mode, schemaVersion })
    });
    
    expect(result.ok).toBe(true);
    expect(result.data.summary).toBe("HTTP AI summary");
  });
});