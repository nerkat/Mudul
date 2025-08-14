import type { SalesCall } from "./salesCall.schema";

export type AnalyzeInput = { transcript: string };
export type AnalyzeOutput = SalesCall;

export interface AiProvider {
  analyzeCall(input: AnalyzeInput): Promise<AnalyzeOutput>;
}

export { type SalesCall } from "./salesCall.schema";