import React, { useState } from 'react';
import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Drawer, 
  IconButton, 
  Toolbar, 
  Typography, 
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Brightness4, 
  Brightness7,
  Dashboard,
  Call,
  Settings,
} from '@mui/icons-material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Outlet, useNavigate } from 'react-router-dom';

const drawerWidth = 280;

interface AppShellProps {
  isDark: boolean;
  onThemeToggle: () => void;
}

export function AppShell({ isDark, onThemeToggle }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // Sample calls data for navigation - in a real app this would come from an API
  const callsData = [
    { id: 1, title: 'Discovery Call - Acme Corp', participant: 'John Smith' },
    { id: 2, title: 'Demo Call - TechStart', participant: 'Sarah Johnson' },
    { id: 3, title: 'Follow-up - Global Inc', participant: 'Mike Wilson' },
    { id: 4, title: 'Pricing Discussion - StartupXYZ', participant: 'Lisa Chen' },
    { id: 5, title: 'Technical Review - Enterprise Co', participant: 'David Brown' },
    { id: 6, title: 'Initial Contact - Innovation Ltd', participant: 'Emma Davis' },
    { id: 7, title: 'Contract Discussion - MegaCorp', participant: 'Robert Taylor' },
    { id: 8, title: 'Support Call - Current Customer', participant: 'Jennifer Lee' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleItemClick = (_event: React.SyntheticEvent, itemId: string) => {
    switch (itemId) {
      case 'dashboard':
        navigate('/');
        break;
      case 'calls':
        navigate('/calls');
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        // Handle individual call navigation (format: call-{id})
        if (itemId.startsWith('call-')) {
          const callId = itemId.replace('call-', '');
          navigate(`/calls/${callId}`);
        }
        break;
    }
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawerContent = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Mudul
        </Typography>
      </Toolbar>
      <Box sx={{ p: 2 }}>
        <SimpleTreeView 
          onItemClick={handleItemClick}
          defaultExpandedItems={['root', 'calls']}
        >
          <TreeItem itemId="root" label="Navigation">
            <TreeItem 
              itemId="dashboard" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Dashboard fontSize="small" />
                  Dashboard
                </Box>
              } 
            />
            <TreeItem 
              itemId="calls" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Call fontSize="small" />
                  Calls
                </Box>
              } 
            >
              {callsData.map((call) => (
                <TreeItem
                  key={call.id}
                  itemId={`call-${call.id}`}
                  label={
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      py: 0.5
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        Call #{call.id}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="textSecondary"
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '200px'
                        }}
                      >
                        {call.participant}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </TreeItem>
            <TreeItem 
              itemId="settings" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Settings fontSize="small" />
                  Settings
                </Box>
              } 
            />
          </TreeItem>
        </SimpleTreeView>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
          <IconButton color="inherit" onClick={onThemeToggle}>
            {isDark ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { md: `calc(100% - ${drawerWidth}px)` } 
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}