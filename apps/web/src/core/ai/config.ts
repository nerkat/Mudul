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
  apiKey: "REMOVED_OPENAI_KEY"
});