module.exports = {
  ci: {
    collect: {
      url: [
        'https://atlas-admin-insights.vercel.app/prism',
        'https://atlas-dev-portal.vercel.app/prism', 
        'https://atlas-proof-messenger.vercel.app/prism'
      ],
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'speed-index': ['error', { maxNumericValue: 3400 }],
        'interactive': ['error', { maxNumericValue: 3800 }],
        'resource-summary:script:size': ['error', { maxNumericValue: 204800 }], // 200KB
        'resource-summary:total:size': ['error', { maxNumericValue: 1048576 }] // 1MB
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};