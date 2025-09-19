import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const requestDuration = new Trend('request_duration');

export const options = {
  stages: [
    // Warm-up: 20-30 seconds at lower load
    { duration: '25s', target: 50 },
    // Measurement: exactly one 60-second window at 500 rps
    { duration: '60s', target: 500 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    error_rate: ['rate<0.01'],
  },
};

// Vercel Preview URL - confirmed working deployment
const VERCEL_BASE = __ENV.VERCEL_URL || 'https://atlas-proof-messenger.vercel.app';

export default function() {
  // Test the main page
  const response = http.get(`${VERCEL_BASE}/`);
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'has valid response': (r) => {
      return r.body && r.body.includes('Atlas Proof Messenger');
    },
  });

  errorRate.add(!success);
  requestDuration.add(response.timings.duration);

  sleep(0.2); // 200ms between requests
}

export function handleSummary(data) {
  return {
    '_reports/k6-vercel-summary.json': JSON.stringify({
      timestamp: new Date().toISOString(),
      test_duration: '60s',
      target_rps: 500,
      warmup_duration: '25s',
      vercel_url: VERCEL_BASE,
      metrics: {
        p95_latency_ms: data.metrics.http_req_duration ? data.metrics.http_req_duration.values.p95 : 0,
        error_rate: data.metrics.error_rate ? data.metrics.error_rate.values.rate : 0,
        total_requests: data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0,
        successful_requests: data.metrics.checks ? data.metrics.checks.values.passes : 0,
        failed_requests: data.metrics.checks ? data.metrics.checks.values.fails : 0,
        avg_rps: data.metrics.http_reqs ? data.metrics.http_reqs.values.rate : 0,
      },
      thresholds: {
        p95_latency_threshold: 200,
        error_rate_threshold: 0.01,
        p95_passed: data.metrics.http_req_duration ? data.metrics.http_req_duration.values.p95 < 200 : false,
        error_rate_passed: data.metrics.error_rate ? data.metrics.error_rate.values.rate < 0.01 : false,
      }
    }, null, 2)
  };
}
