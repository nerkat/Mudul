// src/core/widgets/paper/PaperRenderer.tsx
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

type Props = { slug: string; title?: string; data: any; params?: any };

// Simple text sanitization to prevent HTML injection in paper mode
function sanitizeText(text: string): string {
  if (typeof text !== 'string') return String(text);
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Safe text renderer that uses text nodes only (no HTML injection risk)
function SafeText({ children, ...props }: { children: string } & any) {
  // Use text nodes only - no dangerouslySetInnerHTML to prevent any HTML injection
  return <Box {...props}>{sanitizeText(children)}</Box>;
}

// Deterministic JSON stringifier with sorted keys and circular detection
function stableStringify(input: unknown, seen = new WeakSet(), depth = 0): string {
  // Depth guard to prevent stack overflow
  if (depth > 10) return '"[Max Depth Exceeded]"';
  
  // Handle primitive types first
  if (input === null) return 'null';
  if (input === undefined) return 'undefined';
  
  // Handle special number values
  if (typeof input === 'number') {
    if (Number.isNaN(input)) return '"NaN"';
    if (input === Infinity) return '"Infinity"';
    if (input === -Infinity) return '"-Infinity"';
    return JSON.stringify(input);
  }
  
  // Handle bigint
  if (typeof input === 'bigint') {
    return `"${input.toString()}"`;
  }
  
  // Handle dates
  if (input instanceof Date) {
    return `"${input.toISOString()}"`;
  }
  
  // Handle Map and Set
  if (input instanceof Map) {
    const entries = Array.from(input.entries()).sort(([a], [b]) => String(a).localeCompare(String(b)));
    return stableStringify(entries, seen, depth + 1);
  }
  
  if (input instanceof Set) {
    const values = Array.from(input).sort((a, b) => String(a).localeCompare(String(b)));
    return stableStringify(values, seen, depth + 1);
  }
  
  // Handle other primitives
  if (typeof input !== 'object') return JSON.stringify(input);
  
  // Circular reference detection
  if (seen.has(input as object)) return '"[Circular]"';
  seen.add(input as object);
  
  // Handle arrays
  if (Array.isArray(input)) {
    const items = input.map(item => stableStringify(item, seen, depth + 1));
    return `[${items.join(', ')}]`;
  }
  
  // Handle objects with sorted keys, omitting undefined values
  const obj = input as Record<string, unknown>;
  const sortedKeys = Object.keys(obj)
    .filter(key => obj[key] !== undefined) // Omit undefined keys
    .sort();
  const pairs = sortedKeys.map(key => `"${key}": ${stableStringify(obj[key], seen, depth + 1)}`);
  return `{${pairs.join(', ')}}`;
}

export function PaperRenderer({ slug, title, data }: Props) {
  // registry of widget → plaintext render
  const R = paperMap[slug] ?? DefaultPaper;
  
  return (
    <Paper 
      className="paper-widget"
      sx={{ p: 2, mb: 2 }}
      role="article"
      aria-labelledby={`paper-${slug}-heading`}
    >
      <Typography 
        variant="subtitle2" 
        component="h3"
        id={`paper-${slug}-heading`}
        sx={{ opacity: .75, mb: 1 }}
      >
        {title ?? slug}
      </Typography>
      <R data={data} />
    </Paper>
  );
}

function DefaultPaper({ data }: { data: any }) {
  return (
    <Box 
      component="pre" 
      sx={{ 
        m: 0, 
        whiteSpace: 'pre-wrap', 
        wordBreak: 'break-word', 
        fontFamily: 'monospace', 
        fontSize: '0.75rem' 
      }}
      role="code"
      aria-label="JSON data representation"
    >
      {stableStringify(data ?? {})}
    </Box>
  );
}

const paperMap: Record<string, (p:{data:any})=>React.ReactElement> = {
  summary: ({ data }) => (
    <SafeText 
      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
      role="text"
      aria-label="Call summary"
    >
      {data?.text || "—"}
    </SafeText>
  ),
  
  sentiment: ({ data }) => (
    <Box 
      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
      role="text"
      aria-label="Sentiment analysis"
    >
      Overall: {sanitizeText(data?.label || "")} | Score: {data?.score ?? 0}
    </Box>
  ),
  
  booking: ({ data }) => (
    <Box 
      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
      role="text"
      aria-label="Booking likelihood"
    >
      Likelihood: {data?.value ?? 0}%
    </Box>
  ),
  
  objections: ({ data }) => (
    <Box 
      component="div"
      role="list"
      aria-label="Customer objections"
    >
      <Typography variant="caption" component="div" sx={{ mb: 1, opacity: 0.7 }}>
        Objections ({(data?.items ?? []).length}):
      </Typography>
      {(data?.items ?? []).length === 0 ? (
        <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', fontStyle: 'italic' }}>
          No objections recorded
        </Box>
      ) : (
        <Box component="ul" sx={{ pl: 2, m: 0, fontFamily: 'monospace', fontSize: '0.875rem' }}>
          {(data?.items ?? []).slice(0, 50).map((o: any, i: number) => (
            <li key={i} role="listitem">
              <strong>{sanitizeText(o.type || "")}</strong>: "{sanitizeText(o.quote || "")}" @{o.ts}
            </li>
          ))}
          {(data?.items ?? []).length > 50 && (
            <li style={{ fontStyle: 'italic', color: '#666' }}>
              +{(data?.items ?? []).length - 50} more objections...
            </li>
          )}
        </Box>
      )}
    </Box>
  ),
  
  actionItems: ({ data }) => (
    <Box 
      component="div"
      role="list"
      aria-label="Action items"
    >
      <Typography variant="caption" component="div" sx={{ mb: 1, opacity: 0.7 }}>
        Action Items ({(data?.items ?? []).length}):
      </Typography>
      {(data?.items ?? []).length === 0 ? (
        <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', fontStyle: 'italic' }}>
          No action items
        </Box>
      ) : (
        <Box component="ul" sx={{ pl: 2, m: 0, fontFamily: 'monospace', fontSize: '0.875rem' }}>
          {(data?.items ?? []).slice(0, 50).map((a: any, i: number) => (
            <li key={i} role="listitem">
              {a.owner ? `${sanitizeText(a.owner)}: ` : ""}{sanitizeText(a.text || "")}{a.due ? ` (due ${a.due})` : ""}
            </li>
          ))}
          {(data?.items ?? []).length > 50 && (
            <li style={{ fontStyle: 'italic', color: '#666' }}>
              +{(data?.items ?? []).length - 50} more action items...
            </li>
          )}
        </Box>
      )}
    </Box>
  ),
  
  keyMoments: ({ data }) => (
    <Box 
      component="div"
      role="list"
      aria-label="Key moments"
    >
      <Typography variant="caption" component="div" sx={{ mb: 1, opacity: 0.7 }}>
        Key Moments ({(data?.items ?? []).length}):
      </Typography>
      {(data?.items ?? []).length === 0 ? (
        <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', fontStyle: 'italic' }}>
          No key moments captured
        </Box>
      ) : (
        <Box component="ul" sx={{ pl: 2, m: 0, fontFamily: 'monospace', fontSize: '0.875rem' }}>
          {(data?.items ?? []).slice(0, 50).map((k: any, i: number) => (
            <li key={i} role="listitem">
              {sanitizeText(k.label || "")} @{k.ts}
            </li>
          ))}
          {(data?.items ?? []).length > 50 && (
            <li style={{ fontStyle: 'italic', color: '#666' }}>
              +{(data?.items ?? []).length - 50} more key moments...
            </li>
          )}
        </Box>
      )}
    </Box>
  ),
  
  entities: ({ data }) => (
    <Box 
      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
      role="text"
      aria-label="Detected entities"
    >
      <div><strong>Prospect:</strong> {(data?.entities?.prospect ?? []).map(sanitizeText).join(", ") || "—"}</div>
      <div><strong>People:</strong> {(data?.entities?.people ?? []).map(sanitizeText).join(", ") || "—"}</div>
      <div><strong>Products:</strong> {(data?.entities?.products ?? []).map(sanitizeText).join(", ") || "—"}</div>
    </Box>
  ),
  
  compliance: ({ data }) => (
    <Box 
      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
      role="text"
      aria-label="Compliance flags"
    >
      <strong>Compliance:</strong> {(data?.complianceFlags ?? []).length > 0 ? 
        (data.complianceFlags ?? []).map(sanitizeText).join(", ") : "None"}
    </Box>
  ),
  
  pieChart: ({ data }) => (
    <Box 
      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
      role="text"
      aria-label="Chart data"
    >
      <strong>Chart Data:</strong> {(data?.data ?? []).length} items (height: {data?.height ?? 240}px)
    </Box>
  ),
  
  // Error renderer for missing widgets/adapters
  error: ({ data }) => (
    <Box 
      className="paper-error"
      sx={{ 
        fontFamily: 'monospace', 
        fontSize: '0.875rem',
        p: 2,
        backgroundColor: '#fff2f0',
        border: '1px solid #ffccc7',
        borderRadius: 1,
        color: '#a8071a'
      }}
      role="alert"
      aria-label="Widget error"
    >
      <div><strong>⚠️ ERROR:</strong> {sanitizeText(data?.error || "Unknown error")}</div>
      {data?.widget && <div><strong>Widget:</strong> {sanitizeText(data.widget)}</div>}
      {data?.type && <div><strong>Type:</strong> {sanitizeText(data.type)}</div>}
    </Box>
  ),

  // Org dashboard renderers
  clientStats: ({ data }) => (
    <Box
      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
      role="text"
      aria-label="Client statistics"
    >
      <div><strong>Total Clients:</strong> {data?.totalClients ?? 0}</div>
      <div><strong>Active Clients:</strong> {data?.activeClients ?? 0}</div>
      <div><strong>Recent Activity:</strong></div>
      {(data?.clients ?? []).slice(0, 3).map((client: any, i: number) => (
        <div key={i} style={{ marginLeft: '16px' }}>
          • {sanitizeText(client.name)}: {client.callCount} calls (last: {client.lastActivity})
        </div>
      ))}
    </Box>
  ),

  activitySummary: ({ data }) => (
    <Box
      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
      role="text"
      aria-label="Activity summary"
    >
      <div><strong>Total Calls:</strong> {data?.totalCalls ?? 0}</div>
      <div><strong>Recent Calls:</strong> {data?.recentCalls ?? 0}</div>
      <div><strong>Avg Sentiment:</strong> {data?.avgSentiment ?? 0}</div>
      <div><strong>Trends:</strong> {sanitizeText(data?.trends || "No data")}</div>
    </Box>
  ),

  healthSignals: ({ data }) => (
    <Box
      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
      role="text"
      aria-label="Health signals"
    >
      <div><strong>Status:</strong> {sanitizeText(data?.status || "Unknown")}</div>
      <div><strong>Avg Booking:</strong> {Math.round((data?.avgBookingLikelihood ?? 0) * 100)}%</div>
      <div><strong>Open Objections:</strong> {data?.openObjections ?? 0}</div>
      <div><strong>Pending Actions:</strong> {data?.pendingActions ?? 0}</div>
    </Box>
  ),

  // Client dashboard renderers
  recentCalls: ({ data }) => (
    <Box
      component="div"
      role="list"
      aria-label="Recent calls"
    >
      <Typography variant="caption" component="div" sx={{ mb: 1, opacity: 0.7 }}>
        Recent Calls ({(data?.calls ?? []).length}):
      </Typography>
      {(data?.calls ?? []).length === 0 ? (
        <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', fontStyle: 'italic' }}>
          No calls recorded
        </Box>
      ) : (
        <Box component="ul" sx={{ pl: 2, m: 0, fontFamily: 'monospace', fontSize: '0.875rem' }}>
          {(data?.calls ?? []).map((call: any, i: number) => (
            <li key={i} role="listitem">
              {sanitizeText(call.name)} ({call.date}) - {call.sentiment} - {Math.round(call.bookingLikelihood * 100)}%
            </li>
          ))}
        </Box>
      )}
    </Box>
  ),

  followUps: ({ data }) => (
    <Box
      component="div"
      role="list"
      aria-label="Follow-up items"
    >
      <Typography variant="caption" component="div" sx={{ mb: 1, opacity: 0.7 }}>
        Follow-ups ({(data?.items ?? []).length}):
      </Typography>
      {(data?.items ?? []).length === 0 ? (
        <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', fontStyle: 'italic' }}>
          No follow-ups
        </Box>
      ) : (
        <Box component="ul" sx={{ pl: 2, m: 0, fontFamily: 'monospace', fontSize: '0.875rem' }}>
          {(data?.items ?? []).map((item: any, i: number) => (
            <li key={i} role="listitem">
              <strong>{sanitizeText(item.owner)}</strong>: {sanitizeText(item.text)}
              {item.due && <span> (due {item.due})</span>}
              <span style={{ opacity: 0.7 }}> [{sanitizeText(item.source)}]</span>
            </li>
          ))}
        </Box>
      )}
    </Box>
  ),

  clientKPIs: ({ data }) => (
    <Box
      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
      role="text"
      aria-label="Client KPIs"
    >
      <div><strong>Total Calls:</strong> {data?.totalCalls ?? 0}</div>
      <div><strong>Avg Sentiment:</strong> {data?.avgSentiment ?? 0}</div>
      <div><strong>Conversion Rate:</strong> {Math.round((data?.conversionRate ?? 0) * 100)}%</div>
      <div><strong>Last Activity:</strong> {sanitizeText(data?.lastActivity || "Unknown")}</div>
    </Box>
  ),
};