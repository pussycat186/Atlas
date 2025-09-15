const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const compression = require('compression');

const dev = false;
const hostname = 'localhost';
const port = 3001;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      // Enable compression
      compression()(req, res, () => {
        // Set cache headers for static assets
        if (pathname.startsWith('/_next/static/') || pathname.startsWith('/public/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
        
        // Set ETag for API responses
        if (pathname.startsWith('/api/')) {
          res.setHeader('ETag', `"${Date.now()}"`);
          res.setHeader('Last-Modified', new Date().toUTCString());
        }

        handle(req, res, parsedUrl);
      });
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
