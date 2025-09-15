const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const next = require('next');
const { createServer } = require('http');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  app.prepare().then(() => {
    const server = createServer((req, res) => {
      // Add worker ID to headers for debugging
      res.setHeader('X-Worker-ID', cluster.worker.id);
      return handle(req, res);
    });
    
    const port = 3000;
    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`Worker ${cluster.worker.id} ready on http://localhost:${port}`);
    });
  });
}
