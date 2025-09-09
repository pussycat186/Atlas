/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@atlas/fabric-client', '@atlas/fabric-protocol'],
  experimental: {
    appDir: true,
  },
  env: {
    GATEWAY_URL: process.env.GATEWAY_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig
