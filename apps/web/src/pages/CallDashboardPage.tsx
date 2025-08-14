import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Alert,
  Button
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useEffect } from 'react';

export function CallDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // This page is deprecated - redirect to the node-based route
    if (id) {
      // Try to map old call IDs to new node IDs
      const callIdMap: Record<string, string> = {
        '1': 'call-acme-1',
        '2': 'call-beta-2', 
        '3': 'call-acme-2',
        '4': 'call-beta-1',
        '5': 'call-gamma-1'
      };
      
      const nodeId = callIdMap[id];
      if (nodeId) {
        navigate(`/node/${nodeId}`, { replace: true });
        return;
      }
    }
  }, [id, navigate]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/calls')} sx={{ mr: 1 }}>
          Back to Calls
        </Button>
      </Box>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Legacy Call Dashboard
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This legacy call dashboard route has been replaced with the new node-based routing system. 
        Individual calls can now be accessed through the sidebar navigation or from the calls list.
      </Alert>
      
      <Alert severity="warning">
        Call ID "{id}" could not be mapped to the new system. Please use the sidebar navigation or the calls page to access specific call dashboards.
      </Alert>
    </Box>
  );
}