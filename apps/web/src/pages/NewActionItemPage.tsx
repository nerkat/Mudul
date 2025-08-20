import React, { useState } from 'react';
import { 
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useRepo } from '../hooks/useRepo';
import { z } from 'zod';

// Validation schema
const CreateActionItemSchema = z.object({
  owner: z.string().min(1, 'Owner is required').max(100, 'Owner name too long'),
  text: z.string().min(1, 'Action item text is required').max(500, 'Text too long'),
  dueDate: z.string().optional(),
  status: z.enum(['open', 'done']).default('open'),
});

type CreateActionItemData = z.infer<typeof CreateActionItemSchema>;

export function NewActionItemPage() {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  const repo = useRepo();
  
  // Get client info for display
  const client = clientId ? repo.getNode(clientId) : null;
  
  // Form state
  const [formData, setFormData] = useState<CreateActionItemData>({
    owner: '',
    text: '',
    dueDate: '',
    status: 'open',
  });
  
  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    try {
      CreateActionItemSchema.parse(formData);
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
    
    if (!clientId) {
      setErrors({ general: 'Client ID is required' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Create new action item via repository
      await repo.createActionItem({
        clientId,
        owner: formData.owner.trim(),
        text: formData.text.trim(),
        dueDate: formData.dueDate || null,
        status: formData.status,
      });

      setSuccessMessage('Action item created successfully!');
      
      // Redirect to client dashboard after short delay
      setTimeout(() => {
        navigate(`/node/${clientId}`);
      }, 1500);

    } catch (error: any) {
      console.error('Failed to create action item:', error);
      setErrors({ 
        general: error.message || 'Failed to create action item. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateActionItemData) => (
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

  const handleSelectChange = (field: keyof CreateActionItemData) => (
    e: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  if (!clientId || !client) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert severity="error">
          Client not found. Please navigate to this page from a client dashboard.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate(`/node/${clientId}`)} 
          sx={{ mr: 2 }}
        >
          Back to {client.name}
        </Button>
        <Typography variant="h4" component="h1">
          New Action Item
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

            <Alert severity="info">
              Adding action item for: <strong>{client.name}</strong>
            </Alert>

            <TextField
              label="Owner"
              value={formData.owner}
              onChange={handleInputChange('owner')}
              error={!!errors.owner}
              helperText={errors.owner || 'Who is responsible for this action? (e.g., Sales Rep, Customer, Account Manager)'}
              required
              fullWidth
              autoFocus
              disabled={isSubmitting}
            />

            <TextField
              label="Action Item"
              value={formData.text}
              onChange={handleInputChange('text')}
              error={!!errors.text}
              helperText={errors.text || 'What needs to be done?'}
              multiline
              rows={3}
              required
              fullWidth
              disabled={isSubmitting}
            />

            <TextField
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={handleInputChange('dueDate')}
              error={!!errors.dueDate}
              helperText={errors.dueDate || 'Optional due date'}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              disabled={isSubmitting}
            />

            <FormControl fullWidth disabled={isSubmitting}>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={handleSelectChange('status')}
              >
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="done">Done</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/node/${clientId}`)}
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
                {isSubmitting ? 'Creating...' : 'Create Action Item'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}