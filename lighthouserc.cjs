// Lighthouse CI Configuration for Atlas GA
// Uses Cloud Run URLs (to be set via environment or locally served apps)

module.exports = {
  ci: {
    collect: {
      // URLs will be set dynamically via LHCI_SERVER_BASE_URL environment variable
      // or during local development via http://localhost:<port>
      url: [
        process.env.LHCI_URL_PROOF || 'http://localhost:3000',
        process.env.LHCI_URL_ADMIN || 'http://localhost:3001',
        process.env.LHCI_URL_DEV || 'http://localhost:3002'
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-reports'
    }
  }
};
