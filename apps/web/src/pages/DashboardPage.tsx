import { useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Alert
} from '@mui/material';
import { useNode } from '../hooks/useNode';
import { useSalesCall } from '../hooks/useSalesCall';
import { WidgetRenderer } from '../core/widgets/registry';
import { DashboardTemplate } from '../core/widgets/protocol';
import { DashboardTemplates } from '../core/registry-json';

export function DashboardPage() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const node = useNode(nodeId || "");
  const { data: call, error, loading } = useSalesCall(nodeId || "");

  if (!nodeId) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Alert severity="info">
          Please select a node from the sidebar to view its dashboard.
        </Alert>
      </Box>
    );
  }

  if (!node) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Node Not Found
        </Typography>
        <Alert severity="error">
          Node with ID "{nodeId}" was not found.
        </Alert>
      </Box>
    );
  }

  // Get dashboard template and validate
  const tpl = DashboardTemplates[node?.dashboardId ?? "sales-call-default"];
  let parsed: DashboardTemplate | null = null;
  let templateError: string | null = null;

  try {
    parsed = DashboardTemplate.parse(tpl);
  } catch (error) {
    templateError = error instanceof Error ? error.message : 'Invalid template format';
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {node.name}
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        {node.kind === "call_session" ? "Sales Call Dashboard" : "Node Dashboard"}
      </Typography>
      
      {loading && (
        <Alert severity="info">Loading dashboard data...</Alert>
      )}
      
      {error && (
        <Alert severity="warning">{error}</Alert>
      )}

      {templateError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Template validation error: {templateError}
        </Alert>
      )}
      
      {!loading && !error && !templateError && call && parsed && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 2, mt: 2 }}>
          {parsed.widgets.map((widgetConfig, index) => (
            <Box key={`${widgetConfig.slug}-${index}`}>
              <WidgetRenderer config={widgetConfig} call={call} />
            </Box>
          ))}
        </Box>
      )}
      
      {!loading && !error && !templateError && (!call || !parsed) && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No dashboard configuration found for this node.
        </Alert>
      )}
    </Box>
  );
}