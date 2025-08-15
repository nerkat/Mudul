import { z } from "zod";

/**
 * Schema for AI analysis results that targets widget data fields.
 * Uses 0-1 scoring and lowercase enums as required by the issue.
 */
export const SalesCallAnalysis = z.object({
  summary: z.string().optional(),
  sentiment: z.object({
    overall: z.enum(["positive", "neutral", "negative"]), // lowercase only
    score: z.number().min(0).max(1) // 0-1 range
  }).optional(),
  bookingLikelihood: z.number().min(0).max(1).optional(), // 0-1 range
  objections: z.array(z.object({
    type: z.string(),
    quote: z.string(),
    ts: z.string().optional()
  })).optional(),
  actionItems: z.array(z.object({
    owner: z.string(),
    text: z.string(),
    due: z.string().optional()
  })).optional(),
  keyMoments: z.array(z.object({
    label: z.string(),
    ts: z.string().optional()
  })).optional(),
  entities: z.object({
    prospect: z.array(z.string()).optional(),
    people: z.array(z.string()).optional(),
    products: z.array(z.string()).optional()
  }).partial().optional(),
  complianceFlags: z.array(z.string()).optional()
});

export type SalesCallAnalysis = z.infer<typeof SalesCallAnalysis>;

export type AnalysisValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: z.ZodIssue[] };

export function validateSalesCallAnalysis(json: unknown): AnalysisValidationResult<SalesCallAnalysis> {
  const result = SalesCallAnalysis.safeParse(json);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error.issues };
  }
}