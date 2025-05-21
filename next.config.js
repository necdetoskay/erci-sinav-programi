/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false, // X-Powered-By header'ı kaldır (güvenlik için)

  // Hata kontrollerini devre dışı bırak
  typescript: {
    // Tüm ortamlarda TypeScript hatalarını görmezden gel
    ignoreBuildErrors: true,
  },
  eslint: {
    // Tüm ortamlarda ESLint hatalarını görmezden gel
    ignoreDuringBuilds: true,
  },

  // Standalone output aktif
  output: 'standalone',

  // Static export sırasında oluşan hataları görmezden gel
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,

  // Runtime config - client tarafında erişilebilir environment değişkenleri
  publicRuntimeConfig: {
    appUrl: process.env.PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Webpack yapılandırması
  webpack: (config, { isServer }) => {
    // UI bileşenlerinin doğru şekilde çözümlenmesini sağla
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': require('path').resolve(__dirname, './components'),
      '@/lib': require('path').resolve(__dirname, './lib'),
      '@/hooks': require('path').resolve(__dirname, './hooks'),
      '@/providers': require('path').resolve(__dirname, './providers'),
    };

    // Eksik modülleri görmezden gel
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    return config;
  },

  experimental: {
    // Deneysel özellikler
    esmExternals: 'loose', // ESM modüllerini daha esnek bir şekilde işle
  },

  // Güvenlik başlıkları
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
