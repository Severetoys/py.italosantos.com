/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  staticPageGenerationTimeout: 180,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
      },
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
  
  // Configurações webpack para compatibilidade
  webpack: (config, { isServer }) => {
    // Configurações para face-api.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        buffer: false,
        timers: false,
      };
    }
    
    // Ignorar avisos de módulos Node.js em cliente
    config.externals = config.externals || [];
    config.externals.push({
      'fs': 'commonjs fs',
      'path': 'commonjs path',
      'stream': 'commonjs stream',
      'util': 'commonjs util',
      'os': 'commonjs os',
    });
    
    return config;
  },
  
  // Configurações experimentais para estabilidade em desenvolvimento
  experimental: {
    // Reduzir problemas com HMR e iframes
    esmExternals: false,
  },
};

module.exports = nextConfig;