/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@atlas/mls-core',
    '@atlas/receipt',
    '@atlas/design-system',
    '@atlas/security-middleware'
  ],
  outputFileTracingRoot: require('path').resolve(__dirname, '../..'),
  
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Embedder-Policy', 
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;