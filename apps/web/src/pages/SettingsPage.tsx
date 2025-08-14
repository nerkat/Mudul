import {
  Box,
  Typography,
  Paper,
} from '@mui/material';
import { FileUploadButton } from '../shared/FileUploadButton';
import { ConfirmDialogButton } from '../shared/ConfirmDialogButton';

export function SettingsPage() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Configure your application settings and preferences.
      </Typography>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 3
      }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            File Upload
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Upload files for processing and analysis.
          </Typography>
          <FileUploadButton />
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            System Actions
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Perform system maintenance and configuration actions.
          </Typography>
          <ConfirmDialogButton />
        </Paper>
      </Box>
    </Box>
  );
}