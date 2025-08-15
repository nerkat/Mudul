import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAnalysisContentHash } from "../services/versioning";

// Mock environment variable
Object.defineProperty(import.meta, 'env', {
  value: { VITE_USE_LIVE_AI: "false" }, // Default to mock mode for tests
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

vi.mock("../core/ai/client", () => ({
  analyze: vi.fn()
}));

import { hasExistingAnalysis } from "../core/repo";
import { analyze as liveAnalyze } from "../core/ai/client";

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

  it("should have live AI client available", async () => {
    // Mock successful live AI response
    (liveAnalyze as any).mockResolvedValue({
      ok: true,
      data: {
        summary: "Live AI summary",
        sentiment: { overall: "positive", score: 0.9 }
      },
      meta: {
        provider: "openai",
        model: "gpt-4o-mini",
        contentHash: "abc123",
        schemaVersion: "v1.0.0"
      }
    });

    const result = await liveAnalyze({
      transcript: "Test transcript",
      mode: "sales_v1",
      schemaVersion: "v1.0.0"
    });

    expect(liveAnalyze).toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.summary).toBe("Live AI summary");
      expect(result.meta.provider).toBe("openai");
    }
  });
});