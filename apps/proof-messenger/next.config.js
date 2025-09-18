/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    ATLAS_GATEWAY_URL: process.env.ATLAS_GATEWAY_URL || 'http://localhost:3000',
    ATLAS_DRIVE_URL: process.env.ATLAS_DRIVE_URL || 'http://localhost:3004',
  },
  async rewrites() {
    return [
      {
        source: '/api/gateway/:path*',
        destination: `${process.env.ATLAS_GATEWAY_URL || 'http://localhost:3000'}/:path*`,
      },
      {
        source: '/api/drive/:path*',
        destination: `${process.env.ATLAS_DRIVE_URL || 'http://localhost:3004'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

