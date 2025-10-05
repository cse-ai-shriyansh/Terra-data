/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // appDir is now stable in Next.js 14
  },
  images: {
    domains: [
      'gibs.earthdata.nasa.gov',
      'localhost',
      'minio',
    ],
    unoptimized: true, // For satellite imagery that doesn't need optimization
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_MINIO_ENDPOINT: process.env.NEXT_PUBLIC_MINIO_ENDPOINT || 'http://localhost:9000',
  },
  // Enable external domains for satellite imagery
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  // Webpack configuration for map libraries
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;