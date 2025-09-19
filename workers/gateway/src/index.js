// Atlas Gateway - Cloudflare Workers Backend (Performance Optimized)
// Zero-dependency implementation with non-blocking cache

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
            return handleHealth(request, ctx);
          
          case '/health-lite':
            return handleHealthLite(request, ctx);
          
          case '/metrics':
            return handleMetrics(request, ctx);
          
          default:
            return new Response('Not Found', { status: 404 });
        }
      } else if (method === 'OPTIONS') {
        return handleCORS();
      } else {
        return new Response('Method Not Allowed', { status: 405 });
      }
    } catch (error) {
      counters.errors_total++;
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};

async function handleHealth(request, ctx) {
  counters.health_checks_total++;
  
  const response = new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: 'unknown',
    version: '1.0.0',
    service: 'atlas-gateway'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });

  // Non-blocking cache update
  ctx.waitUntil(updateCache(request, response));
  
  return response;
}

async function handleHealthLite(request, ctx) {
  counters.health_lite_total++;
  
  // Ultra-fast response with minimal processing
  const response = new Response('ok', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=1',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });

  // Non-blocking cache update
  ctx.waitUntil(updateCache(request, response));
  
  return response;
}

async function handleMetrics(request, ctx) {
  counters.metrics_requests_total++;
  
  const metrics = `# HELP atlas_requests_total Total number of requests
# TYPE atlas_requests_total counter
atlas_requests_total ${counters.requests_total}

# HELP atlas_health_checks_total Total number of health check requests
# TYPE atlas_health_checks_total counter
atlas_health_checks_total ${counters.health_checks_total}

# HELP atlas_health_lite_total Total number of health-lite requests
# TYPE atlas_health_lite_total counter
atlas_health_lite_total ${counters.health_lite_total}

# HELP atlas_metrics_requests_total Total number of metrics requests
# TYPE atlas_metrics_requests_total counter
atlas_metrics_requests_total ${counters.metrics_requests_total}

# HELP atlas_errors_total Total number of errors
# TYPE atlas_errors_total counter
atlas_errors_total ${counters.errors_total}

# HELP atlas_worker_info Worker information
# TYPE atlas_worker_info gauge
atlas_worker_info{version="1.0.0",service="atlas-gateway"} 1`;

  const response = new Response(metrics, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });

  // Non-blocking cache update
  ctx.waitUntil(updateCache(request, response));
  
  return response;
}

async function updateCache(request, response) {
  try {
    const cache = caches.default;
    await cache.put(request, response.clone());
  } catch (error) {
    // Cache update failed, but don't block the response
  }
}

function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}