import { type AiProvider, type AnalyzeInput, type AnalyzeOutput, validateSalesCall } from "@mudul/protocol";
// Read sample fixture from protocol package
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the sample fixture
function loadSampleFixture(): AnalyzeOutput {
  const fixturePath = resolve(__dirname, "../../../protocol/fixtures/sales-call.sample.json");
  const rawData = readFileSync(fixturePath, "utf-8");
  return JSON.parse(rawData);
}

// Validate fixture at startup to catch issues early
const SAMPLE_FIXTURE = loadSampleFixture();
const fixtureValidation = validateSalesCall(SAMPLE_FIXTURE);
if (!fixtureValidation.success) {
  throw new Error(`MockProvider: Sample fixture failed validation: ${JSON.stringify(fixtureValidation.errors)}`);
}

export class MockAiProvider implements AiProvider {
  async analyzeCall(_input: AnalyzeInput): Promise<AnalyzeOutput> {
    const startTime = Date.now();
    const requestId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add artificial delay as specified
    await new Promise(r => setTimeout(r, 300));
    
    const duration = Date.now() - startTime;
    
    // Deep clone to avoid accidental mutation - use structuredClone where available
    const baseResult = typeof structuredClone !== 'undefined' 
      ? structuredClone(SAMPLE_FIXTURE)
      : JSON.parse(JSON.stringify(SAMPLE_FIXTURE));
    
    // Add standardized meta shape
    return {
      ...baseResult,
      meta: {
        provider: 'mock',
        model: 'mock',
        duration_ms: duration,
        request_id: requestId,
        fallback: false,
        failed_provider: null,
        failed_error_code: null,
        prompt_versions: {
          system: 'salesCall.system@v1.0.0',
          user: 'salesCall.user@v1.0.0'
        },
        truncated: false,
        retries: 0,
        schema_version: "SalesCallV1"
      }
    };
  }
}