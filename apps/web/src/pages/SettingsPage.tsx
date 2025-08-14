import { 
  Box, 
  Typography, 
  Paper, 
  Divider 
} from '@mui/material';
import { FileUploadButton } from '../shared/FileUploadButton';
import { ConfirmDialogButton } from '../shared/ConfirmDialogButton';

export function SettingsPage() {
  const handleFileSelect = (file: File) => {
    console.log('File uploaded:', file.name);
    // Handle file upload logic here
  };

  const handleDataClear = () => {
    console.log('Data cleared');
    // Handle data clearing logic here
  };

  const handleExportData = () => {
    console.log('Data exported');
    // Handle data export logic here
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Configure your application settings and preferences
      </Typography>

      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mt: 2 
        }}
      >
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            File Management
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Upload files for analysis or configuration
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <FileUploadButton 
              onFileSelect={handleFileSelect}
              accept=".csv,.json,.txt"
            />
          </Box>
          
          <Typography variant="caption" display="block" color="textSecondary">
            Supported formats: CSV, JSON, TXT
          </Typography>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Data Management
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Manage your application data
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <ConfirmDialogButton
              buttonText="Export Data"
              dialogTitle="Export Data"
              dialogContent="This will export all your data to a downloadable file. Continue?"
              onConfirm={handleExportData}
              variant="contained"
              color="primary"
            />
            
            <ConfirmDialogButton
              buttonText="Clear All Data"
              dialogTitle="Clear All Data"
              dialogContent="This action cannot be undone. Are you sure you want to clear all data?"
              onConfirm={handleDataClear}
              variant="outlined"
              color="error"
            />
          </Box>
        </Paper>
      </Box>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Application Information
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2 
          }}
        >
          <Box>
            <Typography variant="body2" color="textSecondary">
              Version
            </Typography>
            <Typography variant="body1">
              1.0.0
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="textSecondary">
              Last Updated
            </Typography>
            <Typography variant="body1">
              {new Date().toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Description
          </Typography>
          <Typography variant="body1">
            Mudul Sales Call Analytics Dashboard - A comprehensive platform for analyzing and managing sales call data with AI-powered insights.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}