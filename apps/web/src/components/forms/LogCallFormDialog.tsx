import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Slider,
  Typography,
} from '@mui/material';
import { z } from 'zod';
import { LogCallForm, type LogCallFormData } from '../../api/schemas/forms';

interface LogCallFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LogCallFormData) => Promise<void>;
  loading?: boolean;
}

export function LogCallFormDialog({ open, onClose, onSubmit, loading = false }: LogCallFormDialogProps) {
  const [formData, setFormData] = useState<LogCallFormData>({
    ts: new Date().toISOString(),
    durationSec: 1800, // 30 minutes default
    sentiment: 'neu',
    score: 0,
    bookingLikelihood: 0.5,
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');

    // Client-side validation
    try {
      const validatedData = LogCallForm.parse(formData);
      await onSubmit(validatedData);
      // Reset form on success
      setFormData({
        ts: new Date().toISOString(),
        durationSec: 1800,
        sentiment: 'neu',
        score: 0,
        bookingLikelihood: 0.5,
        notes: '',
      });
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setSubmitError(error instanceof Error ? error.message : 'An error occurred');
      }
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        ts: new Date().toISOString(),
        durationSec: 1800,
        sentiment: 'neu',
        score: 0,
        bookingLikelihood: 0.5,
        notes: '',
      });
      setErrors({});
      setSubmitError('');
      onClose();
    }
  };

  const handleChange = (field: keyof LogCallFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value: any = e.target.value;
    
    // Convert numeric fields
    if (field === 'durationSec') {
      value = parseInt(value) || 0;
    } else if (field === 'score' || field === 'bookingLikelihood') {
      value = parseFloat(value) || 0;
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSliderChange = (field: 'score' | 'bookingLikelihood') => (_: Event, value: number | number[]) => {
    setFormData(prev => ({ ...prev, [field]: value as number }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Log Call</DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {submitError && (
              <Alert severity="error">{submitError}</Alert>
            )}
            
            <TextField
              label="Call Date & Time"
              type="datetime-local"
              value={formData.ts.slice(0, 16)} // Format for datetime-local input
              onChange={(e) => {
                const isoString = new Date(e.target.value).toISOString();
                setFormData(prev => ({ ...prev, ts: isoString }));
              }}
              error={!!errors.ts}
              helperText={errors.ts || 'When did the call take place?'}
              required
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              label="Duration (seconds)"
              type="number"
              value={formData.durationSec}
              onChange={handleChange('durationSec')}
              error={!!errors.durationSec}
              helperText={errors.durationSec || `${formatDuration(formData.durationSec)} (1-14,400 seconds)`}
              required
              disabled={loading}
              inputProps={{ min: 1, max: 14400 }}
            />
            
            <FormControl error={!!errors.sentiment} required disabled={loading}>
              <InputLabel>Sentiment</InputLabel>
              <Select
                value={formData.sentiment}
                onChange={(e) => setFormData(prev => ({ ...prev, sentiment: e.target.value as 'pos' | 'neu' | 'neg' }))}
                label="Sentiment"
              >
                <MenuItem value="pos">Positive</MenuItem>
                <MenuItem value="neu">Neutral</MenuItem>
                <MenuItem value="neg">Negative</MenuItem>
              </Select>
              <FormHelperText>{errors.sentiment || 'Overall call sentiment'}</FormHelperText>
            </FormControl>
            
            <Box>
              <Typography gutterBottom>
                Sentiment Score: {formData.score.toFixed(2)}
              </Typography>
              <Slider
                value={formData.score}
                onChange={handleSliderChange('score')}
                min={-1}
                max={1}
                step={0.1}
                marks={[
                  { value: -1, label: '-1' },
                  { value: 0, label: '0' },
                  { value: 1, label: '1' },
                ]}
                disabled={loading}
              />
              {errors.score && (
                <Typography variant="caption" color="error">{errors.score}</Typography>
              )}
            </Box>
            
            <Box>
              <Typography gutterBottom>
                Booking Likelihood: {(formData.bookingLikelihood * 100).toFixed(0)}%
              </Typography>
              <Slider
                value={formData.bookingLikelihood}
                onChange={handleSliderChange('bookingLikelihood')}
                min={0}
                max={1}
                step={0.05}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 0.5, label: '50%' },
                  { value: 1, label: '100%' },
                ]}
                disabled={loading}
              />
              {errors.bookingLikelihood && (
                <Typography variant="caption" color="error">{errors.bookingLikelihood}</Typography>
              )}
            </Box>
            
            <TextField
              label="Notes"
              value={formData.notes}
              onChange={handleChange('notes')}
              error={!!errors.notes}
              helperText={errors.notes || 'Optional call notes (up to 2,000 characters)'}
              multiline
              rows={3}
              disabled={loading}
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Logging...' : 'Log Call'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}