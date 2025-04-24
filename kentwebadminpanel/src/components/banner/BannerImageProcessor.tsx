import React, { useState, useEffect } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';
import { Box, Button, Slider, Typography } from '@mui/material';
import 'react-image-crop/dist/ReactCrop.css';

interface BannerImageProcessorProps {
  image: File;
  onProcessed: (processedImages: {
    desktop: File;
    tablet: File;
    mobile: File;
  }) => void;
  onCancel: () => void;
}

const BANNER_SIZES = {
  desktop: { width: 1900, height: 1069 },
  tablet: { width: 1200, height: 675 },
  mobile: { width: 800, height: 450 }
};

const MAX_FILE_SIZE = 500 * 1024; // 500KB

export const BannerImageProcessor: React.FC<BannerImageProcessorProps> = ({
  image,
  onProcessed,
  onCancel
}) => {
  const [crop, setCrop] = useState<Crop>({ 
    x: 0, 
    y: 0, 
    width: 100, 
    height: 56.25,
    unit: '%'
  });
  const [zoom, setZoom] = useState(1);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(image);
  }, [image]);

  const processImage = async () => {
    setProcessing(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.src = imageUrl;
      await new Promise(resolve => img.onload = resolve);

      // Kırpma işlemi
      canvas.width = BANNER_SIZES.desktop.width;
      canvas.height = BANNER_SIZES.desktop.height;

      ctx?.drawImage(img, 
        crop.x * img.width / 100,
        crop.y * img.height / 100,
        crop.width * img.width / 100,
        crop.height * img.height / 100,
        0, 0, BANNER_SIZES.desktop.width, BANNER_SIZES.desktop.height
      );

      // Canvas'ı buffer'a dönüştür
      const buffer = await new Promise<Buffer>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            blob.arrayBuffer().then(buffer => resolve(Buffer.from(buffer)));
          }
        }, 'image/jpeg', 0.85);
      });

      // Farklı boyutlarda optimize et
      const processedImages = {
        desktop: await optimizeImage(buffer, BANNER_SIZES.desktop),
        tablet: await optimizeImage(buffer, BANNER_SIZES.tablet),
        mobile: await optimizeImage(buffer, BANNER_SIZES.mobile)
      };

      // Dosyaları oluştur
      const files = {
        desktop: new File([processedImages.desktop], `desktop-${image.name}`, { type: 'image/webp' }),
        tablet: new File([processedImages.tablet], `tablet-${image.name}`, { type: 'image/webp' }),
        mobile: new File([processedImages.mobile], `mobile-${image.name}`, { type: 'image/webp' })
      };

      onProcessed(files);
    } catch (error) {
      console.error('Image processing error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const optimizeImage = async (buffer: Buffer, size: { width: number; height: number }) => {
    let quality = 85;
    let outputBuffer = buffer;

    // Dosya boyutu kontrolü
    while (outputBuffer.length > MAX_FILE_SIZE && quality > 50) {
      quality -= 5;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = size.width;
      canvas.height = size.height;
      
      const img = new Image();
      img.src = URL.createObjectURL(new Blob([buffer]));
      await new Promise(resolve => img.onload = resolve);
      
      ctx?.drawImage(img, 0, 0, size.width, size.height);
      
      outputBuffer = await new Promise<Buffer>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            blob.arrayBuffer().then(buffer => resolve(Buffer.from(buffer)));
          }
        }, 'image/jpeg', quality / 100);
      });
    }

    return outputBuffer;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Banner Resmi Düzenle
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <ReactCrop
          crop={crop}
          onChange={c => setCrop(c)}
          aspect={16/9}
          minWidth={100}
          minHeight={56.25}
        >
          <img src={imageUrl} style={{ maxWidth: '100%' }} />
        </ReactCrop>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Yakınlaştırma</Typography>
        <Slider
          value={zoom}
          onChange={(_, value) => setZoom(value as number)}
          min={1}
          max={3}
          step={0.1}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={processImage}
          disabled={processing}
        >
          {processing ? 'İşleniyor...' : 'Kaydet'}
        </Button>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={processing}
        >
          İptal
        </Button>
      </Box>
    </Box>
  );
}; 