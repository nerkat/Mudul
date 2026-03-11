export interface RawEnv {
  USE_LIVE_AI?: string;
  VITE_USE_LIVE_AI?: string;
  OPENAI_API_KEY?: string;
  AI_API_KEY?: string;
  OPENAI_MODEL?: string;
  AI_MODEL?: string;
  OPENAI_TIMEOUT_MS?: string;
  AI_TIMEOUT_MS?: string;
  ALLOW_FALLBACK?: string;
  AI_ALLOW_STUB?: string;
  AI_DEBUG?: string;
  AI_PROVIDER?: string;
  NODE_ENV?: string;
}

export function isLiveAiEnabled(env: RawEnv = process.env as RawEnv): boolean {
  return [env.VITE_USE_LIVE_AI, env.USE_LIVE_AI].some(v => String(v).toLowerCase() === 'true');
}

export interface UnifiedAIConfig {
  useLive: boolean;
  provider: 'openai' | 'anthropic';
  apiKey?: string;
  model: string;
  timeoutMs: number;
  allowFallback: boolean;
  allowStub: boolean;
  debug: boolean;
}

export function getUnifiedAIConfig(env: RawEnv = process.env as RawEnv): UnifiedAIConfig {
  const useLive = isLiveAiEnabled(env);
  const provider = (env.AI_PROVIDER || 'openai') as 'openai' | 'anthropic';
  const apiKey = env.AI_API_KEY || env.OPENAI_API_KEY;
  const model = env.AI_MODEL || env.OPENAI_MODEL || 'gpt-4o-mini';
  const timeoutMs = parseInt(env.AI_TIMEOUT_MS || env.OPENAI_TIMEOUT_MS || '30000', 10);
  const allowFallback = env.ALLOW_FALLBACK !== 'false';
  const allowStub = String(env.AI_ALLOW_STUB).toLowerCase() === 'true';
  const debug = String(env.AI_DEBUG).toLowerCase() === 'true' || (env.NODE_ENV !== 'production');
  return { useLive, provider, apiKey, model, timeoutMs, allowFallback, allowStub, debug };
}

export function isFakeDevKey(apiKey?: string): boolean {
  if (!apiKey) return false;
  return apiKey.startsWith('sk-test-fake-key') || apiKey === 'sk-your-openai-key';
}
