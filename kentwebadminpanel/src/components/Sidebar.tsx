import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Button,
  Typography,
  Collapse,
} from '@mui/material';
import ViewCarousel from '@mui/icons-material/ViewCarousel';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ImageIcon from '@mui/icons-material/Image';
import BarChartIcon from '@mui/icons-material/BarChart';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [openBanners, setOpenBanners] = React.useState(
    location.pathname.includes('/banner')
  );

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleBannersMenu = () => {
    setOpenBanners(!openBanners);
  };

  return (
    <Drawer
      variant="permanent"
      open={true}
      sx={{
        display: { xs: 'block' },
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          marginTop: '64px', // AppBar yüksekliği
          height: 'calc(100% - 64px)',
          top: 0,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <List>
        <ListItem 
          button 
          onClick={() => handleNavigation('/')}
          selected={location.pathname === '/'}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        
        {/* Banner Yönetimi */}
        <ListItem 
          button 
          onClick={toggleBannersMenu}
        >
          <ListItemIcon>
            <ViewCarousel />
          </ListItemIcon>
          <ListItemText primary="Banner Yönetimi" />
          {openBanners ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        
        <Collapse in={openBanners} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem 
              button 
              onClick={() => handleNavigation('/banners')}
              selected={location.pathname === '/banners'}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <ImageIcon />
              </ListItemIcon>
              <ListItemText primary="Bannerlar" />
            </ListItem>
            
            <ListItem 
              button 
              onClick={() => handleNavigation('/banners/stats')}
              selected={location.pathname === '/banners/stats'}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <BarChartIcon />
              </ListItemIcon>
              <ListItemText primary="İstatistikler" />
            </ListItem>
          </List>
        </Collapse>
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Çıkış Yap
        </Button>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 