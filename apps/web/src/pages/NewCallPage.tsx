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
import { useAnalyzeCall } from '../hooks/useAnalyzeCall';
import { createCallNode, deleteNode, markNodeActive } from '../core/repo';

export function NewCallPage() {
  const navigate = useNavigate();
  const repo = useRepo();
  const analyzeCall = useAnalyzeCall();
  
  // Form state
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState(() => {
    const today = new Date().toLocaleDateString();
    return `New Call – ${today}`;
  });
  const [transcript, setTranscript] = useState('');
  
  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [currentDraftNodeId, setCurrentDraftNodeId] = useState<string | null>(null);

  const clients = repo.getAllClients();
  const isAnalyzing = analyzeCall.loading;
  const hasAnalysisData = !!analyzeCall.lastResponse;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!clientId) {
      newErrors.clientId = 'Client is required';
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
      // Create draft call node
      const draftNodeId = createCallNode({ clientId, title });
      setCurrentDraftNodeId(draftNodeId);

      // Analyze the call
      const outcome = await analyzeCall.analyze(draftNodeId, transcript.trim());

      // Decide based on direct outcome to avoid stale state reads
      if (outcome.status === 'success' || outcome.status === 'duplicate') {
        const updated = outcome.result?.updated || outcome.result?.isDuplicate;
        if (updated) {
          markNodeActive(draftNodeId);
          setSuccessMessage('Call created and analyzed successfully!');
          setTimeout(() => navigate(`/node/${draftNodeId}`), 1000);
          return;
        }
      }

      if (outcome.status === 'error') {
        deleteNode(draftNodeId);
        setCurrentDraftNodeId(null);
        setErrors({ general: outcome.error?.message || 'Analysis failed. Please try again.' });
        return;
      }

      // Fallback (aborted or unexpected)
      deleteNode(draftNodeId);
      setCurrentDraftNodeId(null);
      setErrors({ general: 'Analysis was cancelled or did not complete.' });
    } catch (error) {
      // Rollback on error
      if (currentDraftNodeId) {
        deleteNode(currentDraftNodeId);
        setCurrentDraftNodeId(null);
      }
      setErrors({ 
        general: error instanceof Error ? error.message : 'An unexpected error occurred' 
      });
    }
  };

  const handleCancel = () => {
    analyzeCall.cancel();
    
    // Rollback draft if exists
    if (currentDraftNodeId) {
      deleteNode(currentDraftNodeId);
      setCurrentDraftNodeId(null);
    }
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