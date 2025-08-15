import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Alert,
  Button,
  Snackbar,
  Chip
} from '@mui/material';
import { PlayArrow, Refresh, Cancel } from '@mui/icons-material';
import { useNode } from '../hooks/useNode';
import { useSalesCall } from '../hooks/useSalesCall';
import { useAnalyzeCall } from '../hooks/useAnalyzeCall';
import { WidgetRenderer } from '../core/widgets/registry';
import { DashboardTemplate } from '../core/widgets/protocol';
import { DashboardTemplates } from '../core/registry-json';
import type { AnalysisError } from '../services/errors';

export function DashboardPage() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const node = useNode(nodeId || "");
  const { data: call, error, loading } = useSalesCall(nodeId || "");
  const { analyze, loading: analyzing, error: analyzeError, lastResult, cancel } = useAnalyzeCall();
  
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Handle analysis results
  useEffect(() => {
    if (lastResult) {
      if (lastResult.updated) {
        setToastMessage("Analysis completed successfully!");
        setShowSuccessToast(true);
        // Force a re-render by updating the key or refreshing data
        setTimeout(() => window.location.reload(), 500);
      } else if (lastResult.isDuplicate) {
        setToastMessage("Analysis already exists for this transcript");
        setShowSuccessToast(true); // Show as success since it's not an error
      }
    }
  }, [lastResult]);

  // Handle analysis errors
  useEffect(() => {
    if (analyzeError) {
      const message = getErrorMessage(analyzeError);
      setToastMessage(message);
      setShowErrorToast(true);
    }
  }, [analyzeError]);

  const getErrorMessage = (error: AnalysisError): string => {
    switch (error.code) {
      case 'TIMEOUT':
        return 'Analysis timed out. Please try again.';
      case 'RATE_LIMITED':
        return 'Rate limit reached. Please wait a moment and try again.';
      case 'SCHEMA_INVALID':
        return 'Analysis response was invalid. The service may be experiencing issues.';
      case 'PROVIDER_ERROR':
        return 'AI service is temporarily unavailable. Please try again later.';
      case 'NETWORK_ERROR':
        return 'Network connection failed. Please check your connection and try again.';
      case 'CANCELLED':
        return 'Analysis was cancelled.';
      case 'SCHEMA_MISMATCH':
        return 'Analysis format has changed. Please refresh and try again.';
      default:
        return `Analysis failed: ${error.message}`;
    }
  };

  const getErrorSeverity = (error: AnalysisError): "error" | "warning" | "info" => {
    if (error.retryable) {
      return error.code === 'RATE_LIMITED' ? 'warning' : 'info';
    }
    return 'error';
  };

  const handleAnalyze = async () => {
    if (!nodeId) return;
    
    // For demo purposes, use a mock transcript
    const mockTranscript = "This is a mock sales call transcript for analysis.";
    
    await analyze(nodeId, mockTranscript);
  };

  const handleCancel = () => {
    cancel();
    setToastMessage("Analysis cancelled");
    setShowSuccessToast(true);
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
          {call?.meta?.schemaVersion && (
            <Chip 
              size="small" 
              label={`Schema: ${call.meta.schemaVersion}`} 
              variant="outlined"
              sx={{ mr: 1 }}
            />
          )}
          {call?.meta?.provider && (
            <Chip 
              size="small" 
              label={`Provider: ${call.meta.provider}`} 
              variant="outlined"
            />
          )}
        </Box>
        
        {isCallSession && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {analyzing && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<Cancel />}
                onClick={handleCancel}
                size="small"
              >
                Cancel
              </Button>
            )}
            <Button
              variant={hasAnalysisData ? "outlined" : "contained"}
              startIcon={hasAnalysisData ? <Refresh /> : <PlayArrow />}
              onClick={handleAnalyze}
              disabled={analyzing}
              sx={{ minWidth: 120 }}
            >
              {analyzing ? "Analyzing..." : hasAnalysisData ? "Reanalyze" : "Analyze"}
            </Button>
          </Box>
        )}
      </Box>
      
      {loading && (
        <Alert severity="info">Loading dashboard data...</Alert>
      )}
      
      {error && (
        <Alert severity="warning">{error}</Alert>
      )}

      {analyzeError && (
        <Alert severity={getErrorSeverity(analyzeError)} sx={{ mt: 2 }}>
          <Box>
            <Typography variant="body2" component="div">
              {getErrorMessage(analyzeError)}
            </Typography>
            {analyzeError.retryable && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                This error is retryable. You can try the analysis again.
              </Typography>
            )}
          </Box>
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
        message={toastMessage}
      />
      
      <Snackbar
        open={showErrorToast}
        autoHideDuration={6000}
        onClose={() => setShowErrorToast(false)}
        message={toastMessage}
      />
    </Box>
  );
}