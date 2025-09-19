import Fastify from 'fastify';
import { telemetry } from './telemetry';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  }
});

// Health endpoint
fastify.get('/health', async (_request, _reply) => {
  return {
    status: 'healthy',
    service: 'drive',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
});

// Metrics endpoint
fastify.get('/metrics', async (_request, _reply) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  return `# HELP drive_uptime_seconds Drive service uptime in seconds
# TYPE drive_uptime_seconds counter
drive_uptime_seconds{instance="drive-1"} ${uptime}

# HELP drive_memory_rss_bytes Drive service RSS memory usage in bytes
# TYPE drive_memory_rss_bytes gauge
drive_memory_rss_bytes{instance="drive-1"} ${memoryUsage.rss}

# HELP drive_memory_heap_total_bytes Drive service heap total in bytes
# TYPE drive_memory_heap_total_bytes gauge
drive_memory_heap_total_bytes{instance="drive-1"} ${memoryUsage.heapTotal}

# HELP drive_memory_heap_used_bytes Drive service heap used in bytes
# TYPE drive_memory_heap_used_bytes gauge
drive_memory_heap_used_bytes{instance="drive-1"} ${memoryUsage.heapUsed}
`;
});

// File upload endpoint
fastify.post('/files', async (_request, _reply) => {
  return {
    success: true,
    message: 'File upload endpoint ready',
    timestamp: new Date().toISOString()
  };
});

// File retrieval endpoint
fastify.get('/files/:id', async (request, _reply) => {
  return {
    success: true,
    message: 'File retrieval endpoint ready',
    fileId: (request.params as any).id,
    timestamp: new Date().toISOString()
  };
});

async function main() {
  try {
    await telemetry.initialize();
    
    const port = parseInt(process.env.PORT || '3002');
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`Drive service listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down Drive service...');
  await telemetry.shutdown();
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down Drive service...');
  await telemetry.shutdown();
  await fastify.close();
  process.exit(0);
});

main();
