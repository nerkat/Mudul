import { describe, it, expect, vi } from "vitest";
import { analyze } from "./client";
import { AI_CONFIG } from "./config";

// Mock OpenAI to avoid real API calls in tests
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                summary: "Test summary",
                sentiment: { overall: "positive", score: 0.8 }
              })
            }
          }]
        })
      }
    }
  }))
}));

import OpenAI from "openai";

describe("Live AI Client", () => {
  it("should have valid configuration", () => {
    expect(AI_CONFIG.provider).toBe("openai");
    expect(AI_CONFIG.model).toBe("gpt-4o-mini");
    expect(AI_CONFIG.timeoutMs).toBe(30000);
    expect(AI_CONFIG.maxTokens).toBe(1500);
    expect(AI_CONFIG.apiKey).toMatch(/^sk-/);
  });

  it("should analyze transcript and return structured data", async () => {
    const result = await analyze({
      transcript: "This was a great sales call with positive outcomes.",
      mode: "sales_v1",
      schemaVersion: "v1.0.0"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.summary).toBe("Test summary");
      expect(result.data.sentiment?.overall).toBe("positive");
      expect(result.data.sentiment?.score).toBe(0.8);
      expect(result.meta.provider).toBe("openai");
      expect(result.meta.model).toBe("gpt-4o-mini");
      expect(result.meta.contentHash).toMatch(/^[a-f0-9]+$/);
    }
  });

  it("should create proper content hash", async () => {
    const result1 = await analyze({
      transcript: "Test transcript",
      mode: "sales_v1",
      schemaVersion: "v1.0.0"
    });

    const result2 = await analyze({
      transcript: "Test transcript",
      mode: "sales_v1", 
      schemaVersion: "v1.0.0"
    });

    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
    
    if (result1.ok && result2.ok) {
      // Same input should produce same content hash
      expect(result1.meta.contentHash).toBe(result2.meta.contentHash);
    }
  });

  it("should handle schema validation errors", async () => {
    // Mock OpenAI to return invalid response
    vi.mocked(OpenAI).mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  summary: "Test summary",
                  sentiment: { overall: "invalid_sentiment", score: 2.5 } // Invalid values
                })
              }
            }]
          })
        }
      }
    } as any));

    const result = await analyze({
      transcript: "Test transcript",
      mode: "sales_v1",
      schemaVersion: "v1.0.0"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("SCHEMA_INVALID");
    }
  });
});