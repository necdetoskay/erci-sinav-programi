markdown
# 🚀 Modern Banner Sistemi Master Planı

---

## 🌐 **Teknik Mimari**
- **Frontend:** React.js + TypeScript, Framer Motion (animasyon), Chart.js (istatistik)  
- **Backend:** Node.js/Express veya NestJS, MongoDB/PostgreSQL, Redis (cache)  
- **Deployment:** Docker + AWS ECS (backend), Vercel/Netlify (frontend)  
- **Monitoring:** Sentry (hata takibi), Google Lighthouse (performans)

---

## 🗄️ **Backend Yapısı**

### 1. Veri Modelleri
#### **Banner Modeli (`banners` tablosu)**
```json
{
  "id": "UUID",
  "imageUrl": "string (CDN link)",
  "order": "number",
  "startDate": "ISO timestamp",
  "endDate": "ISO timestamp",
  "targetUrl": "string",
  "isActive": "boolean",
  "metadata": {
    "altText": "string",
    "animationType": "fade|slide|zoom",
    "backgroundColor": "#HEX"
  }
}
Tıklama İstatistiği Modeli (banner_clicks tablosu)
json
{
  "bannerId": "UUID",
  "timestamp": "ISO timestamp",
  "userAgent": "string",
  "ipAddress": "string (anonim)",
  "referrer": "string",
  "location": {
    "country": "string",
    "city": "string"
  }
}
2. API Endpoint'leri
Endpoint	Açıklama
GET /api/banners/active	Aktif banner'ları sıralı döner.
POST /api/banners/clicks	Tıklama verisini kaydeder.
GET /api/banners/stats	İstatistikleri döner (filtreli).
🎨 Frontend Implementasyonu
1. Temel Bileşenler
tsx
// BannerSlider.tsx
import { motion } from 'framer-motion';

const BannerSlider = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Otomatik geçiş (5 saniye)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  return (
    <div className="banner-container">
      <motion.img
        key={banners[currentIndex]?.id}
        src={banners[currentIndex]?.imageUrl}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        onClick={trackClick}
      />
      <ProgressBar duration={5000} />
    </div>
  );
};
2. Animasyon Türleri
css
/* fade */
.fade-enter { opacity: 0; }
.fade-enter-active { opacity: 1; transition: opacity 500ms; }

/* slide */
.slide-enter { transform: translateX(100%); }
.slide-enter-active { transform: translateX(0); transition: transform 500ms; }
3. Tıklama Takip Sistemi
ts
// tracking.ts
export const trackClick = async (bannerId: string) => {
  const clickData = {
    bannerId,
    referrer: document.referrer,
    userAgent: navigator.userAgent,
  };

  await fetch('/api/banners/clicks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clickData),
  });
};
📊 İstatistik Dashboard
1. Görselleştirme Örnekleri
tsx
// StatsDashboard.tsx
const StatsDashboard = () => {
  return (
    <div>
      <LineChart data={dailyClicksData} title="Günlük Tıklamalar" />
      <GeoChart data={countryData} />
      <DevicePieChart data={deviceData} />
    </div>
  );
};
2. Veri Analizi Endpoint'i
json
// GET /api/banners/stats?bannerId=123
{
  "totalClicks": 2345,
  "topCountries": [
    { "country": "TR", "clicks": 1567 },
    { "country": "US", "clicks": 432 }
  ],
  "deviceBreakdown": {
    "mobile": 65,
    "desktop": 35
  }
}
⚙️ Optimizasyon & Güvenlik
1. Backend
Caching: Redis ile aktif banner'ları 5 dakika önbelleğe al.

Rate Limiting: Tıklama API'sine dakikada 10 istek sınırı.

GDPR Uyumu: IP adreslerini anonimleştir (192.168.1.123 → 192.168.1.0).

2. Frontend
Resim Optimizasyonu:

html
<img 
  src="banner.jpg" 
  srcset="banner-400.jpg 400w, banner-800.jpg 800w"
  loading="lazy"
/>
Hata Yönetimi:

tsx
<ErrorBoundary fallback={<FallbackBanner />}>
  <BannerSlider />
</ErrorBoundary>
🚀 Geliştirme Roadmap'i
1. MVP (2 Hafta)
Temel banner rotasyonu

Tıklama takibi

Basit admin paneli

2. Animasyonlar (1 Hafta)
Fade/slide/zoom efektleri

Progress bar entegrasyonu

3. İstatistikler (2 Hafta)
Dashboard tasarımı

Coğrafi dağılım haritası

4. İleri Seviye (3+ Hafta)
A/B Testing

Real-time veri güncellemeleri (WebSocket)

Kullanıcı segmentasyonu

🔧 Önerilen Araçlar
Kategori	Araçlar
Animasyon	Framer Motion, react-spring
Grafikler	Chart.js, D3.js, react-simple-maps
Deployment	Docker, AWS ECS, Vercel
Test	Cypress, Jest, Postman
