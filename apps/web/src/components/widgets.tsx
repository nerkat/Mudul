import type { SalesCallMinimal } from "../core/types";
import { PaperCard } from "../widgets/shared/PaperCard";
import { Box, Typography, Paper as MuiPaper, Chip, List, ListItem, ListItemText, useTheme } from '@mui/material';

// Explicit minimal widget props - only the fields each widget actually uses
export type SummaryWidgetProps = {
  data: Partial<Pick<SalesCallMinimal, "summary">>;
};

export type SentimentWidgetProps = {
  data: Partial<Pick<SalesCallMinimal, "sentiment">>;
};

export type BookingWidgetProps = {
  data: Partial<Pick<SalesCallMinimal, "bookingLikelihood">>;
};

export type ObjectionsWidgetProps = {
  data: Partial<Pick<SalesCallMinimal, "objections">>;
};

export type ActionItemsWidgetProps = {
  data: Partial<Pick<SalesCallMinimal, "actionItems">>;
};

export type KeyMomentsWidgetProps = {
  data: Partial<Pick<SalesCallMinimal, "keyMoments">>;
};

export type EntitiesWidgetProps = {
  data: Partial<Pick<SalesCallMinimal, "entities">>;
};

export type ComplianceWidgetProps = {
  data: Partial<Pick<SalesCallMinimal, "complianceFlags">>;
};

// Legacy type for backward compatibility
export type WidgetProps = { data: SalesCallMinimal };

// PAPER (unstyled)
export const Paper = {
  Summary: ({ data }: SummaryWidgetProps) => (
    <PaperCard title="Summary">
      {data.summary ?? "No summary"}
    </PaperCard>
  ),
  
  Sentiment: ({ data }: SentimentWidgetProps) => (
    <PaperCard title="Sentiment">
      Overall: {data.sentiment?.overall ?? "-"} | Score: {data.sentiment?.score ?? "-"}
    </PaperCard>
  ),
  
  Booking: ({ data }: BookingWidgetProps) => (
    <PaperCard title="Booking Likelihood">
      {data.bookingLikelihood ?? "-"}
    </PaperCard>
  ),
  
  Objections: ({ data }: ObjectionsWidgetProps) => (
    <PaperCard title="Objections">
      {data.objections?.length
        ? data.objections.map((o: { type: string; quote: string; ts?: string }, i: number) => (
            <div key={i}>
              <em>{o.type}</em>: "{o.quote}" {o.ts ? `@ ${o.ts}` : ''}
            </div>
          ))
        : "None"}
    </PaperCard>
  ),
  
  ActionItems: ({ data }: ActionItemsWidgetProps) => (
    <PaperCard title="Action Items">
      {data.actionItems?.length
        ? data.actionItems.map((a: { owner: string; text: string; due?: string | null }, i: number) => (
            <div key={i}>
              {a.owner}: {a.text}{a.due ? ` (due ${a.due})` : ""}
            </div>
          ))
        : "None"}
    </PaperCard>
  ),
  
  KeyMoments: ({ data }: KeyMomentsWidgetProps) => (
    <PaperCard title="Key Moments">
      {data.keyMoments?.length
        ? data.keyMoments.map((k: { label: string; ts?: string }, i: number) => (
            <div key={i}>
              {k.label} {k.ts ? `@ ${k.ts}` : ''}
            </div>
          ))
        : "None"}
    </PaperCard>
  ),
  
  Entities: ({ data }: EntitiesWidgetProps) => (
    <PaperCard title="Entities">
      <div>Prospect: {data.entities?.prospect?.join(", ") || "-"}</div>
      <div>People: {data.entities?.people?.join(", ") || "-"}</div>
      <div>Products: {data.entities?.products?.join(", ") || "-"}</div>
    </PaperCard>
  ),
  
  Compliance: ({ data }: ComplianceWidgetProps) => (
    <PaperCard title="Compliance Flags">
      {data.complianceFlags?.length ? data.complianceFlags.join(", ") : "None"}
    </PaperCard>
  ),
};

