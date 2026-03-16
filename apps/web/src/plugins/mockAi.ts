import type { Plugin } from 'vite';

// Mock AI analysis response that matches our schema
const mockAnalysisResponse = {
  analysis: {
    summary: "Great sales call with high engagement. Customer showed strong interest in our enterprise features.",
    sentiment: {
      overall: "positive",
      score: 0.85
    },
    bookingLikelihood: 0.75,
    objections: [
      {
        type: "pricing",
        quote: "The price seems a bit high for our current budget",
        ts: "00:12:34"
      }
    ],
    actionItems: [
      {
        owner: "Sales Rep",
        text: "Send enterprise pricing proposal",
        due: "2024-01-15"
      },
      {
        owner: "Customer",
        text: "Review proposal with finance team"
      }
    ],
    keyMoments: [
      {
        label: "Product demo",
        ts: "00:05:15"
      },
      {
        label: "Pricing discussion",
        ts: "00:12:30"
      }
    ],
    entities: {
      prospect: ["Acme Corp"],
      people: ["John Smith", "Sarah Johnson"],
      products: ["Enterprise Suite", "Analytics Module"]
    },
    complianceFlags: []
  },
  dashboard: {
    version: "1.0.0",
    dashboard: {
      layout: { columns: 12 },
      widgets: [
        { slug: "summary", params: { maxLength: 500 } },
        { slug: "sentiment", params: { showScore: true } },
        { slug: "booking", params: { showAsPercentage: true } },
        { slug: "objections", params: { maxItems: 5 } },
        { slug: "actionItems", params: { maxItems: 5 } },
        { slug: "keyMoments", params: { maxItems: 5 } }
      ]
    }
  },
  meta: {
    provider: "mock",
    model: "mock-ai-v1",
    duration_ms: 1200,
    request_id: `mock_${Date.now()}`
  }
};

// Mock memory patch response
function buildMockMemoryPatch(clientName: string) {
  return {
    patch: {
      newTags: ["enterprise", "budget-sensitive", "high-engagement"],
      riskSignals: ["Budget approval required from finance team", "Pricing sensitivity noted"],
      peopleUpdates: [
        { name: "John Smith", role: "Decision Maker", notes: "Prefers detailed ROI analysis" },
        { name: "Sarah Johnson", role: "Technical Evaluator", notes: "Focused on integration capabilities" }
      ],
      budgetSignal: "Mid-market budget range, requires finance committee sign-off",
      timelineSignal: "Q2 target for procurement decision",
      briefingUpdates: [
        `${clientName} is evaluating enterprise options with strong interest in analytics`,
        "Finance team involvement required for final approval",
        "Technical fit confirmed — integration is the main evaluation criterion"
      ]
    }
  };
}

export function mockAiPlugin(): Plugin {
  return {
    name: 'mock-ai-plugin',
    configureServer(server) {
      server.middlewares.use('/api/ai/analyze', (req, res, next) => {
        if (req.method === 'POST') {
          // Add artificial delay to simulate real API
          setTimeout(() => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(mockAnalysisResponse));
          }, 800);
        } else {
          next();
        }
      });

      server.middlewares.use('/api/ai/generate-memory-patch', async (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }

        try {
          // Parse request body
          let body: any = {};
          if (req.body && typeof req.body === 'object') {
            body = req.body;
          } else {
            const chunks: Buffer[] = [];
            for await (const chunk of req as any) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const text = Buffer.concat(chunks).toString('utf-8');
            if (text) {
              try { body = JSON.parse(text); } catch { /* ignore */ }
            }
          }

          const clientName = body?.clientName ?? 'Client';

          setTimeout(() => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(buildMockMemoryPatch(clientName)));
          }, 600);
        } catch {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'MOCK_ERROR', message: 'Mock AI error' }));
        }
      });
    },
  };
}