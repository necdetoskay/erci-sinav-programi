import React from 'react';
import { Box, LinearProgress, CircularProgress } from '@mui/material';

interface BannerProgressBarProps {
  progress: number;
  position?: 'top' | 'bottom';
  style?: 'linear' | 'circular';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  thickness?: number;
}

const BannerProgressBar: React.FC<BannerProgressBarProps> = ({
  progress,
  position = 'bottom',
  style = 'linear',
  color = 'primary',
  thickness = 4
}) => {
  if (style === 'circular') {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2
        }}
      >
        <CircularProgress
          variant="determinate"
          value={progress}
          color={color}
          thickness={thickness}
          size={60}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        [position]: 0,
        zIndex: 2,
        width: '100%',
        height: thickness,
        backgroundColor: 'rgba(255, 255, 255, 0.2)'
      }}
    >
      <LinearProgress
        variant="determinate"
        value={progress}
        color={color}
        sx={{
          height: '100%',
          backgroundColor: 'transparent',
          '& .MuiLinearProgress-bar': {
            transition: 'transform 0.1s linear'
          }
        }}
      />
    </Box>
  );
};

export default BannerProgressBar; 