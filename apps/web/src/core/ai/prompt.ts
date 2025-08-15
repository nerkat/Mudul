import { SalesCallAnalysis } from "@mudul/protocol";

export function buildAnalysisPrompt({
  transcript,
  mode,
  schemaVersion
}: {
  transcript: string;
  mode: string;
  schemaVersion: string;
}) {
  return [
    {
      role: "system" as const,
      content: `
You are an AI that outputs JSON only, matching EXACTLY the schema below. 
Return no prose, no markdown.

Schema: SalesCallAnalysis with fields: summary, sentiment (overall, score), bookingLikelihood, objections, actionItems, keyMoments, entities, complianceFlags

Requirements:
- Scores in [0,1]
- Enums lowercase  
- No extra fields
- Include meta: { mode: "${mode}", schemaVersion: "${schemaVersion}" }
- Echo "contentHash" = SHA256(schemaVersion + transcript)
- If transcript too short, return error object instead.
Minimal valid example:
{ "summary": "string", "sentiment": { "overall": "positive", "score": 0.8 } }
`
    },
    { role: "user" as const, content: transcript }
  ];
}