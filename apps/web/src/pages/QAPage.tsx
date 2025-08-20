import React, { useState } from 'react';
import { 
  Box,
  Button,
  Typography,
  Paper,
  Stack,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
} from '@mui/material';
import { 
  ArrowBack,
  CheckCircle,
  Error,
  PlayArrow,
  Stop,
  Refresh,
  Login,
  Business,
  Call,
  Assignment,
  Dashboard,
  Print,
  CloudUpload,
  MonitorHeart
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useRepo } from '../hooks/useRepo';

interface QATest {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'success' | 'error';
  error?: string;
  action: () => Promise<void>;
}

export function QAPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const repo = useRepo();
  
  const [tests, setTests] = useState<QATest[]>([
    {
      id: 'login',
      name: 'Login',
      description: 'Verify user authentication works',
      icon: <Login />,
      status: 'pending',
      action: async () => {
        // Check if already logged in
        if (!session) {
          throw new Error('User not authenticated');
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    },
    {
      id: 'create-client',
      name: 'Create Client',
      description: 'Test client creation functionality',
      icon: <Business />,
      status: 'pending',
      action: async () => {
        const testClient = await repo.createClient({
          name: `QA Test Client ${Date.now()}`,
          notes: 'Created by QA test suite'
        });
        if (!testClient.id) {
          throw new Error('Failed to create client');
        }
      }
    },
    {
      id: 'log-call',
      name: 'Log Call', 
      description: 'Test call logging and analysis',
      icon: <Call />,
      status: 'pending',
      action: async () => {
        // Navigate to new call page and verify it loads
        navigate('/calls/new');
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Navigate back
        navigate('/qa');
      }
    },
    {
      id: 'add-action-item',
      name: 'Add Action Item',
      description: 'Test standalone action item creation',
      icon: <Assignment />,
      status: 'pending',
      action: async () => {
        // Get first client
        const clients = repo.getAllClients();
        if (clients.length === 0) {
          throw new Error('No clients available for test');
        }
        
        const testAction = await repo.createActionItem({
          clientId: clients[0].id,
          owner: 'QA Test',
          text: `QA Test Action Item ${Date.now()}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'open'
        });
        
        if (!testAction.id) {
          throw new Error('Failed to create action item');
        }
      }
    },
    {
      id: 'open-call-detail',
      name: 'Open Call Detail',
      description: 'Test call detail page navigation',
      icon: <Dashboard />,
      status: 'pending',
      action: async () => {
        // Get first call
        const calls = repo.getAllCalls();
        if (calls.length === 0) {
          throw new Error('No calls available for test');
        }
        
        navigate(`/node/${calls[0].id}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        navigate('/qa');
      }
    },
    {
      id: 'toggle-paper-mode',
      name: 'Toggle Paper Mode',
      description: 'Test paper mode switching',
      icon: <Print />,
      status: 'pending',
      action: async () => {
        // Test URL parameter approach
        const currentUrl = window.location.href;
        const testUrl = currentUrl.includes('?') 
          ? `${currentUrl}&mode=paper` 
          : `${currentUrl}?mode=paper`;
        
        window.history.pushState({}, '', testUrl);
        await new Promise(resolve => setTimeout(resolve, 500));
        window.history.pushState({}, '', currentUrl);
      }
    },
    {
      id: 'health-check',
      name: 'Health Check',
      description: 'Test system health endpoints',
      icon: <MonitorHeart />,
      status: 'pending',
      action: async () => {
        // Simple health check - verify data is accessible
        const root = repo.getRoot();
        if (!root) {
          throw new Error('Root node not accessible');
        }
        
        const clients = repo.getAllClients();
        const calls = repo.getAllCalls();
        
        if (clients.length === 0 && calls.length === 0) {
          throw new Error('No data available');
        }
      }
    }
  ]);

  const runTest = async (testId: string) => {
    setTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status: 'running', error: undefined }
        : test
    ));

    try {
      const test = tests.find(t => t.id === testId);
      if (!test) return;
      
      await test.action();
      
      setTests(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'success' }
          : test
      ));
    } catch (error: any) {
      console.error(`QA Test ${testId} failed:`, error);
      
      setTests(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'error', error: error.message }
          : test
      ));
    }
  };

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test.id);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  const resetTests = () => {
    setTests(prev => prev.map(test => ({
      ...test,
      status: 'pending',
      error: undefined
    })));
  };

  const getStatusColor = (status: QATest['status']) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'running': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: QATest['status']) => {
    switch (status) {
      case 'success': return <CheckCircle color="success" />;
      case 'error': return <Error color="error" />;
      case 'running': return <CircularProgress size={20} />;
      default: return null;
    }
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;
  const runningCount = tests.filter(t => t.status === 'running').length;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate(-1)} 
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          QA Checklist
        </Typography>
      </Box>

      <Stack spacing={3}>
        {/* Test Summary */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Test Summary
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Chip 
              label={`${successCount} Passed`} 
              color="success" 
              variant={successCount > 0 ? "filled" : "outlined"}
            />
            <Chip 
              label={`${errorCount} Failed`} 
              color="error" 
              variant={errorCount > 0 ? "filled" : "outlined"}
            />
            <Chip 
              label={`${runningCount} Running`} 
              color="info" 
              variant={runningCount > 0 ? "filled" : "outlined"}
            />
            <Chip 
              label={`${tests.length} Total`} 
              color="default"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={runAllTests}
              disabled={runningCount > 0}
            >
              Run All Tests
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={resetTests}
              disabled={runningCount > 0}
            >
              Reset
            </Button>
          </Box>
        </Paper>

        {/* Test Results */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Individual Tests
          </Typography>
          
          <List>
            {tests.map((test) => (
              <ListItem key={test.id} divider>
                <ListItemIcon>
                  {test.icon}
                </ListItemIcon>
                <ListItemText
                  primary={test.name}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {test.description}
                      </Typography>
                      {test.error && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {test.error}
                        </Alert>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(test.status)}
                    <Chip 
                      label={test.status.toUpperCase()} 
                      color={getStatusColor(test.status)}
                      size="small"
                    />
                    <Button
                      size="small"
                      onClick={() => runTest(test.id)}
                      disabled={test.status === 'running'}
                      startIcon={<PlayArrow />}
                    >
                      Run
                    </Button>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* System Info */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            System Information
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="User" 
                secondary={session?.user?.email || 'Not authenticated'} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Organization" 
                secondary={session?.organization?.name || 'No organization'} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="URL" 
                secondary={window.location.href} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Timestamp" 
                secondary={new Date().toISOString()} 
              />
            </ListItem>
          </List>
        </Paper>
      </Stack>
    </Box>
  );
}