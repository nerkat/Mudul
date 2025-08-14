import { useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Alert
} from '@mui/material';
import { useNode } from '../hooks/useNode';
import { useSalesCall } from '../hooks/useSalesCall';
import { useDashboardWidgets } from '../core/registry';

export function DashboardPage() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const node = useNode(nodeId || "");
  const { data: call, error, loading } = useSalesCall(nodeId || "");
  const widgets = useDashboardWidgets(node?.dashboardId || "", call);

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
      
      {!loading && !error && widgets.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 2, mt: 2 }}>
          {widgets.map((widget, index) => (
            <Box key={index}>
              {widget}
            </Box>
          ))}
        </Box>
      )}
      
      {!loading && !error && widgets.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No dashboard configuration found for this node.
        </Alert>
      )}
    </Box>
  );
}