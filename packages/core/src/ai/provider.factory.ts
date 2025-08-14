import { type AiProvider } from "@mudul/protocol";
import { MockAiProvider } from "./mock.provider.js";
import { OpenAIProvider, type OpenAIOpts } from "./openai.provider.js";
import { redactForLogging } from "./utils.js";

export interface ProviderConfig {
  USE_LIVE_AI?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OPENAI_BASE_URL?: string;
  OPENAI_TIMEOUT_MS?: string;
  ALLOW_FALLBACK?: string;
  NODE_ENV?: string;
}

export interface ProviderValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Validate environment configuration for AI providers
 */
export function validateProviderConfig(env: ProviderConfig = process.env as ProviderConfig): ProviderValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  const useLive = env.USE_LIVE_AI === "true";
  
  if (useLive) {
    if (!env.OPENAI_API_KEY) {
      warnings.push("USE_LIVE_AI=true but OPENAI_API_KEY is missing - will fallback to mock");
    }
    
    if (!env.OPENAI_MODEL) {
      warnings.push("OPENAI_MODEL not specified - using default 'gpt-4o-mini'");
    }
    
    if (env.OPENAI_TIMEOUT_MS) {
      const timeout = parseInt(env.OPENAI_TIMEOUT_MS, 10);
      if (isNaN(timeout) || timeout < 1000) {
        warnings.push("OPENAI_TIMEOUT_MS should be >= 1000ms");
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    warnings,
    errors
  };
}

/**
 * Create AI provider based on environment configuration
 */
export function createProvider(env: ProviderConfig = process.env as ProviderConfig): AiProvider {
  const validation = validateProviderConfig(env);
  
  // Log validation warnings in development
  if (env.NODE_ENV !== 'production' && validation.warnings.length > 0) {
    console.warn('Provider configuration warnings:', validation.warnings);
  }
  
  const useLive = env.USE_LIVE_AI === "true";
  
  if (useLive && env.OPENAI_API_KEY) {
    try {
      const opts: OpenAIOpts = {
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL || "gpt-4o-mini",
        baseUrl: env.OPENAI_BASE_URL || undefined,
        timeoutMs: env.OPENAI_TIMEOUT_MS ? parseInt(env.OPENAI_TIMEOUT_MS, 10) : 30000,
        maxRetries: 1
      };
      
      return new OpenAIProvider(opts);
    } catch (error) {
      if (env.NODE_ENV !== 'production') {
        console.warn('Failed to create OpenAI provider:', redactForLogging(error instanceof Error ? error.message : 'unknown'));
      }
      return new MockAiProvider();
    }
  }
  
  return new MockAiProvider();
}

/**
 * Get provider configuration summary for debugging
 */
export function getProviderInfo(env: ProviderConfig = process.env as ProviderConfig) {
  const useLive = env.USE_LIVE_AI === "true";
  const hasApiKey = !!env.OPENAI_API_KEY;
  
  return {
    useLive,
    hasApiKey,
    model: env.OPENAI_MODEL || "gpt-4o-mini",
    baseUrl: env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    timeout: parseInt(env.OPENAI_TIMEOUT_MS || "30000", 10),
    allowFallback: env.ALLOW_FALLBACK !== "false"
  };
}