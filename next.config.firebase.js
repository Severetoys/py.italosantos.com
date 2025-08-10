/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  staticPageGenerationTimeout: 180,
  
  // Configuração para Firebase Hosting (export estático)
  output: process.env.FIREBASE_DEPLOY ? 'export' : undefined,
  trailingSlash: true,
  distDir: 'out',
  
  images: {
    // Desabilitar otimização de imagens para export estático
    unoptimized: process.env.FIREBASE_DEPLOY ? true : false,
    
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'graph.facebook.com',
      },
      {
        protocol: 'https',
        hostname: 'scontent.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'instagram.com',
      },
      {
        protocol: 'https',
        hostname: 'www.instagram.com',
      },
      {
        protocol: 'https',
        hostname: 'scontent-gru2-2.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'scontent-gru2-1.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'www.mercadopago.com.br',
      },
      {
        protocol: 'https',
        hostname: 'http2.mlstatic.com',
      }
    ],
  },

  // Configurações para melhor lidar com iframes e CORS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
  
  // Configurações experimentais
  experimental: {
    esmExternals: true,
  },
};

module.exports = nextConfig;
