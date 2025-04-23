import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import BannerProgressBar from './BannerProgressBar';
import './BannerSlider.css';

interface Banner {
  id: number;
  imageUrl: string;
  targetUrl?: string;
  metadata?: {
    backgroundColor?: string;
    altText?: string;
    progressBar?: {
      show: boolean;
      position: 'top' | 'bottom';
      style: 'linear' | 'circular';
      color: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
      thickness: number;
    };
  };
}

interface BannerSliderProps {
  banners: Banner[];
  interval?: number;
  showProgress?: boolean;
  showNavigation?: boolean;
  height?: string | number;
}

const BannerSlider: React.FC<BannerSliderProps> = ({
  banners,
  interval = 5000,
  showProgress = true,
  showNavigation = true,
  height = 'auto'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(Date.now());

  // Otomatik geçiş ve progress bar güncelleme
  useEffect(() => {
    if (banners.length <= 1) return;

    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const newProgress = (elapsed / interval) * 100;

      if (newProgress >= 100) {
        // Progress %100'e ulaştığında sonraki banner'a geç
        setCurrentIndex((prev) => (prev + 1) % banners.length);
        setProgress(0);
        startTimeRef.current = Date.now();
      } else {
        setProgress(newProgress);
      }
    };

    // Her 100ms'de bir progress'i güncelle
    timerRef.current = setInterval(updateProgress, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentIndex, interval, banners.length]);

  // Banner değiştiğinde progress'i sıfırla
  useEffect(() => {
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [currentIndex]);

  const currentBanner = banners[currentIndex];
  const progressBarConfig = currentBanner?.metadata?.progressBar || {
    show: true,
    position: 'bottom' as const,
    style: 'linear' as const,
    color: 'primary' as const,
    thickness: 4
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: height,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="banner-slider">
        <div className="banner-slider__container">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`banner-slider__item ${index === currentIndex ? 'active' : ''}`}
              style={{
                backgroundImage: `url(${banner.imageUrl})`,
                backgroundColor: banner.metadata?.backgroundColor || '#000',
                opacity: index === currentIndex ? 1 : 0,
                transition: 'opacity 0.5s ease-in-out'
              }}
            >
              <a href={banner.targetUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={banner.imageUrl}
                  alt={banner.metadata?.altText || 'Banner'}
                  className="banner-slider__image"
                />
              </a>
            </div>
          ))}
        </div>

        {showProgress && progressBarConfig.show && (
          <BannerProgressBar
            progress={progress}
            position={progressBarConfig.position}
            style={progressBarConfig.style}
            color={progressBarConfig.color}
            thickness={progressBarConfig.thickness}
          />
        )}

        {showNavigation && banners.length > 1 && (
          <>
            <button
              className="banner-slider__nav banner-slider__nav--prev"
              onClick={() => {
                setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
                setProgress(0);
                startTimeRef.current = Date.now();
              }}
            >
              &lt;
            </button>
            <button
              className="banner-slider__nav banner-slider__nav--next"
              onClick={() => {
                setCurrentIndex((prev) => (prev + 1) % banners.length);
                setProgress(0);
                startTimeRef.current = Date.now();
              }}
            >
              &gt;
            </button>
          </>
        )}
      </div>
    </Box>
  );
};

export type { Banner };
export default BannerSlider; 