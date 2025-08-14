import { type AiProvider, type AnalyzeInput, type AnalyzeOutput } from "@mudul/protocol";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SYSTEM = readFileSync(resolve(import.meta.dirname, "../../../protocol/src/prompts/salesCall.system.txt"), "utf-8");
const USER_TMPL = readFileSync(resolve(import.meta.dirname, "../../../protocol/src/prompts/salesCall.user.txt"), "utf-8");

type OpenAIOpts = {
  apiKey: string;
  model: string;
  baseUrl?: string; // default https://api.openai.com/v1
  timeoutMs?: number;
};

async function withTimeout<T>(p: Promise<T>, ms: number) {
  return await Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))
  ]);
}

function headers(apiKey: string) {
  return { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" };
}

function truncateTranscript(t: string, limit = 12000) {
  return t.length <= limit ? t : t.slice(0, limit);
}

export class OpenAIProvider implements AiProvider {
  constructor(private opts: OpenAIOpts) {}
  
  async analyzeCall(input: AnalyzeInput): Promise<AnalyzeOutput> {
    const body = {
      model: this.opts.model,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: USER_TMPL + "\n\n" + truncateTranscript(input.transcript) }
      ],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: "json_object" } // ask for JSON, still validate after
    };

    const url = (this.opts.baseUrl ?? "https://api.openai.com/v1") + "/chat/completions";
    const req = fetch(url, {
      method: "POST",
      headers: headers(this.opts.apiKey),
      body: JSON.stringify(body)
    });

    const res = await withTimeout(req, this.opts.timeoutMs ?? 30000);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`openai_http_${res.status}: ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("openai_no_content");
    }
    return JSON.parse(content) as AnalyzeOutput; // Zod validation happens in the caller
  }
}