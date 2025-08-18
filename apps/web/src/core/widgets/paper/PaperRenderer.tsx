// src/core/widgets/paper/PaperRenderer.tsx
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

type Props = { slug: string; title?: string; data: any; params?: any };

export function PaperRenderer({ slug, title, data }: Props) {
  // registry of widget → plaintext render
  const R = paperMap[slug] ?? DefaultPaper;
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" sx={{ opacity: .75, mb: 1 }}>
        {title ?? slug}
      </Typography>
      <R data={data} />
    </Paper>
  );
}

function DefaultPaper({ data }: { data: any }) {
  return (
    <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '0.75rem' }}>
      {JSON.stringify(data ?? {}, null, 2)}
    </Box>
  );
}

const paperMap: Record<string, (p:{data:any})=>React.ReactElement> = {
  summary: ({ data }) => <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{data?.text || "—"}</Box>,
  sentiment: ({ data }) => <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>Overall: {data?.label} | Score: {data?.score ?? 0}</Box>,
  booking: ({ data }) => <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{data?.value ?? 0}</Box>,
  objections: ({ data }) => (
    <Box component="ul" sx={{ pl: 2, m: 0, fontFamily: 'monospace', fontSize: '0.875rem' }}>
      {(data?.items ?? []).map((o: any, i: number) =>
        <li key={i}><b>{o.type}</b>: "{o.quote}" @{o.ts}</li>
      )}
    </Box>
  ),
  actionItems: ({ data }) => (
    <Box component="ul" sx={{ pl: 2, m: 0, fontFamily: 'monospace', fontSize: '0.875rem' }}>
      {(data?.items ?? []).map((a: any, i: number) =>
        <li key={i}>{a.owner ? `${a.owner}: ` : ""}{a.text}{a.due ? ` (due ${a.due})` : ""}</li>
      )}
    </Box>
  ),
  keyMoments: ({ data }) => (
    <Box component="ul" sx={{ pl: 2, m: 0, fontFamily: 'monospace', fontSize: '0.875rem' }}>
      {(data?.items ?? []).map((k: any, i: number) =>
        <li key={i}>{k.label} @{k.ts}</li>
      )}
    </Box>
  ),
  entities: ({ data }) => (
    <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
      <div>Prospect: {data?.entities?.prospect?.join(", ") || "—"}</div>
      <div>People: {data?.entities?.people?.join(", ") || "—"}</div>
      <div>Products: {data?.entities?.products?.join(", ") || "—"}</div>
    </Box>
  ),
  compliance: ({ data }) => (
    <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
      {data?.complianceFlags?.length ? data.complianceFlags.join(", ") : "None"}
    </Box>
  ),
  pieChart: ({ data }) => (
    <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
      Chart data: {JSON.stringify(data)}
    </Box>
  ),
};