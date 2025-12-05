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
    ],
    // Разрешаем неоптимизированные изображения для локальных файлов
    unoptimized: false,
  },
};

export default nextConfig;
