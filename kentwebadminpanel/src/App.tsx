import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Dashboard from './pages/Dashboard';
import BannerManagementPage from './pages/admin/BannerManagementPage';
import BannerStatsPage from './pages/admin/BannerStatsPage';
import BannerGroupsPage from './pages/admin/BannerGroupsPage';
import BannerGroupDetailPage from './pages/admin/BannerGroupDetailPage';
import { SnackbarProvider } from 'notistack';
import { CircularProgress, Box } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if token exists but is expired or invalid
    const token = localStorage.getItem('token');
    if (token) {
      // Check if the token is about to expire by decoding it
      try {
        // Simple JWT check (this is not a full JWT decoding)
        // A proper implementation would decode the token and check its expiration
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.warn('Token expired, logging out');
            logout();
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Error checking token:', error);
      }
    }
  }, [logout, navigate]);
  
  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <Router>
          <Routes>
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginForm />
            } />
            <Route path="/register" element={
              isAuthenticated ? <Navigate to="/" replace /> : <RegisterForm />
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Banner Management Routes */}
            <Route path="/banners" element={
              <ProtectedRoute>
                <Layout>
                  <BannerManagementPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/banners/stats" element={
              <ProtectedRoute>
                <Layout>
                  <BannerStatsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Banner Groups Routes */}
            <Route path="/admin/banner-groups" element={
              <ProtectedRoute>
                <Layout>
                  <BannerGroupsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/banner-group/:groupId" element={
              <ProtectedRoute>
                <Layout>
                  <BannerGroupDetailPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/banner-groups/edit/:groupId" element={
              <ProtectedRoute>
                <Layout>
                  <BannerGroupsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/banner-group/:groupId/add" element={
              <ProtectedRoute>
                <Layout>
                  <BannerManagementPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/banner-group/:groupId/edit/:bannerId" element={
              <ProtectedRoute>
                <Layout>
                  <BannerManagementPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Legacy redirects */}
            <Route path="/carousel" element={
              <Navigate to="/banners" replace />
            } />
          </Routes>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App; 