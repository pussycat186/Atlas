const http = require('http');
const httpProxy = require('http-proxy');
const cluster = require('cluster');
const os = require('os');

const PORT = 3001;
const TARGET_URL = 'http://localhost:3000';

// Create proxy
const proxy = httpProxy.createProxyServer({
  target: TARGET_URL,
  changeOrigin: true,
  ws: false
});

// Cache for micro-caching
const cache = new Map();
const CACHE_TTL = 60000; // 60 seconds

const server = http.createServer((req, res) => {
  // Set cache headers
  if (req.url.startsWith('/_next/static/') || req.url.startsWith('/public/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (['/', '/keys', '/playground', '/metrics'].includes(req.url)) {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
    res.setHeader('Vary', 'Accept-Encoding');
    
    // Simple micro-cache
    const cacheKey = req.url;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      res.writeHead(cached.status, cached.headers);
      res.end(cached.body);
      return;
    }
  }
  
  // Remove auth headers
  delete req.headers.authorization;
  delete req.headers.cookie;
  
  // Proxy the request
  proxy.web(req, res, {}, (err) => {
    console.error('Proxy error:', err);
    res.writeHead(500);
    res.end('Proxy error');
  });
});

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
  server.listen(PORT, () => {
    console.log(`Worker ${process.pid} listening on port ${PORT}`);
  });
}
