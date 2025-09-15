// ATLAS v14 k6 Cloud Test - Constant Arrival Rate Model
// Following k6 Cloud docs: https://k6.io/docs/cloud/creating-and-running-a-test/

import http from 'k6/http';
import { check } from 'k6';

// k6 Cloud configuration
export const options = {
  scenarios: {
    constant_arrival_rate: {
      executor: 'constant-arrival-rate',
      rate: 500, // 500 RPS
      timeUnit: '1s',
      duration: '60s', // Exactly 60s window
      preAllocatedVUs: 100, // Pre-allocate VUs
      maxVUs: 1000, // Maximum VUs (tune to hold ~30k ±1% with ≤1% errors)
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests must be below 200ms
    http_req_failed: ['rate<0.01'],   // Error rate must be below 1%
    http_reqs: ['rate>=500'],         // Must achieve at least 500 RPS
    http_reqs: ['count>=29000'],      // Must have at least 29,000 requests
    http_reqs: ['count<=31000'],      // Must not exceed 31,000 requests
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
  discardResponseBodies: true, // Reduce memory usage
  noConnectionReuse: false,    // Enable keep-alive
};

// Target URL - will be set via environment variable
const BASE_URL = __ENV.TARGET_URL || 'https://atlas-nginx-uc.a.run.app';
const routes = ['/', '/keys', '/playground', '/metrics'];

export default function () {
  // Route-mix lock: ~90% cacheable GET, ~10% static
  if (Math.random() < 0.9) {
    // 90% cacheable GET routes
    const route = routes[Math.floor(Math.random() * routes.length)];
    let response = http.get(`${BASE_URL}${route}`);
    
    check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 200ms': (r) => r.timings.duration < 200,
      'has X-Cache-Status header': (r) => r.headers['X-Cache-Status'] !== undefined,
    });
  } else {
    // 10% static assets
    let response = http.get(`${BASE_URL}/favicon.ico`);
    
    check(response, {
      'static status is 200': (r) => r.status === 200,
      'static response time < 200ms': (r) => r.timings.duration < 200,
      'static has X-Cache-Status header': (r) => r.headers['X-Cache-Status'] !== undefined,
    });
  }
}

export function handleSummary(data) {
  return {
    'k6-results.json': JSON.stringify(data, null, 2),
    'k6-summary.txt': `
ATLAS v14 Cloud Run + k6 Cloud Results
=====================================

Test Configuration:
- Executor: constant-arrival-rate
- Rate: 500 RPS
- Duration: 60s
- Target URL: ${BASE_URL}
- Route mix: 90% dynamic GET, 10% static assets

Performance Metrics:
- Total Requests: ${data.metrics.http_reqs.count}
- RPS: ${data.metrics.http_reqs.rate.toFixed(2)}
- p95 Response Time: ${data.metrics.http_req_duration.p95.toFixed(2)}ms
- Error Rate: ${(data.metrics.http_req_failed.rate * 100).toFixed(2)}%

Thresholds:
- RPS ≥ 500: ${data.metrics.http_reqs.rate >= 500 ? 'PASS' : 'FAIL'}
- p95 ≤ 200ms: ${data.metrics.http_req_duration.p95 <= 200 ? 'PASS' : 'FAIL'}
- Error Rate ≤ 1%: ${data.metrics.http_req_failed.rate <= 0.01 ? 'PASS' : 'FAIL'}
- Total Requests 29,000-31,000: ${data.metrics.http_reqs.count >= 29000 && data.metrics.http_reqs.count <= 31000 ? 'PASS' : 'FAIL'}

Overall Result: ${data.metrics.http_reqs.rate >= 500 && data.metrics.http_req_duration.p95 <= 200 && data.metrics.http_req_failed.rate <= 0.01 ? 'GREEN' : 'RED'}
    `,
  };
}
