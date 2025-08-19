import type { SalesCallMinimal } from "../core/types";
import { PaperCard } from "../widgets/shared/PaperCard";
import { Box, Typography, Paper as MuiPaper, Chip, List, ListItem, ListItemText, useTheme } from '@mui/material';
import { getSentimentColor } from "../shared/sentimentUtils";

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

// New widget prop types for org and client dashboards
export type ClientStatsWidgetProps = {
  data: { totalClients: number; activeClients: number; clients: Array<{ name: string; callCount: number; lastActivity: string }> };
};

export type ActivitySummaryWidgetProps = {
  data: { totalCalls: number; recentCalls: number; avgSentiment: number; trends: string };
};

export type HealthSignalsWidgetProps = {
  data: { avgBookingLikelihood: number; openObjections: number; pendingActions: number; status: string };
};

export type RecentCallsWidgetProps = {
  data: { calls: Array<{ id: string; name: string; date: string; sentiment: string; bookingLikelihood: number }> };
};

export type FollowUpsWidgetProps = {
  data: { items: Array<{ text: string; due: string | null; owner: string; source: string }> };
};

export type ClientKPIsWidgetProps = {
  data: { avgSentiment: number; totalCalls: number; conversionRate: number; lastActivity: string };
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

  // Org dashboard widgets
  ClientStats: ({ data }: ClientStatsWidgetProps) => (
    <PaperCard title="Client Overview">
      <div>Total Clients: {data.totalClients}</div>
      <div>Active Clients: {data.activeClients}</div>
      <div>Recent Activity:</div>
      {data.clients.slice(0, 3).map((client, i) => (
        <div key={i}>• {client.name}: {client.callCount} calls (last: {client.lastActivity})</div>
      ))}
    </PaperCard>
  ),

  ActivitySummary: ({ data }: ActivitySummaryWidgetProps) => (
    <PaperCard title="Activity Summary">
      <div>Total Calls: {data.totalCalls}</div>
      <div>Recent Calls: {data.recentCalls}</div>
      <div>Avg Sentiment: {data.avgSentiment}</div>
      <div>Trends: {data.trends}</div>
    </PaperCard>
  ),

  HealthSignals: ({ data }: HealthSignalsWidgetProps) => (
    <PaperCard title="Health Signals">
      <div>Status: {data.status}</div>
      <div>Avg Booking: {data.avgBookingLikelihood}</div>
      <div>Open Objections: {data.openObjections}</div>
      <div>Pending Actions: {data.pendingActions}</div>
    </PaperCard>
  ),

  // Client dashboard widgets
  RecentCalls: ({ data }: RecentCallsWidgetProps) => (
    <PaperCard title="Recent Calls">
      {data.calls.length ? data.calls.map((call, i) => (
        <div key={i}>
          {call.name} ({call.date}) - {call.sentiment} - {Math.round(call.bookingLikelihood * 100)}%
        </div>
      )) : "No calls"}
    </PaperCard>
  ),

  FollowUps: ({ data }: FollowUpsWidgetProps) => (
    <PaperCard title="Follow-ups">
      {data.items.length ? data.items.map((item, i) => (
        <div key={i}>
          {item.owner}: {item.text} {item.due ? `(due ${item.due})` : ""} [{item.source}]
        </div>
      )) : "No follow-ups"}
    </PaperCard>
  ),

  ClientKPIs: ({ data }: ClientKPIsWidgetProps) => (
    <PaperCard title="Client KPIs">
      <div>Total Calls: {data.totalCalls}</div>
      <div>Avg Sentiment: {data.avgSentiment}</div>
      <div>Conversion Rate: {data.conversionRate}</div>
      <div>Last Activity: {data.lastActivity}</div>
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

  // Org dashboard widgets
  ClientStats: ({ data }: ClientStatsWidgetProps) => {
    const theme = useTheme();
    return (
      <MuiPaper sx={{ p: theme.spacing(2), borderRadius: theme.shape.borderRadius }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium', mb: theme.spacing(1) }}>
          Client Overview
        </Typography>
        <Box sx={{ display: 'flex', gap: theme.spacing(3), mb: theme.spacing(2) }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
              {data.totalClients}
            </Typography>
            <Typography variant="caption" color="text.secondary">Total Clients</Typography>
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
              {data.activeClients}
            </Typography>
            <Typography variant="caption" color="text.secondary">Active</Typography>
          </Box>
        </Box>
        <Typography variant="subtitle2" sx={{ mb: theme.spacing(1) }}>Recent Activity:</Typography>
        <List dense disablePadding>
          {data.clients.slice(0, 3).map((client, i) => (
            <ListItem key={i} disablePadding>
              <ListItemText
                primary={client.name}
                secondary={`${client.callCount} calls • Last: ${client.lastActivity}`}
              />
            </ListItem>
          ))}
        </List>
      </MuiPaper>
    );
  },

  ActivitySummary: ({ data }: ActivitySummaryWidgetProps) => {
    const theme = useTheme();
    return (
      <MuiPaper sx={{ p: theme.spacing(2), borderRadius: theme.shape.borderRadius }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium', mb: theme.spacing(1) }}>
          Activity Summary
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing(2) }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{data.totalCalls}</Typography>
            <Typography variant="caption" color="text.secondary">Total Calls</Typography>
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{data.recentCalls}</Typography>
            <Typography variant="caption" color="text.secondary">Recent Calls</Typography>
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{data.avgSentiment}</Typography>
            <Typography variant="caption" color="text.secondary">Avg Sentiment</Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ gridColumn: 'span 2', mt: theme.spacing(1) }}>
              {data.trends}
            </Typography>
          </Box>
        </Box>
      </MuiPaper>
    );
  },

  HealthSignals: ({ data }: HealthSignalsWidgetProps) => {
    const theme = useTheme();
    const statusColor = data.status === 'Excellent' ? 'success' : 
                       data.status === 'Good' ? 'primary' : 
                       data.status === 'Fair' ? 'warning' : 'error';
    
    return (
      <MuiPaper sx={{ p: theme.spacing(2), borderRadius: theme.shape.borderRadius }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium', mb: theme.spacing(1) }}>
          Health Signals
        </Typography>
        <Box sx={{ mb: theme.spacing(2) }}>
          <Chip 
            label={data.status} 
            color={statusColor as any}
            sx={{ fontWeight: 'medium' }}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing(1) }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Avg Booking:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {Math.round(data.avgBookingLikelihood * 100)}%
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Open Objections:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{data.openObjections}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Pending Actions:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{data.pendingActions}</Typography>
          </Box>
        </Box>
      </MuiPaper>
    );
  },

  // Client dashboard widgets
  RecentCalls: ({ data }: RecentCallsWidgetProps) => {
    const theme = useTheme();
    return (
      <MuiPaper sx={{ p: theme.spacing(2), borderRadius: theme.shape.borderRadius }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium', mb: theme.spacing(1) }}>
          Recent Calls
        </Typography>
        {data.calls.length ? (
          <List dense disablePadding>
            {data.calls.map((call, i) => (
              <ListItem key={i} disablePadding>
                <ListItemText
                  primary={call.name}
                  secondary={
                    <Box sx={{ display: 'flex', gap: theme.spacing(1), alignItems: 'center' }}>
                      <Typography variant="caption">{call.date}</Typography>
                      <Chip 
                        label={call.sentiment} 
                        size="small" 
                        color={getSentimentColor(call.sentiment as any)}
                      />
                      <Typography variant="caption">
                        {Math.round(call.bookingLikelihood * 100)}% booking
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">No calls</Typography>
        )}
      </MuiPaper>
    );
  },

  FollowUps: ({ data }: FollowUpsWidgetProps) => {
    const theme = useTheme();
    return (
      <MuiPaper sx={{ p: theme.spacing(2), borderRadius: theme.shape.borderRadius }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium', mb: theme.spacing(1) }}>
          Follow-ups
        </Typography>
        {data.items.length ? (
          <List dense disablePadding>
            {data.items.map((item, i) => (
              <ListItem key={i} disablePadding>
                <ListItemText
                  primary={
                    <Box>
                      <Chip 
                        label={item.owner} 
                        size="small" 
                        sx={{ mr: theme.spacing(1) }}
                      />
                      {item.text}
                      {item.due && (
                        <Typography 
                          component="span" 
                          variant="caption" 
                          sx={{ ml: theme.spacing(1), color: theme.palette.warning.main }}
                        >
                          (due {item.due})
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={`From: ${item.source}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">No follow-ups</Typography>
        )}
      </MuiPaper>
    );
  },

  ClientKPIs: ({ data }: ClientKPIsWidgetProps) => {
    const theme = useTheme();
    return (
      <MuiPaper sx={{ p: theme.spacing(2), borderRadius: theme.shape.borderRadius }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium', mb: theme.spacing(1) }}>
          Client KPIs
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing(2) }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{data.totalCalls}</Typography>
            <Typography variant="caption" color="text.secondary">Total Calls</Typography>
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{data.avgSentiment}</Typography>
            <Typography variant="caption" color="text.secondary">Avg Sentiment</Typography>
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{Math.round(data.conversionRate * 100)}%</Typography>
            <Typography variant="caption" color="text.secondary">Conversion Rate</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Last Activity: {data.lastActivity}
            </Typography>
          </Box>
        </Box>
      </MuiPaper>
    );
  },
};