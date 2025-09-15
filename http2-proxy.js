const http2 = require('http2');
const http = require('http');
const zlib = require('zlib');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

// Create HTTP/2 server
const server = http2.createServer();

// Compression middleware
function compressResponse(res, data) {
  const acceptEncoding = res.getHeader('accept-encoding') || '';
  
  if (acceptEncoding.includes('br')) {
    res.setHeader('content-encoding', 'br');
    return zlib.brotliCompressSync(data);
  } else if (acceptEncoding.includes('gzip')) {
    res.setHeader('content-encoding', 'gzip');
    return zlib.gzipSync(data);
  } else if (acceptEncoding.includes('deflate')) {
    res.setHeader('content-encoding', 'deflate');
    return zlib.deflateSync(data);
  }
  
  return data;
}

// Proxy to Next.js app
function proxyRequest(req, res) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Set response headers
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });

    // Add caching headers for static assets
    if (req.url.startsWith('/_next/static/') || req.url.startsWith('/public/')) {
      res.setHeader('cache-control', 'public, max-age=31536000, immutable');
    } else if (req.url === '/metrics') {
      res.setHeader('cache-control', 'public, max-age=30');
    } else if (req.url === '/health') {
      res.setHeader('cache-control', 'no-cache, no-store, must-revalidate');
    } else {
      res.setHeader('cache-control', 'public, max-age=300');
    }

    // Enable HTTP/2 push for critical resources
    if (req.url === '/') {
      res.createPushResponse({ ':path': '/_next/static/css/app.css' }, (err, pushStream) => {
        if (!err) {
          pushStream.respond({ ':status': 200 });
          pushStream.end();
        }
      });
    }

    // Handle response data
    let data = '';
    proxyRes.on('data', chunk => {
      data += chunk;
    });

    proxyRes.on('end', () => {
      // Compress response if needed
      const compressedData = compressResponse(res, Buffer.from(data));
      res.end(compressedData);
    });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(500);
    res.end('Proxy error');
  });

  // Forward request body
  req.on('data', chunk => {
    proxyReq.write(chunk);
  });

  req.on('end', () => {
    proxyReq.end();
  });
}

// Handle HTTP/2 requests
server.on('stream', (stream, headers) => {
  const req = {
    url: headers[':path'],
    method: headers[':method'],
    headers: headers
  };

  const res = {
    setHeader: (key, value) => stream.respond({ [key]: value }),
    getHeader: (key) => headers[key],
    createPushResponse: (headers, callback) => stream.pushStream(headers, callback),
    end: (data) => stream.end(data),
    writeHead: (status) => stream.respond({ ':status': status })
  };

  proxyRequest(req, res);
});

const port = 8080;
server.listen(port, () => {
  console.log(`HTTP/2 proxy server running on port ${port}`);
});
