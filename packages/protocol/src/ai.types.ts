import type { SalesCall } from "./salesCall.schema";

/**
 * Input for AI provider analysis. Note: sessionId is handled at the transport/API level,
 * not part of the provider contract, as it's used for request tracking/logging only.
 */
export type AnalyzeInput = { transcript: string };
export type AnalyzeOutput = SalesCall;

export interface AiProvider {
  analyzeCall(input: AnalyzeInput): Promise<AnalyzeOutput>;
}

export { type SalesCall } from "./salesCall.schema";