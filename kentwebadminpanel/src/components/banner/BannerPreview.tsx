import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import BannerSlider from './BannerSlider';
import { Banner } from './BannerSlider';

interface BannerPreviewProps {
  banners: Banner[];
  onClose: () => void;
}

const BannerPreview: React.FC<BannerPreviewProps> = ({ banners, onClose }) => {
  // Aktif bannerları al ve progress bar ayarlarını ekle
  const activeBanners = banners.map(banner => ({
    ...banner,
    metadata: {
      ...banner.metadata,
      progressBar: {
        show: true,
        position: 'bottom' as const,
        style: 'linear' as const,
        color: 'primary' as const,
        thickness: 4,
        ...banner.metadata?.progressBar
      }
    }
  }));

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300
      }}
      onClick={onClose}
    >
      <Paper
        sx={{
          width: '80%',
          maxWidth: '1200px',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          p: 2
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="h6" gutterBottom>
          Banner Önizleme
        </Typography>
        
        {/* Web sitesi header simülasyonu */}
        <Box
          sx={{
            height: '60px',
            bgcolor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            px: 2,
            mb: 2,
            borderBottom: '1px solid #ddd'
          }}
        >
          <Typography variant="subtitle1">Web Sitesi Header</Typography>
        </Box>

        {/* Banner alanı */}
        <Box
          sx={{
            width: '100%',
            height: '400px',
            position: 'relative',
            overflow: 'hidden',
            mb: 2
          }}
        >
          <BannerSlider
            banners={activeBanners}
            interval={5000}
            showProgress={true}
            showNavigation={true}
            height="400px"
          />
        </Box>

        {/* Web sitesi içerik simülasyonu */}
        <Box
          sx={{
            p: 2,
            bgcolor: '#fff',
            border: '1px solid #ddd',
            borderRadius: 1
          }}
        >
          <Typography variant="body1">
            Web sitesi içerik alanı simülasyonu. Bu alan bannerların altında görünecek içeriği temsil eder.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default BannerPreview; 