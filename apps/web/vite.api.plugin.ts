import type { Plugin } from "vite";
import { validateSalesCall, type SalesCall } from "@mudul/protocol";
import rawSample from "./fixtures/sales-call.sample.json";

const sample = rawSample as SalesCall;

// Create different analysis data for different sessions
const getAnalysisForSession = (sessionId: string): SalesCall => {
  const baseAnalysis = { ...sample };
  
  switch (sessionId) {
    case "session-001":
      return {
        ...baseAnalysis,
        summary: "Great call with potential customer interested in our Enterprise package. They have budget and timeline fits well.",
        sentiment: { overall: "positive", score: 0.85 },
        bookingLikelihood: 0.75,
        objections: [{ type: "price", quote: "The price seems a bit high for our current budget", ts: "00:12:45" }],
        actionItems: [
          { owner: "sales_rep", text: "Send pricing proposal with discount options", due: "2024-01-15" },
          { owner: "prospect", text: "Review proposal with team", due: "2024-01-20" }
        ],
        keyMoments: [
          { label: "Budget Discussion", ts: "00:12:30" },
          { label: "Decision Timeline", ts: "00:18:15" }
        ],
        entities: { 
          prospect: ["ACME Corp"], 
          people: ["John Smith", "Sarah Johnson"], 
          products: ["Enterprise Package", "Analytics Module"] 
        }
      };
      
    case "session-002":
      return {
        ...baseAnalysis,
        summary: "Follow-up call to address pricing concerns. Customer showing strong interest and moving toward decision.",
        sentiment: { overall: "positive", score: 0.92 },
        bookingLikelihood: 0.85,
        objections: [],
        actionItems: [
          { owner: "sales_rep", text: "Prepare final contract", due: "2024-01-18" },
          { owner: "prospect", text: "Get legal approval", due: "2024-01-25" }
        ],
        keyMoments: [
          { label: "Pricing Agreement", ts: "00:08:20" },
          { label: "Next Steps", ts: "00:15:10" }
        ],
        entities: { 
          prospect: ["ACME Corp"], 
          people: ["John Smith", "Sarah Johnson", "Mike Wilson"], 
          products: ["Enterprise Package"] 
        }
      };
      
    case "session-003":
      return {
        ...baseAnalysis,
        summary: "Initial discovery call with Globex. They need a solution for their analytics needs but timeline is unclear.",
        sentiment: { overall: "neutral", score: 0.60 },
        bookingLikelihood: 0.45,
        objections: [
          { type: "timeline", quote: "We're not sure when we'd be ready to implement", ts: "00:20:30" },
          { type: "budget", quote: "Need to understand total cost of ownership", ts: "00:25:15" }
        ],
        actionItems: [
          { owner: "sales_rep", text: "Send case studies and ROI calculator", due: "2024-01-16" },
          { owner: "prospect", text: "Discuss internally and provide feedback", due: "2024-01-23" }
        ],
        keyMoments: [
          { label: "Pain Points Discussion", ts: "00:15:45" },
          { label: "Feature Demo", ts: "00:30:20" }
        ],
        entities: { 
          prospect: ["Globex Corporation"], 
          people: ["Alex Chen", "Lisa Park"], 
          products: ["Analytics Suite", "Pro Plan"] 
        }
      };
      
    case "session-004":
      return {
        ...baseAnalysis,
        summary: "Globex follow-up call. They've reviewed our proposal and are interested in moving forward with a pilot program.",
        sentiment: { overall: "positive", score: 0.78 },
        bookingLikelihood: 0.65,
        objections: [
          { type: "scope", quote: "Can we start with a smaller pilot first?", ts: "00:10:15" }
        ],
        actionItems: [
          { owner: "sales_rep", text: "Create pilot program proposal", due: "2024-01-20" },
          { owner: "prospect", text: "Review pilot scope with technical team", due: "2024-01-27" }
        ],
        keyMoments: [
          { label: "Pilot Discussion", ts: "00:10:00" },
          { label: "Technical Requirements", ts: "00:22:30" }
        ],
        entities: { 
          prospect: ["Globex Corporation"], 
          people: ["Alex Chen", "Lisa Park", "Tom Rodriguez"], 
          products: ["Analytics Suite"] 
        }
      };
      
    case "session-005":
      return {
        ...baseAnalysis,
        summary: "Initech discovery call. Early stage company looking for cost-effective solution. Price sensitivity is high.",
        sentiment: { overall: "neutral", score: 0.55 },
        bookingLikelihood: 0.30,
        objections: [
          { type: "budget", quote: "We're a startup and need to be very cost-conscious", ts: "00:08:20" },
          { type: "features", quote: "Do we really need all these features?", ts: "00:15:45" }
        ],
        actionItems: [
          { owner: "sales_rep", text: "Prepare startup pricing options", due: "2024-01-17" },
          { owner: "prospect", text: "Define minimum feature requirements", due: "2024-01-24" }
        ],
        keyMoments: [
          { label: "Budget Constraints", ts: "00:08:00" },
          { label: "Feature Prioritization", ts: "00:15:30" }
        ],
        entities: { 
          prospect: ["Initech"], 
          people: ["Peter Gibbons", "Michael Bolton"], 
          products: ["Starter Plan"] 
        }
      };
      
    default:
      return baseAnalysis;
  }
};

export default function apiPlugin(): Plugin {
  return {
    name: "dev-mock-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        const m = url.match(/^\/api\/sessions\/([^/]+)\/analysis$/);
        if (!m) return next();
        const sessionId = decodeURIComponent(m[1]);

        // Get analysis data for the session
        const analysisData = getAnalysisForSession(sessionId);
        
        // If we don't have data for this session, return 404
        if (!analysisData || (sessionId !== "session-001" && sessionId !== "session-002" && sessionId !== "session-003" && sessionId !== "session-004" && sessionId !== "session-005")) {
          res.statusCode = 404;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "not_found" }));
          return;
        }

        // validation
        const result = validateSalesCall(analysisData);
        if (!result.success) {
          const issues = result.errors.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }));
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "invalid_schema", issues }));
          return;
        }

        res.statusCode = 200;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(result.data));
      });
    }
  };
}