// RICH (styled widgets using MUI components)
export const Rich = {
  Summary: ({ data }: SummaryWidgetProps) => {
    const theme = useTheme();
    
    if (!data.summary) {
      return (
        <MuiPaper 
          sx={{ 
            p: theme.spacing(2), 
            borderRadius: theme.shape.borderRadius,
            color: theme.palette.text.secondary 
          }}
        >
          No summary yet
        </MuiPaper>
      );
    }
    
    return (
      <MuiPaper sx={{ p: theme.spacing(2), borderRadius: theme.shape.borderRadius }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium', mb: theme.spacing(1) }}>
          Summary
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          {data.summary}
        </Typography>
      </MuiPaper>
    );
  },
  
  Sentiment: ({ data }: SentimentWidgetProps) => {
    const theme = useTheme();
    return (
      <MuiPaper sx={{ p: theme.spacing(2), borderRadius: theme.shape.borderRadius }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium', mb: theme.spacing(1) }}>
          Sentiment
        </Typography>
        <Box sx={{ display: 'flex', gap: theme.spacing(2) }}>
          <Typography variant="body2">
            Overall: {data.sentiment?.overall ?? "-"}
          </Typography>
          <Typography variant="body2">
            Score: {data.sentiment?.score ?? "-"}
          </Typography>
        </Box>
      </MuiPaper>
    );
  },
  
  Booking: ({ data }: BookingWidgetProps) => {
    const theme = useTheme();
    return (
      <MuiPaper sx={{ p: theme.spacing(2), borderRadius: theme.shape.borderRadius }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium', mb: theme.spacing(1) }}>
          Booking Likelihood
        </Typography>
        <Typography variant="body2">
          {data.bookingLikelihood ?? "-"}
        </Typography>
      </MuiPaper>
    );
  },
  
  Objections: ({ data }: ObjectionsWidgetProps) => {
    const theme = useTheme();
    return (
      <MuiPaper sx={{ p: theme.spacing(2), borderRadius: theme.shape.borderRadius }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium', mb: theme.spacing(1) }}>
          Objections
        </Typography>
        {data.objections?.length ? (
          <List dense disablePadding>
            {data.objections.map((o: { type: string; quote: string; ts?: string }, i: number) => (
              <ListItem key={i} disablePadding>
                <ListItemText
                  primary={
                    <Box component="span">
                      <Chip 
                        label={o.type} 
                        size="small" 
                        sx={{ mr: theme.spacing(1) }}
                      />
                      "{o.quote}"
                      {o.ts && (
                        <Typography 
                          component="span" 
                          variant="caption" 
                          sx={{ ml: theme.spacing(1), color: theme.palette.text.secondary }}
                        >
                          @ {o.ts}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">None</Typography>
        )}
      </MuiPaper>
    );
  },
  
  ActionItems: ({ data }: ActionItemsWidgetProps) => {
    const theme = useTheme();
    return (
      <MuiPaper sx={{ p: theme.spacing(2), borderRadius: theme.shape.borderRadius }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium', mb: theme.spacing(1) }}>
          Action Items
        </Typography>
        {data.actionItems?.length ? (
          <List dense disablePadding>
            {data.actionItems.map((a: { owner: string; text: string; due?: string | null }, i: number) => (
              <ListItem key={i} disablePadding>
                <ListItemText
                  primary={
                    <Box>
                      <Chip 
                        label={a.owner} 
                        size="small" 
                        sx={{ mr: theme.spacing(1) }}
                      />
                      {a.text}
                      {a.due && (
                        <Typography 
                          component="span" 
                          variant="caption" 
                          sx={{ ml: theme.spacing(1), color: theme.palette.warning.main }}
                        >
                          (due {a.due})
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">None</Typography>
        )}
      </MuiPaper>
    );
  },
  
  KeyMoments: ({ data }: KeyMomentsWidgetProps) => {
    const theme = useTheme();
    return (
      <MuiPaper sx={{ p: theme.spacing(2), borderRadius: theme.shape.borderRadius }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium', mb: theme.spacing(1) }}>
          Key Moments
        </Typography>
        {data.keyMoments?.length ? (
          <List dense disablePadding>
            {data.keyMoments.map((k: { label: string; ts?: string }, i: number) => (
              <ListItem key={i} disablePadding>
                <ListItemText
                  primary={
                    <Box>
                      {k.label}
                      {k.ts && (
                        <Typography 
                          component="span" 
                          variant="caption" 
                          sx={{ ml: theme.spacing(1), color: theme.palette.text.secondary }}
                        >
                          @ {k.ts}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">None</Typography>
        )}
      </MuiPaper>
    );
  },
  
  Entities: ({ data }: EntitiesWidgetProps) => {
    const theme = useTheme();
    return (
      <MuiPaper sx={{ p: theme.spacing(2), borderRadius: theme.shape.borderRadius }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium', mb: theme.spacing(1) }}>
          Entities
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing(1) }}>
          <Box>
            <Typography variant="body2" component="span" sx={{ fontWeight: 'medium' }}>
              Prospect:
            </Typography>
            <Typography variant="body2" component="span" sx={{ ml: theme.spacing(1) }}>
              {data.entities?.prospect?.join(", ") || "-"}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" component="span" sx={{ fontWeight: 'medium' }}>
              People:
            </Typography>
            <Typography variant="body2" component="span" sx={{ ml: theme.spacing(1) }}>
              {data.entities?.people?.join(", ") || "-"}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" component="span" sx={{ fontWeight: 'medium' }}>
              Products:
            </Typography>
            <Typography variant="body2" component="span" sx={{ ml: theme.spacing(1) }}>
              {data.entities?.products?.join(", ") || "-"}
            </Typography>
          </Box>
        </Box>
      </MuiPaper>
    );
  },
  
  Compliance: ({ data }: ComplianceWidgetProps) => {
    const theme = useTheme();
    return (
      <MuiPaper sx={{ p: theme.spacing(2), borderRadius: theme.shape.borderRadius }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium', mb: theme.spacing(1) }}>
          Compliance Flags
        </Typography>
        {data.complianceFlags?.length ? (
          <Box sx={{ display: 'flex', gap: theme.spacing(1), flexWrap: 'wrap' }}>
            {data.complianceFlags.map((flag, i) => (
              <Chip 
                key={i}
                label={flag}
                color="warning"
                size="small"
              />
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">None</Typography>
        )}
      </MuiPaper>
    );
  },
};