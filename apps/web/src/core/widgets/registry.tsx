import React from "react";
import { Box, Typography, Paper as MuiPaper, Alert, useTheme } from '@mui/material';
import type { SalesCallMinimal } from "../types";
import type { WidgetSlug, WidgetConfig } from "./protocol";
import {
  SummaryParams,
  SentimentParams, 
  BookingParams,
  ObjectionsParams,
  ActionItemsParams,
  KeyMomentsParams,
  EntitiesParams,
  ComplianceParams,
  PieChartParams
} from "./params";

// Import adapters and paper renderer
import { Adapters } from '../adapters';
import { PaperRenderer } from './paper/PaperRenderer';
import { useViewMode } from '../../ctx/ViewModeContext';

// Component implementations (use existing Paper/Rich widgets internally)
import { Rich as WRich } from "../../components/widgets";

// Select current skin - will be configurable later
const Skin = WRich;

// Registry interface - each entry validates params and renders
interface WidgetRegistryEntry<P = any> {
  validate: (params: unknown) => { success: true; data: P } | { success: false; error: string };
  render: (data: SalesCallMinimal, params: P) => React.ReactNode;
}

// Map slug to { validate(params), render(data, params) }
export const WidgetRegistry: Record<WidgetSlug, WidgetRegistryEntry> = {
  summary: {
    validate: (params: unknown) => {
      const result = SummaryParams.safeParse(params);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, error: `Invalid summary params: ${result.error.message}` };
    },
    render: (call, _params) => (
      <Skin.Summary key="summary" data={{ summary: call.summary }} />
    )
  },

  sentiment: {
    validate: (params: unknown) => {
      const result = SentimentParams.safeParse(params);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, error: `Invalid sentiment params: ${result.error.message}` };
    },
    render: (call, _params) => (
      <Skin.Sentiment key="sentiment" data={{ sentiment: call.sentiment }} />
    )
  },

  booking: {
    validate: (params: unknown) => {
      const result = BookingParams.safeParse(params);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, error: `Invalid booking params: ${result.error.message}` };
    },
    render: (call, _params) => (
      <Skin.Booking key="booking" data={{ bookingLikelihood: call.bookingLikelihood }} />
    )
  },

  objections: {
    validate: (params: unknown) => {
      const result = ObjectionsParams.safeParse(params);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, error: `Invalid objections params: ${result.error.message}` };
    },
    render: (call, _params) => (
      <Skin.Objections key="objections" data={{ objections: call.objections }} />
    )
  },

  actionItems: {
    validate: (params: unknown) => {
      const result = ActionItemsParams.safeParse(params);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, error: `Invalid actionItems params: ${result.error.message}` };
    },
    render: (call, _params) => (
      <Skin.ActionItems key="actionItems" data={{ actionItems: call.actionItems }} />
    )
  },

  keyMoments: {
    validate: (params: unknown) => {
      const result = KeyMomentsParams.safeParse(params);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, error: `Invalid keyMoments params: ${result.error.message}` };
    },
    render: (call, _params) => (
      <Skin.KeyMoments key="keyMoments" data={{ keyMoments: call.keyMoments }} />
    )
  },

  entities: {
    validate: (params: unknown) => {
      const result = EntitiesParams.safeParse(params);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, error: `Invalid entities params: ${result.error.message}` };
    },
    render: (call, _params) => (
      <Skin.Entities key="entities" data={{ entities: call.entities }} />
    )
  },

  compliance: {
    validate: (params: unknown) => {
      const result = ComplianceParams.safeParse(params);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, error: `Invalid compliance params: ${result.error.message}` };
    },
    render: (call, _params) => (
      <Skin.Compliance key="compliance" data={{ complianceFlags: call.complianceFlags }} />
    )
  },

  pieChart: {
    validate: (params: unknown) => {
      const result = PieChartParams.safeParse(params);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, error: `Invalid pieChart params: ${result.error.message}` };
    },
    render: (_call, params) => {
      const theme = useTheme();
      return (
        <MuiPaper 
          key="pieChart"
          sx={{ 
            p: theme.spacing(2), 
            borderRadius: theme.shape.borderRadius,
            height: `${params.height}px`
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'medium', mb: theme.spacing(1) }}>
            Pie Chart
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Chart visualization (stub) - height: {params.height}px
          </Typography>
        </MuiPaper>
      );
    }
  }
};

// Widget renderer component
interface WidgetRendererProps {
  config: WidgetConfig;
  call: SalesCallMinimal;
}

export function WidgetRenderer({ config, call }: WidgetRendererProps) {
  const { mode } = useViewMode();
  const theme = useTheme();
  const entry = WidgetRegistry[config.slug];
  
  if (!entry) {
    const errorMessage = `Unknown widget: ${config.slug}`;
    if (mode === "paper") {
      return (
        <PaperRenderer 
          slug="error" 
          title="Error" 
          data={{ error: errorMessage, type: "missing-widget" }} 
        />
      );
    }
    return (
      <Alert 
        severity="error" 
        sx={{ 
          borderRadius: theme.shape.borderRadius,
          '& .MuiAlert-message': { 
            fontWeight: 'medium' 
          }
        }}
      >
        ⚠️ {errorMessage}
      </Alert>
    );
  }

  const validation = entry.validate(config.params || {});
  
  if (!validation.success) {
    const errorMessage = `Widget error (${config.slug}): ${validation.error}`;
    if (mode === "paper") {
      return (
        <PaperRenderer 
          slug="error" 
          title="Validation Error" 
          data={{ error: validation.error, widget: config.slug, type: "validation-error" }} 
        />
      );
    }
    return (
      <Alert 
        severity="error" 
        sx={{ 
          borderRadius: theme.shape.borderRadius,
          '& .MuiAlert-message': { 
            fontWeight: 'medium' 
          }
        }}
      >
        ⚠️ {errorMessage}
      </Alert>
    );
  }

  // Use adapters to project data
  const adapter = Adapters[config.slug];
  
  if (!adapter) {
    const errorMessage = `No adapter for ${config.slug}`;
    if (mode === "paper") {
      return (
        <PaperRenderer 
          slug="error" 
          title="Missing Adapter" 
          data={{ error: errorMessage, widget: config.slug, type: "missing-adapter" }} 
        />
      );
    }
    return (
      <Alert 
        severity="warning" 
        sx={{ 
          borderRadius: theme.shape.borderRadius,
          '& .MuiAlert-message': { 
            fontWeight: 'medium' 
          }
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            ⚠️ {errorMessage}
          </Typography>
          <Typography variant="caption" sx={{ mt: theme.spacing(0.5), display: 'block' }}>
            Using fallback data projection
          </Typography>
        </Box>
      </Alert>
    );
  }
  
  const data = adapter.project(call, validation.data, { mode });

  // Branch between paper and rich mode
  if (mode === "paper") {
    return <PaperRenderer slug={config.slug} title={config.slug} data={data} params={validation.data} />;
  }

  try {
    return <>{entry.render(call, validation.data)}</>;
  } catch (error) {
    const errorMessage = `Render error (${config.slug}): ${error instanceof Error ? error.message : 'Unknown error'}`;
    return (
      <Alert 
        severity="error" 
        sx={{ 
          borderRadius: theme.shape.borderRadius,
          '& .MuiAlert-message': { 
            fontWeight: 'medium' 
          }
        }}
      >
        ⚠️ {errorMessage}
      </Alert>
    );
  }
}