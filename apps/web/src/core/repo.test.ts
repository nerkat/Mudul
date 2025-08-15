import { describe, it, expect } from 'vitest';
import { upsertCall, setDashboard, getCallByNode } from '../core/repo';
import { DashboardTemplates } from '../core/registry-json';

describe('Repository Mutation Methods', () => {
  it('should upsert call data correctly', () => {
    const nodeId = 'test-node-123';
    const analysisData = {
      summary: "Great call with high engagement",
      sentiment: { overall: "positive", score: 0.85 },
      bookingLikelihood: 0.75
    };

    // Add initial data
    upsertCall(nodeId, analysisData);
    let result = getCallByNode(nodeId);
    expect(result?.summary).toBe("Great call with high engagement");
    expect(result?.sentiment?.score).toBe(0.85);

    // Update with partial data
    upsertCall(nodeId, { 
      bookingLikelihood: 0.9,
      objections: [{ type: "pricing", quote: "Too expensive" }]
    });
    
    result = getCallByNode(nodeId);
    expect(result?.summary).toBe("Great call with high engagement"); // preserved
    expect(result?.bookingLikelihood).toBe(0.9); // updated
    expect(result?.objections).toHaveLength(1); // added
  });

  it('should set dashboard template correctly', () => {
    const nodeId = 'test-node-456';
    const template = {
      version: "1.0.0" as const,
      layout: { columns: 12 },
      widgets: [
        { slug: "summary" as const, params: { maxLength: 300 } },
        { slug: "sentiment" as const, params: { showScore: true } }
      ]
    };

    setDashboard(nodeId, template);

    // Check that a new template was created with ai-generated prefix
    const aiTemplateKey = `ai-generated-${nodeId}`;
    expect(DashboardTemplates[aiTemplateKey]).toBeDefined();
    expect(DashboardTemplates[aiTemplateKey].widgets).toHaveLength(2);
    expect(DashboardTemplates[aiTemplateKey].widgets[0].slug).toBe("summary");
  });
});