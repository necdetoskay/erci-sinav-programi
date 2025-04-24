import React, { useState, useEffect } from 'react';
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupsIcon from '@mui/icons-material/Groups';
import LogoutIcon from '@mui/icons-material/Logout';
import CollectionsIcon from '@mui/icons-material/Collections';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import BarChartIcon from '@mui/icons-material/BarChart';
import FolderIcon from '@mui/icons-material/Folder';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [openBanners, setOpenBanners] = useState(
    location.pathname.includes('/admin/banner') || 
    location.pathname.includes('/admin/banner-group')
  );

  useEffect(() => {
    setOpenBanners(
      location.pathname.includes('/admin/banner') || 
      location.pathname.includes('/admin/banner-group')
    );
  }, [location.pathname]);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" component="div">
          Kent Konut Admin
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/admin/dashboard')}
            selected={location.pathname === '/admin/dashboard'}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        {/* Banner Management Section with collapsible menu */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setOpenBanners(!openBanners)}>
            <ListItemIcon>
              <CollectionsIcon />
            </ListItemIcon>
            <ListItemText primary="Banner Yönetimi" />
            {openBanners ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openBanners} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem disablePadding>
              <ListItemButton
                sx={{ pl: 4 }}
                onClick={() => handleNavigation('/admin/banner-groups')}
                selected={location.pathname === '/admin/banner-groups'}
              >
                <ListItemIcon>
                  <FolderIcon />
                </ListItemIcon>
                <ListItemText primary="Banner Grupları" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                sx={{ pl: 4 }}
                onClick={() => handleNavigation('/admin/banner-stats')}
                selected={location.pathname === '/admin/banner-stats'}
              >
                <ListItemIcon>
                  <BarChartIcon />
                </ListItemIcon>
                <ListItemText primary="İstatistikler" />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>

        {/* User Management */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/admin/users')}
            selected={location.pathname === '/admin/users'}
          >
            <ListItemIcon>
              <GroupsIcon />
            </ListItemIcon>
            <ListItemText primary="Kullanıcı Yönetimi" />
          </ListItemButton>
        </ListItem>
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Çıkış Yap" />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );

  return (
    <>
      {/* Mobil görünüm için geçici (temporary) drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Mobil performansı için
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: 250,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Masaüstü görünüm için kalıcı (permanent) drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: 250,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 250,
            boxSizing: 'border-box',
            border: 'none',
            borderRight: 0,
            boxShadow: 'none',
            marginRight: 0,
            paddingRight: 0
          },
          '& .MuiPaper-root': {
            border: 'none', 
            borderRight: 'none'
          },
          borderRight: 0
        }}
        PaperProps={{ 
          elevation: 0, 
          style: { border: 'none', borderRight: 'none' } 
        }}
        open
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Sidebar; 