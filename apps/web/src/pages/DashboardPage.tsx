import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  Snackbar,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Stack
} from '@mui/material';
import { PlayArrow, Refresh, Cancel, Description, InsertChartOutlined } from '@mui/icons-material';
import { useNode } from '../hooks/useNode';
import { useSalesCall } from '../hooks/useSalesCall';
import { useAnalyzeCall } from '../hooks/useAnalyzeCall';
import { WidgetRenderer } from '../core/widgets/registry';
import { DashboardTemplate } from '../core/widgets/protocol';
import { DashboardTemplates } from '../core/registry-json';
import type { AnalysisError } from '../services/errors';
import { useViewMode } from '../ctx/ViewModeContext';  // Use context instead of standalone hook

export function DashboardPage() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const node = useNode(nodeId || "");
  const { data: call, error, loading /*, refetch */ } = useSalesCall(nodeId || "");
  const { analyze, loading: analyzing, error: analyzeError, lastResult, cancel } = useAnalyzeCall();

  const { mode, toggleMode, setMode } = useViewMode(); // Use context methods

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Keyboard: press "p" to toggle paper/rich mode (handled by ViewModeContext)
  // Remove duplicate keyboard handler since ViewModeContext already handles it

  // Handle analysis results (no full page reload)
  useEffect(() => {
    if (!lastResult) return;

    if (lastResult.updated) {
      setToastMessage("Analysis completed successfully!");
      setShowSuccessToast(true);
      // If your data hook doesn't auto-refresh on repo mutation, call refetch() here.
      // refetch?.();
    } else if (lastResult.isDuplicate) {
      setToastMessage("Analysis already exists for this transcript");
      setShowSuccessToast(true); // Treat as success since nothing went wrong
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
    const sourceTranscript = call?.transcript?.trim();
    if (!sourceTranscript || sourceTranscript.length < 20) {
      setToastMessage("No transcript stored for this call. Re-run from creation page.");
      setShowErrorToast(true);
      return;
    }
    await analyze(nodeId, sourceTranscript);
  };

  const handleCancel = () => {
    cancel();
    setToastMessage("Analysis cancelled");
    setShowSuccessToast(true);
  };

  const isCallSession = node?.kind === "call_session";
  const hasAnalysisData = !!call && Object.keys(call).length > 0;

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
  let parsed: ReturnType<typeof DashboardTemplate.parse> | null = null;
  let templateError: string | null = null;

  try {
    parsed = DashboardTemplate.parse(tpl);
  } catch (e) {
    templateError = e instanceof Error ? e.message : 'Invalid template format';
  }

  // Helper: map widget slug → call data for paper mode
  const paperDataForSlug = (slug: string) => {
    switch (slug) {
      case 'summary': return call?.summary ?? null;
      case 'sentiment': return call?.sentiment ?? null;
      case 'booking': return call?.bookingLikelihood ?? null;
      case 'objections': return call?.objections ?? null;
      case 'actionItems': return call?.actionItems ?? null;
      case 'keyMoments': return call?.keyMoments ?? null;
      default:
        // fallback: try property by slug if exists
        return (call as any)?.[slug] ?? null;
    }
  };

  const ModeChip = (
    <Chip
      size="small"
      variant="outlined"
      color={mode === 'paper' ? 'default' : 'primary'}
      label={mode === 'paper' ? 'Mode: Paper' : 'Mode: Rich'}
      sx={{ mr: 1 }}
      onClick={() => setMode(mode === 'paper' ? 'rich' : 'paper')}
    />
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {node.name}
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            {node.kind === "call_session" ? "Sales Call Dashboard" : "Node Dashboard"}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            {ModeChip}

            {call?.meta?.schemaVersion && (
              <Chip
                size="small"
                label={`Schema: ${call.meta.schemaVersion}`}
                variant="outlined"
              />
            )}
            {call?.meta?.provider && (
              <Chip
                size="small"
                label={`Provider: ${call.meta.provider}`}
                variant="outlined"
              />
            )}
          </Stack>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={mode === 'paper' ? 'Switch to rich view (P)' : 'Switch to paper mode (P)'}>
            <IconButton onClick={toggleMode} color="default">
              {mode === 'paper' ? <InsertChartOutlined /> : <Description />}
            </IconButton>
          </Tooltip>

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
                type="button"
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
      </Box>

      <Divider />

      {/* Loading / errors */}
      {loading && (
        <Alert severity="info" sx={{ mt: 2 }}>Loading dashboard data...</Alert>
      )}

      {error && (
        <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert>
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

      {/* Widgets */}
      {!loading && !error && !templateError && call && parsed && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 2, mt: 2 }}>
          {parsed.widgets.map((widgetConfig, index) => (
            <Box key={`${widgetConfig.slug}-${index}`}>
              {mode === 'paper' ? (
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {widgetConfig.slug}
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                    }}
                  >
                    {JSON.stringify(paperDataForSlug(widgetConfig.slug), null, 2)}
                  </Box>
                </Box>
              ) : (
                <WidgetRenderer config={widgetConfig} call={call} nodeId={nodeId} />
              )}
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
