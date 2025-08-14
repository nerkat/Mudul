import { type AiProvider, type AnalyzeInput, type AnalyzeOutput } from "@mudul/protocol";
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

export class MockProvider implements AiProvider {
  async analyzeCall(_input: AnalyzeInput): Promise<AnalyzeOutput> {
    // Add artificial delay as specified
    await new Promise(r => setTimeout(r, 300));
    
    // Deep clone to avoid accidental mutation
    const sample = loadSampleFixture();
    return JSON.parse(JSON.stringify(sample));
  }
}