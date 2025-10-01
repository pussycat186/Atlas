module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      url: [
        'https://atlas-admin-insights.vercel.app',
        'https://atlas-dev-portal.vercel.app', 
        'https://atlas-proof-messenger.vercel.app'
      ]
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.9}],
        'categories:accessibility': ['error', {minScore: 0.95}]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-reports'
    }
  }
};