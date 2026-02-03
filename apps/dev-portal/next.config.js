const path = require('path');

// Import Atlas security configuration
let atlasSecurityConfig;
try {
  atlasSecurityConfig = require('../../libs/atlas-security.js');
  // Set app context
  process.env.ATLAS_APP_NAME = 'dev_portal';
} catch (error) {
  console.warn('Atlas security config not available, using safe defaults');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: [
    '@atlas/ui',
    '@atlas/ui-primitives', 
    '@atlas/ui-system',
    '@atlas/ui-tokens',
    '@atlas/config',
    '@atlas/core',
    '@atlas/db',
    '@atlas/mls-core',
    '@atlas/receipt',
    '@atlas/design-system'
  ],
  outputFileTracingRoot: path.resolve(__dirname, '../..'),
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../')
  },
  webpack: (config) => {
    config.resolve.symlinks = false;
    config.resolve.alias = {
      ...config.resolve.alias,
      '@atlas/fabric-crypto': false,
      'fabric-crypto': false,
    };
    return config;
  },
  async headers() {
    // Use Atlas security configuration if available
    if (atlasSecurityConfig && atlasSecurityConfig.getSecurityHeaders) {
      try {
        const securityHeaders = atlasSecurityConfig.getSecurityHeaders();
        console.log(`🛡️  Dev Portal: Loaded ${securityHeaders.length} security headers from flags`);
        
        return [
          {
            source: '/(.*)',
            headers: securityHeaders,
          },
        ];
      } catch (error) {
        console.error('Failed to load security headers from flags, using safe defaults:', error);
      }
    }
    
    // Fallback to safe default headers
    console.log('🛡️  Dev Portal: Using fallback security headers');
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.vercel.app https://*.workers.dev;",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

