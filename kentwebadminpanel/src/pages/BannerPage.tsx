import React, { useEffect, useState } from 'react';
import BannerSlider from '../components/banner/BannerSlider';
import { getActiveBanners } from '../services/banner.service';
import { Banner } from '../components/banner/BannerSlider';
import '../components/banner/BannerSlider.css';

const BannerPage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const data = await getActiveBanners();
        setBanners(data);
        setError(null);
      } catch (err) {
        setError('Banner verileri yüklenirken bir hata oluştu');
        console.error('Banner yükleme hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  return (
    <div className="banner-page">
      <h1>Banner Gösterimi</h1>
      
      {loading && <div className="loading">Bannerlar yükleniyor...</div>}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {!loading && !error && (
        <div className="banner-container">
          {banners.length > 0 ? (
            <BannerSlider 
              banners={banners}
              interval={5000}
              showProgress={true}
              showNavigation={true}
            />
          ) : (
            <div className="no-banners">
              Gösterilecek aktif banner bulunamadı.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BannerPage; 