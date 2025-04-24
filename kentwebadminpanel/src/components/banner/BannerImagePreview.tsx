import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const PreviewContainer = styled(Paper)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  paddingTop: '56.25%', // 16:9 aspect ratio
  overflow: 'hidden',
  backgroundColor: theme.palette.grey[100]
}));

const PreviewImage = styled('img')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transition: 'transform 0.2s ease-in-out'
});

const CropOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  border: '2px dashed rgba(255, 255, 255, 0.8)',
  boxShadow: '0 0 0 2000px rgba(0, 0, 0, 0.5)',
  pointerEvents: 'none'
});

// Add aspect ratio guide lines
const AspectRatioGuides = styled(Box)({
  position: 'absolute',
  top: '33.33%',
  left: 0,
  width: '100%',
  height: '33.33%',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  pointerEvents: 'none',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-33.33%',
    left: '33.33%',
    width: '33.33%',
    height: '166.66%',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  }
});

interface BannerImagePreviewProps {
  src: string;
  crop: { x: number; y: number; width: number; height: number };
  zoom: number;
  onCropChange: (crop: { x: number; y: number; width: number; height: number }) => void;
  aspectRatio?: string;
}

export const BannerImagePreview: React.FC<BannerImagePreviewProps> = ({
  src,
  crop,
  zoom,
  onCropChange,
  aspectRatio = '16:9'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate the correct height for the aspect ratio
  const getAspectRatioHeight = (): number => {
    if (!aspectRatio) return 100;
    
    const [width, height] = aspectRatio.split(':').map(Number);
    if (!width || !height) return 100;
    
    return (height / width) * 100;
  };

  // Initialize crop with correct aspect ratio
  useEffect(() => {
    // Only set initial crop if it hasn't been set yet
    if (crop.width === 100 && crop.height === 100) {
      onCropChange({
        x: crop.x,
        y: crop.y,
        width: 100,
        height: getAspectRatioHeight()
      });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.y) / rect.height) * 100;

    onCropChange({
      x: Math.max(-50, Math.min(50, crop.x + dx)),
      y: Math.max(-50, Math.min(50, crop.y + dy)),
      width: 100, // Always 100% width
      height: getAspectRatioHeight() // Height based on aspect ratio
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, crop]);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <PreviewContainer
        ref={containerRef}
        onMouseDown={handleMouseDown}
        sx={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <PreviewImage
          src={src}
          style={{
            transform: `translate(-${crop.x}%, -${crop.y}%) scale(${zoom})`
          }}
        />
        <CropOverlay />
        <AspectRatioGuides />
      </PreviewContainer>
    </Box>
  );
}; 