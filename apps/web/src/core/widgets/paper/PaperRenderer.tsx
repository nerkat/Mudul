// src/core/widgets/paper/PaperRenderer.tsx
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

type Props = { slug: string; title?: string; data: any; params?: any };

// Deterministic JSON stringifier with sorted keys
function stableStringify(obj: any): string {
  if (obj === null) return 'null';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(', ')}]`;
  
  const sorted = Object.keys(obj).sort();
  const pairs = sorted.map(key => `"${key}": ${stableStringify(obj[key])}`);
  return `{${pairs.join(', ')}}`;
}

export function PaperRenderer({ slug, title, data }: Props) {
  // registry of widget → plaintext render
  const R = paperMap[slug] ?? DefaultPaper;
  
  return (
    <Paper 
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
    <Box 
      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
      role="text"
      aria-label="Call summary"
    >
      {data?.text || "—"}
    </Box>
  ),
  
  sentiment: ({ data }) => (
    <Box 
      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
      role="text"
      aria-label="Sentiment analysis"
    >
      Overall: {data?.label} | Score: {data?.score ?? 0}
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
          {(data?.items ?? []).map((o: any, i: number) => (
            <li key={i} role="listitem">
              <strong>{o.type}</strong>: "{o.quote}" @{o.ts}
            </li>
          ))}
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
          {(data?.items ?? []).map((a: any, i: number) => (
            <li key={i} role="listitem">
              {a.owner ? `${a.owner}: ` : ""}{a.text}{a.due ? ` (due ${a.due})` : ""}
            </li>
          ))}
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
          {(data?.items ?? []).map((k: any, i: number) => (
            <li key={i} role="listitem">
              {k.label} @{k.ts}
            </li>
          ))}
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
      <div><strong>Prospect:</strong> {data?.entities?.prospect?.join(", ") || "—"}</div>
      <div><strong>People:</strong> {data?.entities?.people?.join(", ") || "—"}</div>
      <div><strong>Products:</strong> {data?.entities?.products?.join(", ") || "—"}</div>
    </Box>
  ),
  
  compliance: ({ data }) => (
    <Box 
      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
      role="text"
      aria-label="Compliance flags"
    >
      <strong>Compliance:</strong> {(data?.complianceFlags ?? []).length > 0 ? data.complianceFlags.join(", ") : "None"}
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
};