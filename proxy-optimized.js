const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const compression = require('compression');
const cluster = require('cluster');
const os = require('os');

const app = express();
const PORT = 3001;
const TARGET_URL = 'http://localhost:3000';

// Compression middleware
app.use(compression({
  level: 6, // Balanced compression
  threshold: 1024,
  filter: (req, res) => {
    // Only compress static assets and cacheable routes
    return req.url.startsWith('/_next/static/') || 
           req.url.startsWith('/public/') ||
           ['/', '/keys', '/playground', '/metrics'].includes(req.url);
  }
}));

// Cache middleware for static assets
const cacheMiddleware = (req, res, next) => {
  if (req.url.startsWith('/_next/static/') || req.url.startsWith('/public/')) {
    res.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': `"${Date.now()}"`
    });
  } else if (['/', '/keys', '/playground', '/metrics'].includes(req.url)) {
    // Micro-cache for dynamic routes (60s)
    res.set({
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
      'Vary': 'Accept-Encoding'
    });
  }
  next();
};

app.use(cacheMiddleware);

// Proxy middleware
app.use('/', createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  ws: false,
  onProxyReq: (proxyReq, req, res) => {
    // Remove auth headers to prevent caching issues
    proxyReq.removeHeader('authorization');
    proxyReq.removeHeader('cookie');
  },
  onProxyRes: (proxyRes, req, res) => {
    // Ensure cache headers are set
    if (req.url.startsWith('/_next/static/') || req.url.startsWith('/public/')) {
      proxyRes.headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    } else if (['/', '/keys', '/playground', '/metrics'].includes(req.url)) {
      proxyRes.headers['Cache-Control'] = 'public, max-age=60, stale-while-revalidate=30';
      proxyRes.headers['Vary'] = 'Accept-Encoding';
    }
  }
}));

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  
  // Fork workers equal to CPU count
  const numCPUs = os.cpus().length;
  console.log(`Starting ${numCPUs} workers`);
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} listening on port ${PORT}`);
  });
}
