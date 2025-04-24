import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Toolbar, 
  Typography, 
  useTheme,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import { AccountCircle, Logout, Menu as MenuIcon } from '@mui/icons-material';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const SIDEBAR_WIDTH = 250; // Sidebar genişliği
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Üst menü - Tam genişlikte */}
      <AppBar 
        position="fixed" 
        sx={{ 
          width: '100%',
          left: 0,
          right: 0,
          zIndex: theme.zIndex.drawer + 2,
          boxShadow: 3
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleSidebar}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              noWrap 
              component="div"
              onClick={() => navigate('/')}
              sx={{ 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Kent Konut Yönetim Paneli
            </Typography>
          </Box>
          
          <div>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              {user?.name ? (
                <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 32, height: 32 }}>
                  {user.name.charAt(0)}
                </Avatar>
              ) : (
                <AccountCircle />
              )}
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={open}
              onClose={handleClose}
            >
              {user && (
                <>
                  <MenuItem disabled>
                    <Typography variant="body2">
                      {user.name}
                    </Typography>
                  </MenuItem>
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </MenuItem>
                  <Divider />
                </>
              )}
              <MenuItem onClick={handleLogout}>
                <Logout fontSize="small" sx={{ mr: 1 }} />
                Çıkış Yap
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      
      {/* Sol menü - Kalıcı olarak gösteriliyor (masaüstü) ve geçici olarak (mobil) */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Ana içerik - Sidebar'ın yanında */}
      <Box
        component="main"
        sx={{
          position: 'absolute',
          left: '300px', // 250px (menü) + 50px (boşluk)
          right: 0,
          top: '64px',
          bottom: 0,
          width: 'auto',
          p: 0,
          m: 0
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 