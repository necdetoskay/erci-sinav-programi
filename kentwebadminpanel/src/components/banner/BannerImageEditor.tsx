import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Slider,
  Grid,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Banner } from '../../types/banner.types';
import { BannerImagePreview } from './BannerImagePreview';

const ImageContainer = styled(Paper)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  paddingTop: '56.25%', // 16:9 aspect ratio
  overflow: 'hidden',
  backgroundColor: theme.palette.grey[100]
}));

const StyledImage = styled('img')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover'
});

const ControlsContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius
}));

interface BannerImageEditorProps {
  banner?: Partial<Banner>;
  bannerGroup?: {
    defaultDimensions?: {
      width: number;
      height: number;
      aspectRatio: string;
    }
  };
  onImageChange?: (file: File) => void;
  onCropChange?: (crop: { x: number; y: number; width: number; height: number }) => void;
  onZoomChange?: (zoom: number) => void;
}

export const BannerImageEditor: React.FC<BannerImageEditorProps> = ({
  banner,
  bannerGroup,
  onImageChange,
  onCropChange,
  onZoomChange
}) => {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 56.25 }); // 16:9 aspect ratio
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use dimensions from banner metadata, banner group, or default to 16:9
  const width = banner?.metadata?.dimensions?.width || bannerGroup?.defaultDimensions?.width || 1920;
  const height = banner?.metadata?.dimensions?.height || bannerGroup?.defaultDimensions?.height || 1080;
  const aspectRatio = banner?.metadata?.dimensions?.aspectRatio || bannerGroup?.defaultDimensions?.aspectRatio || '16:9';
  
  // Calculate aspect ratio percentage for container
  const aspectRatioPercentage = (height / width) * 100;

  useEffect(() => {
    if (banner?.imageUrl) {
      setPreviewUrl(banner.imageUrl);
    }
  }, [banner?.imageUrl]);

  // Update crop height based on aspect ratio when component mounts
  useEffect(() => {
    setCrop(prev => ({ 
      ...prev, 
      height: aspectRatioPercentage 
    }));
  }, [aspectRatioPercentage]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsLoading(true);

    try {
      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Lütfen geçerli bir resim dosyası yükleyin.');
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Dosya boyutu 5MB\'dan küçük olmalıdır.');
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
      setImage(file);
      onImageChange?.(file);

      // Reset crop and zoom
      setCrop({ x: 0, y: 0, width: 100, height: 56.25 });
      setZoom(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleZoomChange = (_: Event, value: number | number[]) => {
    const newZoom = Array.isArray(value) ? value[0] : value;
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  };

  const handleCropChange = (newCrop: { x: number; y: number; width: number; height: number }) => {
    setCrop(newCrop);
    onCropChange?.(newCrop);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Önerilen boyut: {width}x{height}px ({aspectRatio})
        </Typography>
      </Box>

      <ImageContainer sx={{ paddingTop: `${aspectRatioPercentage}%` }}>
        {isLoading ? (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <CircularProgress />
          </Box>
        ) : previewUrl ? (
          <BannerImagePreview
            src={previewUrl}
            crop={crop}
            zoom={zoom}
            onCropChange={handleCropChange}
            aspectRatio={aspectRatio}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}
          >
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Resim yüklemek için tıklayın
            </Typography>
            <Button variant="contained" onClick={handleUploadClick}>
              Resim Seç
            </Button>
          </Box>
        )}
      </ImageContainer>

      {previewUrl && (
        <ControlsContainer>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography gutterBottom>Yakınlaştırma</Typography>
              <Slider
                value={zoom}
                onChange={handleZoomChange}
                min={0.5}
                max={3}
                step={0.1}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleUploadClick}
                fullWidth
              >
                Yeni Resim Seç
              </Button>
            </Grid>
          </Grid>
        </ControlsContainer>
      )}
    </Box>
  );
}; 