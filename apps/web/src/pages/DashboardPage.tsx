import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Alert,
  Button,
  Snackbar
} from '@mui/material';
import { PlayArrow, Refresh } from '@mui/icons-material';
import { useNode } from '../hooks/useNode';
import { useSalesCall } from '../hooks/useSalesCall';
import { useAnalyzeCall } from '../hooks/useAnalyzeCall';
import { WidgetRenderer } from '../core/widgets/registry';
import { DashboardTemplate } from '../core/widgets/protocol';
import { DashboardTemplates } from '../core/registry-json';

export function DashboardPage() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const node = useNode(nodeId || "");
  const { data: call, error, loading } = useSalesCall(nodeId || "");
  const { analyze, loading: analyzing, error: analyzeError } = useAnalyzeCall();
  
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  const handleAnalyze = async () => {
    if (!nodeId) return;
    
    // For demo purposes, use a mock transcript
    const mockTranscript = "This is a mock sales call transcript for analysis.";
    
    try {
      await analyze(nodeId, mockTranscript);
      setShowSuccessToast(true);
      // Force a re-render by updating the key or refreshing data
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      setShowErrorToast(true);
    }
  };

  const isCallSession = node?.kind === "call_session";
  const hasAnalysisData = call && Object.keys(call).length > 0;

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {node.name}
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            {node.kind === "call_session" ? "Sales Call Dashboard" : "Node Dashboard"}
          </Typography>
        </Box>
        
        {isCallSession && (
          <Button
            variant={hasAnalysisData ? "outlined" : "contained"}
            startIcon={hasAnalysisData ? <Refresh /> : <PlayArrow />}
            onClick={handleAnalyze}
            disabled={analyzing}
            sx={{ minWidth: 120 }}
          >
            {analyzing ? "Analyzing..." : hasAnalysisData ? "Reanalyze" : "Analyze"}
          </Button>
        )}
      </Box>
      
      {loading && (
        <Alert severity="info">Loading dashboard data...</Alert>
      )}
      
      {error && (
        <Alert severity="warning">{error}</Alert>
      )}

      {analyzeError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Analysis failed: {analyzeError}
        </Alert>
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

      {/* Success/Error Toasts */}
      <Snackbar
        open={showSuccessToast}
        autoHideDuration={4000}
        onClose={() => setShowSuccessToast(false)}
        message="Analysis completed successfully!"
      />
      
      <Snackbar
        open={showErrorToast}
        autoHideDuration={4000}
        onClose={() => setShowErrorToast(false)}
        message="Analysis failed. Please try again."
      />
    </Box>
  );
}