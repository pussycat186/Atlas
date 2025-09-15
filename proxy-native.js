const http = require('http');
const cluster = require('cluster');
const os = require('os');

const PORT = 3001;
const TARGET_HOST = 'localhost';
const TARGET_PORT = 3000;

// Simple cache for micro-caching
const cache = new Map();
const CACHE_TTL = 60000; // 60 seconds

function getCacheKey(req) {
  return `${req.method}:${req.url}`;
}

function setCacheHeaders(res, url) {
  if (url.startsWith('/_next/static/') || url.startsWith('/public/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (['/', '/keys', '/playground', '/metrics'].includes(url)) {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
    res.setHeader('Vary', 'Accept-Encoding');
  }
}

const server = http.createServer((req, res) => {
  const cacheKey = getCacheKey(req);
  
  // Check cache for GET requests
  if (req.method === 'GET') {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      res.writeHead(cached.status, cached.headers);
      res.end(cached.body);
      return;
    }
  }
  
  // Set cache headers
  setCacheHeaders(res, req.url);
  
  // Create proxy request
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers }
  };
  
  // Remove auth headers
  delete options.headers.authorization;
  delete options.headers.cookie;
  
  const proxyReq = http.request(options, (proxyRes) => {
    // Set cache headers on response
    setCacheHeaders(res, req.url);
    
    // Collect response data for caching
    let data = '';
    proxyRes.on('data', chunk => {
      data += chunk;
    });
    
    proxyRes.on('end', () => {
      // Cache GET responses
      if (req.method === 'GET') {
        cache.set(cacheKey, {
          status: proxyRes.statusCode,
          headers: { ...proxyRes.headers },
          body: data,
          timestamp: Date.now()
        });
      }
      
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      res.end(data);
    });
  });
  
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(500);
    res.end('Proxy error');
  });
  
  // Forward request body
  req.pipe(proxyReq);
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
