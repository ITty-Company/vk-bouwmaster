import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // i18n configuration removed for App Router compatibility
  // We handle internationalization through our custom translation system
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vkbouwmaster.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.vkbouwmaster.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vk-bouwmaster.onrender.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ["image/avif", "image/webp"],
    /** Дольше кэшируем оптимизированные файлы на CDN/edge (меньше повторных запросов). */
    minimumCacheTTL: 60 * 60 * 24 * 7,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Разрешаем неоптимизированные изображения для локальных файлов
    unoptimized: false,
  },
};

export default nextConfig;
