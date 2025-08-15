import { validateSalesCallAnalysis, type SalesCallAnalysis } from "@mudul/protocol";
import { AIDashboardPayload } from "../core/widgets/protocol";

export interface AnalyzeCallRequest {
  nodeId: string;
  transcript: string;
  mode: "sales_v1";
  schema?: string;
}

export interface AnalyzeCallResponse {
  analysis: SalesCallAnalysis;
  dashboard?: AIDashboardPayload;
  meta?: {
    provider: string;
    model: string;
    duration_ms: number;
    request_id: string;
  };
}

export class AIClient {
  private baseUrl: string;

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl;
  }

  async analyze(request: AnalyzeCallRequest): Promise<AnalyzeCallResponse> {
    const response = await fetch(`${this.baseUrl}/ai/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "Unknown error");
      throw new Error(`AI analysis failed: ${response.status} ${error}`);
    }

    const json = await response.json();
    
    // Validate the analysis portion
    const analysisValidation = validateSalesCallAnalysis(json.analysis || json);
    if (!analysisValidation.success) {
      throw new Error(`Invalid analysis response: ${analysisValidation.errors.map((e: any) => e.message).join(", ")}`);
    }

    // Validate dashboard if present
    let dashboard: AIDashboardPayload | undefined;
    if (json.dashboard) {
      try {
        dashboard = AIDashboardPayload.parse(json.dashboard);
      } catch (error) {
        console.warn("Invalid dashboard payload from AI, ignoring:", error);
        // Don't fail the whole request for invalid dashboard
      }
    }

    return {
      analysis: analysisValidation.data,
      dashboard,
      meta: json.meta,
    };
  }
}

// Default client instance
export const aiClient = new AIClient();