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
} from '@mui/material';
import { z } from 'zod';
import { NewClientForm, type NewClientFormData } from '../../api/schemas/forms';

interface NewClientFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewClientFormData) => Promise<void>;
  loading?: boolean;
}

export function NewClientFormDialog({ open, onClose, onSubmit, loading = false }: NewClientFormDialogProps) {
  const [formData, setFormData] = useState<NewClientFormData>({
    name: '',
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
      const validatedData = NewClientForm.parse(formData);
      await onSubmit(validatedData);
      // Reset form on success
      setFormData({ name: '', notes: '' });
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
      setFormData({ name: '', notes: '' });
      setErrors({});
      setSubmitError('');
      onClose();
    }
  };

  const handleChange = (field: keyof NewClientFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Client</DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {submitError && (
              <Alert severity="error">{submitError}</Alert>
            )}
            
            <TextField
              label="Client Name"
              value={formData.name}
              onChange={handleChange('name')}
              error={!!errors.name}
              helperText={errors.name || 'Required (2-100 characters)'}
              required
              disabled={loading}
              autoFocus
            />
            
            <TextField
              label="Notes"
              value={formData.notes}
              onChange={handleChange('notes')}
              error={!!errors.notes}
              helperText={errors.notes || 'Optional (up to 2,000 characters)'}
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
            disabled={loading || !formData.name.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Creating...' : 'Create Client'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}