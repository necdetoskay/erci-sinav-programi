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

  // Static export'u devre dışı bırak
  output: 'standalone',

  // Static export sırasında oluşan hataları görmezden gel
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,

  // Runtime config - client tarafında erişilebilir environment değişkenleri
  publicRuntimeConfig: {
    appUrl: process.env.PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  experimental: {
    // Deneysel özellikler
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
