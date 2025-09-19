// Atlas Gateway - Cloudflare Workers Backend
// Zero-dependency implementation for production readiness

// Prometheus-style metrics
let requestCount = 0;
let healthCheckCount = 0;
let healthLiteCount = 0;
let metricsCount = 0;
let errorCount = 0;

// Simple in-memory counter (resets on worker restart)
const counters = {
  requests_total: 0,
  health_checks_total: 0,
  health_lite_total: 0,
  metrics_requests_total: 0,
  errors_total: 0
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Increment total request counter
    counters.requests_total++;

    try {
      // Route handling
      if (method === 'GET') {
        switch (path) {
          case '/health':
            return handleHealth(request);
          
          case '/health-lite':
            return handleHealthLite(request);
          
          case '/metrics':
            return handleMetrics(request);
          
          default:
            return new Response('Not Found', { 
              status: 404,
              headers: { 'Content-Type': 'text/plain' }
            });
        }
      }

      // Method not allowed
      return new Response('Method Not Allowed', { 
        status: 405,
        headers: { 'Content-Type': 'text/plain' }
      });

    } catch (error) {
      counters.errors_total++;
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};

function handleHealth(request) {
  counters.health_checks_total++;
  
  const response = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: 'unknown', // Workers don't have process.uptime
    version: '1.0.0',
    service: 'atlas-gateway'
  };

  return new Response(JSON.stringify(response, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

function handleHealthLite(request) {
  counters.health_lite_total++;
  
  // Ultra-fast response with minimal processing
  return new Response('ok', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

function handleMetrics(request) {
  counters.metrics_requests_total++;
  
  // Prometheus-style metrics
  const metrics = [
    '# HELP atlas_requests_total Total number of requests',
    '# TYPE atlas_requests_total counter',
    `atlas_requests_total ${counters.requests_total}`,
    '',
    '# HELP atlas_health_checks_total Total number of health check requests',
    '# TYPE atlas_health_checks_total counter',
    `atlas_health_checks_total ${counters.health_checks_total}`,
    '',
    '# HELP atlas_health_lite_total Total number of health-lite requests',
    '# TYPE atlas_health_lite_total counter',
    `atlas_health_lite_total ${counters.health_lite_total}`,
    '',
    '# HELP atlas_metrics_requests_total Total number of metrics requests',
    '# TYPE atlas_metrics_requests_total counter',
    `atlas_metrics_requests_total ${counters.metrics_requests_total}`,
    '',
    '# HELP atlas_errors_total Total number of errors',
    '# TYPE atlas_errors_total counter',
    `atlas_errors_total ${counters.errors_total}`,
    '',
    '# HELP atlas_worker_info Worker information',
    '# TYPE atlas_worker_info gauge',
    'atlas_worker_info{version="1.0.0",service="atlas-gateway"} 1'
  ].join('\n');

  return new Response(metrics, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
