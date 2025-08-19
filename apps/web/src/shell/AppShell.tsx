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
  Button,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard,
  Business,
  Call,
  Settings,
  Add,
  AccountCircle,
  Logout,
  Business as OrgIcon,
  ExpandMore,
} from '@mui/icons-material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Outlet, useNavigate } from 'react-router-dom';
import { useRepo } from '../hooks/useRepo';
import { useAuth } from '../auth/AuthContext';
import { useOrg } from '../auth/OrgContext';
import { ThemeSwitch } from '../components/ThemeSwitch';

const drawerWidth = 280;

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [orgMenuAnchor, setOrgMenuAnchor] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const repo = useRepo();
  const { user, logout, membership } = useAuth();
  const { currentOrg, availableOrgs, switchOrg } = useOrg();

  // Get the tree data from repo
  const root = repo.getRoot();
  const clients = root ? repo.getChildren(root.id) : [];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleOrgMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setOrgMenuAnchor(event.currentTarget);
  };

  const handleOrgMenuClose = () => {
    setOrgMenuAnchor(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleOrgSwitch = async (orgId: string) => {
    handleOrgMenuClose();
    try {
      await switchOrg(orgId);
    } catch (error) {
      console.error('Organization switch failed:', error);
    }
  };

  const handleItemClick = (_event: React.SyntheticEvent, itemId: string) => {
    if (itemId === 'dashboard') {
      // Navigate to org dashboard
      navigate('/node/root');
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
      <Box sx={{ p: theme.spacing(2) }}>
        <SimpleTreeView 
          onItemClick={handleItemClick}
          defaultExpandedItems={clients.map(c => c.id)}
        >
          <TreeItem 
            itemId="dashboard" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing(1) }}>
                <Dashboard fontSize="small" />
                Org Dashboard
              </Box>
            } 
          />
          <TreeItem 
            itemId="settings" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing(1) }}>
                <Settings fontSize="small" />
                Settings
              </Box>
            } 
          />
          
          {/* Divider and Projects Section */}
          <Box sx={{ 
            mx: theme.spacing(1), 
            my: theme.spacing(2), 
            borderTop: 1, 
            borderColor: 'divider' 
          }} />
          
          <Box sx={{ 
            px: theme.spacing(1), 
            pb: theme.spacing(1),
            color: 'text.secondary'
          }}>
            <Typography variant="overline" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
              Projects
            </Typography>
          </Box>
          
          {/* Direct client list without org nesting */}
          {clients.map((client) => {
            const calls = repo.getChildren(client.id);
            return (
              <TreeItem
                key={client.id}
                itemId={client.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing(1) }}>
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
                        gap: theme.spacing(1),
                        py: theme.spacing(0.5)
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
        </SimpleTreeView>
        
        {/* New Call Button */}
        <Box sx={{ mt: theme.spacing(2) }}>
          <Button
            component="a"
            href="/calls/new"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              navigate('/calls/new');
              if (isMobile) {
                setMobileOpen(false);
              }
            }}
            variant="contained"
            startIcon={<Add />}
            fullWidth
            sx={{ 
              borderRadius: theme.shape.borderRadius,
              textTransform: 'none',
              fontWeight: 'medium'
            }}
          >
            New Call
          </Button>
        </Box>
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
            sx={{ mr: theme.spacing(2), display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Mudul
          </Typography>
          
          {/* Organization Switcher */}
          <Box sx={{ mr: 2 }}>
            <Button
              color="inherit"
              onClick={handleOrgMenuOpen}
              startIcon={<OrgIcon />}
              endIcon={<ExpandMore />}
              sx={{ 
                textTransform: 'none',
                borderRadius: 1,
                px: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              {currentOrg?.name || 'No Organization'}
            </Button>
            <Menu
              anchorEl={orgMenuAnchor}
              open={Boolean(orgMenuAnchor)}
              onClose={handleOrgMenuClose}
              MenuListProps={{
                'aria-labelledby': 'org-button',
              }}
            >
              {availableOrgs.map((org) => (
                <MenuItem 
                  key={org.id} 
                  onClick={() => handleOrgSwitch(org.id)}
                  selected={org.id === currentOrg?.id}
                >
                  <ListItemIcon>
                    <OrgIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={org.name} />
                  {org.id === currentOrg?.id && (
                    <Chip size="small" label="Current" sx={{ ml: 1 }} />
                  )}
                </MenuItem>
              ))}
              <Divider />
              <MenuItem disabled>
                <ListItemText 
                  primary="Multi-org coming soon" 
                  primaryTypographyProps={{ 
                    variant: 'caption',
                    color: 'text.secondary'
                  }}
                />
              </MenuItem>
            </Menu>
          </Box>

          <ThemeSwitch />
          
          {/* User Menu */}
          <Box sx={{ ml: 2 }}>
            <IconButton
              color="inherit"
              onClick={handleUserMenuOpen}
              sx={{ p: 0 }}
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || <AccountCircle />
                )}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              MenuListProps={{
                'aria-labelledby': 'user-button',
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" noWrap>
                  {user?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user?.email}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip 
                    size="small" 
                    label={membership?.role === 'owner' ? 'Owner' : 'Viewer'}
                    color={membership?.role === 'owner' ? 'primary' : 'default'}
                    variant="outlined"
                  />
                </Box>
              </Box>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Sign out" />
              </MenuItem>
            </Menu>
          </Box>
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
          p: theme.spacing(3), 
          width: { md: `calc(100% - ${drawerWidth}px)` } 
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}