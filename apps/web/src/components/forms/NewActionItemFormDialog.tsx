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
import { NewActionItemForm, type NewActionItemFormData } from '../../api/schemas/forms';

interface NewActionItemFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewActionItemFormData) => Promise<void>;
  loading?: boolean;
}

export function NewActionItemFormDialog({ open, onClose, onSubmit, loading = false }: NewActionItemFormDialogProps) {
  const [formData, setFormData] = useState<NewActionItemFormData>({
    owner: '',
    text: '',
    dueDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');

    // Client-side validation
    try {
      // Clean up data before validation
      const cleanData = {
        ...formData,
        owner: formData.owner?.trim() || undefined,
        dueDate: formData.dueDate || undefined,
      };
      
      const validatedData = NewActionItemForm.parse(cleanData);
      await onSubmit(validatedData);
      // Reset form on success
      setFormData({ owner: '', text: '', dueDate: '' });
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
      setFormData({ owner: '', text: '', dueDate: '' });
      setErrors({});
      setSubmitError('');
      onClose();
    }
  };

  const handleChange = (field: keyof NewActionItemFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // For date field, convert to ISO string if needed
    if (field === 'dueDate' && value) {
      try {
        value = new Date(value).toISOString();
      } catch {
        // Keep original value if conversion fails
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add Action Item</DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {submitError && (
              <Alert severity="error">{submitError}</Alert>
            )}
            
            <TextField
              label="Action Item"
              value={formData.text}
              onChange={handleChange('text')}
              error={!!errors.text}
              helperText={errors.text || 'Required (2-500 characters)'}
              required
              disabled={loading}
              autoFocus
              multiline
              rows={2}
            />
            
            <TextField
              label="Owner"
              value={formData.owner}
              onChange={handleChange('owner')}
              error={!!errors.owner}
              helperText={errors.owner || 'Optional (up to 120 characters)'}
              disabled={loading}
              placeholder="Who is responsible?"
            />
            
            <TextField
              label="Due Date"
              type="datetime-local"
              value={formData.dueDate ? new Date(formData.dueDate).toISOString().slice(0, 16) : ''}
              onChange={handleChange('dueDate')}
              error={!!errors.dueDate}
              helperText={errors.dueDate || 'Optional due date and time'}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
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
            disabled={loading || !formData.text.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Adding...' : 'Add Action Item'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}