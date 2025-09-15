import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const cacheHitRate = new Rate('cache_hit_rate');

export let options = {
  stages: [
    { duration: '15s', target: 100 },  // Warm-up phase
    { duration: '60s', target: 500 },  // Constant 500 RPS for 60s
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests must be below 200ms
    http_req_failed: ['rate<0.01'],   // Error rate must be below 1%
    http_reqs: ['rate>=500'],         // Must achieve at least 500 RPS
    http_reqs: ['count>=29000'],      // Must have ~30,000 total requests (±1%)
    http_reqs: ['count<=31000'],      // Must not exceed 31,000 total requests
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
  discardResponseBodies: true,
  noConnectionReuse: false,
};

const BASE_URL = 'http://localhost:8080';
const routes = ['/', '/keys', '/playground', '/metrics'];

export default function () {
  // 90% cacheable GET routes
  if (Math.random() < 0.9) {
    const route = routes[Math.floor(Math.random() * routes.length)];
    let response = http.get(`${BASE_URL}${route}`);
    
    let success = check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 200ms': (r) => r.timings.duration < 200,
    });
    
    // Check for cache hit
    const cacheStatus = response.headers['X-Cache-Status'];
    const isCacheHit = cacheStatus === 'HIT';
    
    errorRate.add(!success);
    cacheHitRate.add(isCacheHit);
    
  } else {
    // 10% static assets
    let response = http.get(`${BASE_URL}/favicon.ico`);
    
    let success = check(response, {
      'static status is 200': (r) => r.status === 200,
      'static response time < 200ms': (r) => r.timings.duration < 200,
    });
    
    // Check for cache hit on static assets
    const cacheStatus = response.headers['X-Cache-Status'];
    const isCacheHit = cacheStatus === 'HIT';
    
    errorRate.add(!success);
    cacheHitRate.add(isCacheHit);
  }
  
  sleep(0.1); // Small delay between requests
}

export function handleSummary(data) {
  return {
    'k6-results.json': JSON.stringify(data, null, 2),
    'k6-summary.txt': `
ATLAS v14 Dual-Service Self-Healing Gate Results
===============================================

Test Configuration:
- Target URL: ${BASE_URL}
- Duration: 60s constant load
- Target RPS: 500
- Route mix: 90% dynamic GET, 10% static assets

Performance Metrics:
- Total Requests: ${data.metrics.http_reqs.count}
- RPS: ${data.metrics.http_reqs.rate.toFixed(2)}
- p95 Response Time: ${data.metrics.http_req_duration.p95.toFixed(2)}ms
- Error Rate: ${(data.metrics.http_req_failed.rate * 100).toFixed(2)}%
- Cache Hit Rate: ${(data.metrics.cache_hit_rate.rate * 100).toFixed(2)}%

Thresholds:
- RPS ≥ 500: ${data.metrics.http_reqs.rate >= 500 ? 'PASS' : 'FAIL'}
- p95 ≤ 200ms: ${data.metrics.http_req_duration.p95 <= 200 ? 'PASS' : 'FAIL'}
- Error Rate ≤ 1%: ${data.metrics.http_req_failed.rate <= 0.01 ? 'PASS' : 'FAIL'}
- Total Requests 29,000-31,000: ${data.metrics.http_reqs.count >= 29000 && data.metrics.http_reqs.count <= 31000 ? 'PASS' : 'FAIL'}

Overall Result: ${data.metrics.http_reqs.rate >= 500 && data.metrics.http_req_duration.p95 <= 200 && data.metrics.http_req_failed.rate <= 0.01 ? 'GREEN' : 'RED'}
    `,
  };
}
