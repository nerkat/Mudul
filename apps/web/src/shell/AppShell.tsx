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
  Business,
  Call,
  Settings,
} from '@mui/icons-material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Outlet, useNavigate } from 'react-router-dom';
import { useRepo } from '../hooks/useRepo';

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
  const repo = useRepo();

  // Get the tree data from repo
  const root = repo.getRoot();
  const clients = root ? repo.getChildren(root.id) : [];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleItemClick = (_event: React.SyntheticEvent, itemId: string) => {
    if (itemId === 'dashboard') {
      navigate('/');
    } else if (itemId === 'settings') {
      navigate('/settings');
    } else {
      // Navigate to node
      navigate(`/node/${itemId}`);
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
          defaultExpandedItems={['navigation', ...(root ? [root.id] : []), ...clients.map(c => c.id)]}
        >
          <TreeItem itemId="navigation" label="Navigation">
            <TreeItem 
              itemId="dashboard" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Dashboard fontSize="small" />
                  Overview
                </Box>
              } 
            />
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
          
          {root && (
            <TreeItem 
              itemId={root.id} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business fontSize="small" />
                  {root.name}
                </Box>
              }
            >
              {clients.map((client) => {
                const calls = repo.getChildren(client.id);
                return (
                  <TreeItem
                    key={client.id}
                    itemId={client.id}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business fontSize="small" />
                        {client.name}
                      </Box>
                    }
                  >
                    {calls.map((call) => (
                      <TreeItem
                        key={call.id}
                        itemId={call.id}
                        label={
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 1,
                            py: 0.5
                          }}>
                            <Call fontSize="small" />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {call.name}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    ))}
                  </TreeItem>
                );
              })}
            </TreeItem>
          )}
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
            Mudul
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