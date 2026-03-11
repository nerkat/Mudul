import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Alert,
  Paper,
  Stack,
} from '@mui/material';
import { ArrowBack, PlayArrow, Cancel, Refresh } from '@mui/icons-material';
import { useRepo } from '../hooks/useRepo';
import { useOrg } from '../auth/OrgContext';
import { useAuth } from '../auth/AuthContext';
import { useAnalyzeCall } from '../hooks/useAnalyzeCall';

export function NewCallPage() {
  const navigate = useNavigate();
  const repo = useRepo();
  const { currentOrg } = useOrg();
  const { session } = useAuth();
  const analyzeCall = useAnalyzeCall();
  
  // Form state
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState(() => {
    const today = new Date().toLocaleDateString();
    return `New Call – ${today}`;
  });
  const [clientName, setClientName] = useState('');
  const [transcript, setTranscript] = useState('');
  
  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const clients = repo.getAllClients();
  const hasClients = clients.length > 0;
  const isAnalyzing = analyzeCall.loading;
  const hasAnalysisData = !!analyzeCall.lastResponse;

  const authorizedPost = async (endpoint: string, body: unknown) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.accessToken || ''}`,
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || result.error || 'REQUEST_FAILED');
    }

    return result;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (hasClients) {
      if (!clientId) {
        newErrors.clientId = 'Client is required';
      }
    } else if (clientName.trim().length < 2) {
      newErrors.clientName = 'Client name must be at least 2 characters';
    }
    
    if (transcript.trim().length < 20) {
      newErrors.transcript = 'Transcript must be at least 20 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAnalyze = async () => {
    if (!validateForm()) return;
    
    setErrors({});
    setSuccessMessage('');

    try {
      const outcome = await analyzeCall.analyze(
        `draft-${Date.now()}`,
        transcript.trim(),
        'sales_v1',
        { persistLocal: false }
      );

      if (outcome.status === 'error') {
        setErrors({ general: outcome.error?.message || 'Analysis failed. Please try again.' });
        return;
      }

      if (outcome.status !== 'success' || !outcome.response?.analysis) {
        setErrors({ general: 'Analysis was cancelled or did not complete.' });
        return;
      }

      const resolvedClientId = hasClients
        ? clientId
        : currentOrg
          ? (await authorizedPost('/api/clients', { name: clientName.trim() })).id
          : '';

      if (!resolvedClientId) {
        setErrors({ general: 'No active organization was found for this call.' });
        return;
      }

      const createdCall = await authorizedPost('/api/calls', {
        clientId: resolvedClientId,
        title,
        transcript: transcript.trim(),
        analysis: outcome.response.analysis,
        meta: outcome.response.meta,
      });

      await repo.refresh();
      setSuccessMessage('Call created and analyzed successfully!');
      setTimeout(() => navigate(`/node/${createdCall.node.id}`), 600);
      return;

    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : 'An unexpected error occurred' 
      });
    }
  };

  const handleCancel = () => {
    analyzeCall.cancel();
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate(-1)} 
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          New Call
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={3}>
          {errors.general && (
            <Alert severity="error">{errors.general}</Alert>
          )}
          
          {successMessage && (
            <Alert severity="success">{successMessage}</Alert>
          )}

          {hasClients ? (
            <TextField
              select
              label="Client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              error={!!errors.clientId}
              helperText={errors.clientId}
              required
              fullWidth
            >
              {clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.name}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <>
              <Alert severity="info">
                This org does not have any clients yet. Create the first client here and the call will be attached to it.
              </Alert>
              <TextField
                label="First Client Name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                error={!!errors.clientName}
                helperText={errors.clientName || 'Add the client you are about to call'}
                required
                fullWidth
              />
            </>
          )}

          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />

          <TextField
            label="Transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            error={!!errors.transcript}
            helperText={errors.transcript || 'Minimum 20 characters required'}
            required
            multiline
            rows={8}
            fullWidth
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              disabled={isAnalyzing}
            >
              Cancel
            </Button>
            
            <Button
              type="button"
              onClick={isAnalyzing ? handleCancel : handleAnalyze}
              variant={isAnalyzing ? "outlined" : hasAnalysisData ? "outlined" : "contained"}
              color={isAnalyzing ? "secondary" : "primary"}
              startIcon={
                isAnalyzing ? <Cancel /> : 
                hasAnalysisData ? <Refresh /> : 
                <PlayArrow />
              }
              sx={{ minWidth: 140 }}
            >
              {isAnalyzing ? "Cancel" : hasAnalysisData ? "Reanalyze" : "Analyze & Save"}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}