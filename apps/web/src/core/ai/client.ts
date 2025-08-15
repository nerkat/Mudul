import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { SalesCallAnalysis } from "@mudul/protocol";
import { AI_CONFIG } from "./config";
import { buildAnalysisPrompt } from "./prompt";

export async function analyze({
  transcript,
  mode,
  schemaVersion
}: {
  transcript: string;
  mode: string;
  schemaVersion: string;
}) {
  const contentHash = await crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(schemaVersion + transcript))
    .then(buffer => Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    );

  const messages = buildAnalysisPrompt({ transcript, mode, schemaVersion });

  let rawJSON: any;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), AI_CONFIG.timeoutMs);

  try {
    if (AI_CONFIG.provider === "openai") {
      const client = new OpenAI({ apiKey: AI_CONFIG.apiKey, dangerouslyAllowBrowser: true });
      const res = await client.chat.completions.create({
        model: AI_CONFIG.model,
        messages,
        temperature: 0,
        top_p: 1,
        max_tokens: AI_CONFIG.maxTokens,
        response_format: { type: "json_object" },
      }, {
        signal: abort.signal
      });
      rawJSON = JSON.parse(res.choices[0]?.message?.content || "{}");
    } else {
      const client = new Anthropic({ apiKey: AI_CONFIG.apiKey, dangerouslyAllowBrowser: true });
      const res = await client.messages.create({
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.maxTokens,
        temperature: 0,
        top_p: 1,
        messages,
        system: "Output JSON only.",
      }, {
        signal: abort.signal
      });
      rawJSON = JSON.parse((res.content[0] as any)?.text || "{}");
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { ok: false, error: { code: "TIMEOUT" } };
    }
    return { ok: false, error: { code: "PROVIDER_ERROR", details: err.message } };
  } finally {
    clearTimeout(timer);
  }

  // Validate
  const parsed = SalesCallAnalysis.safeParse(rawJSON);
  if (!parsed.success) {
    return { ok: false, error: { code: "SCHEMA_INVALID", details: parsed.error.format() } };
  }

  return {
    ok: true,
    data: parsed.data,
    meta: {
      provider: AI_CONFIG.provider,
      model: AI_CONFIG.model,
      schemaVersion,
      contentHash,
      updatedAt: new Date().toISOString()
    }
  };
}