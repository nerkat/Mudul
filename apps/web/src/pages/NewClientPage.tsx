import React, { useState } from 'react';
import { 
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  Alert,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useRepo } from '../hooks/useRepo';
import { z } from 'zod';

// Validation schema
const CreateClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(100, 'Name too long'),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

type CreateClientData = z.infer<typeof CreateClientSchema>;

export function NewClientPage() {
  const navigate = useNavigate();
  const repo = useRepo();
  
  // Form state
  const [formData, setFormData] = useState<CreateClientData>({
    name: '',
    notes: '',
  });
  
  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    try {
      CreateClientSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Create new client via repository
      const newClient = await repo.createClient({
        name: formData.name.trim(),
        notes: formData.notes?.trim() || '',
      });

      setSuccessMessage('Client created successfully!');
      
      // Redirect to client dashboard after short delay
      setTimeout(() => {
        navigate(`/node/${newClient.id}`);
      }, 1500);

    } catch (error: any) {
      console.error('Failed to create client:', error);
      setErrors({ 
        general: error.message || 'Failed to create client. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateClientData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
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
          New Client
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {errors.general && (
              <Alert severity="error">{errors.general}</Alert>
            )}
            
            {successMessage && (
              <Alert severity="success">{successMessage}</Alert>
            )}

            <TextField
              label="Client Name"
              value={formData.name}
              onChange={handleInputChange('name')}
              error={!!errors.name}
              helperText={errors.name}
              required
              fullWidth
              autoFocus
              disabled={isSubmitting}
            />

            <TextField
              label="Notes"
              value={formData.notes}
              onChange={handleInputChange('notes')}
              error={!!errors.notes}
              helperText={errors.notes || 'Optional notes about the client'}
              multiline
              rows={4}
              fullWidth
              disabled={isSubmitting}
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Client'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}