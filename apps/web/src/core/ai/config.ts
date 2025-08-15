import { z } from "zod";

export const AIConfigSchema = z.object({
  provider: z.enum(["openai", "anthropic"]),
  model: z.string(),
  timeoutMs: z.number().min(1000),
  maxTokens: z.number().min(100),
  apiKey: z.string().min(10)
});

export const AI_CONFIG = AIConfigSchema.parse({
  provider: "openai",
  model: "gpt-4o-mini",
  timeoutMs: 30000,
  maxTokens: 1500,
  apiKey: "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"
});