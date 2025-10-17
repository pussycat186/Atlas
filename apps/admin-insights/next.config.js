const path = require('path');

// Import Atlas security configuration
let atlasSecurityConfig;
try {
  atlasSecurityConfig = require('../../libs/atlas-security.js');
  // Set app context
  process.env.ATLAS_APP_NAME = 'admin_insights';
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
        console.log(`🛡️  Admin Insights: Loaded ${securityHeaders.length} security headers from flags`);
        
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
    console.log('🛡️  Admin Insights: Using fallback security headers');
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
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // Safe CSP without advanced features
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.vercel.app https://*.workers.dev; frame-ancestors 'none';"
          }
        ],
      },
    ];
  },
};

module.exports = nextConfig;

