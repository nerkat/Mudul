import { type AiProvider } from "@mudul/protocol";
import { MockAiProvider } from "./mock.provider.js";
import { OpenAIProvider, type OpenAIOpts } from "./openai.provider.js";
import { redactForLogging } from "./utils.js";

export interface ProviderConfig {
  USE_LIVE_AI?: string;
  VITE_USE_LIVE_AI?: string; // Support both env var names for flexibility
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
 * Check if live AI is enabled from either environment variable
 */
function isLiveAiEnabled(env: ProviderConfig): boolean {
  return ['USE_LIVE_AI', 'VITE_USE_LIVE_AI']
    .some(k => String(env[k as keyof ProviderConfig]).toLowerCase() === 'true');
}

/**
 * Validate environment configuration for AI providers
 */
export function validateProviderConfig(env: ProviderConfig = process.env as ProviderConfig): ProviderValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  const useLive = isLiveAiEnabled(env);
  
  if (useLive) {
    if (!env.OPENAI_API_KEY) {
      warnings.push("Live AI enabled but OPENAI_API_KEY is missing - will fallback to mock");
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
  
  const useLive = isLiveAiEnabled(env);
  
  // Debug logging for environment variable detection (as suggested in issue)
  if (env.NODE_ENV !== 'production') {
    console.log('[AI SELECTOR]', {
      useLive,
      USE_LIVE_AI: env.USE_LIVE_AI,
      VITE_USE_LIVE_AI: env.VITE_USE_LIVE_AI,
      hasKey: !!env.OPENAI_API_KEY,
      provider: 'openai' // hardcoded for now, can be made configurable later
    });
  }
  
  if (useLive && env.OPENAI_API_KEY) {
    try {
      const opts: OpenAIOpts = {
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL || "gpt-4o-mini",
        baseUrl: env.OPENAI_BASE_URL || undefined,
        timeoutMs: env.OPENAI_TIMEOUT_MS ? parseInt(env.OPENAI_TIMEOUT_MS, 10) : 30000,
        maxRetries: 1
      };
      
      if (env.NODE_ENV !== 'production') {
        console.log('[AI LIVE] openai branch running');
      }
      
      return new OpenAIProvider(opts);
    } catch (error) {
      if (env.NODE_ENV !== 'production') {
        console.warn('Failed to create OpenAI provider:', redactForLogging(error instanceof Error ? error.message : 'unknown'));
      }
      return new MockAiProvider();
    }
  }
  
  if (useLive && !env.OPENAI_API_KEY) {
    if (env.NODE_ENV !== 'production') {
      console.warn('[AI LIVE] requested but OPENAI_API_KEY missing → fallback to mock');
    }
  }
  
  if (env.NODE_ENV !== 'production') {
    console.log('[AI MOCK] mock branch running');
  }
  
  return new MockAiProvider();
}

/**
 * Get provider configuration summary for debugging
 */
export function getProviderInfo(env: ProviderConfig = process.env as ProviderConfig) {
  const useLive = isLiveAiEnabled(env);
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