import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');

export const options = {
  scenarios: {
    constant_arrival_rate: {
      executor: 'constant-arrival-rate',
      rate: 500, // 500 requests per second
      timeUnit: '1s',
      duration: '60s', // 60 second test
      preAllocatedVUs: 100, // Pre-allocate VUs
      maxVUs: 1000, // Maximum VUs
      startTime: '25s', // 25 second warm-up
    },
  },
  thresholds: {
    http_req_failed: ['rate<=0.01'], // Error rate <= 1%
    http_req_duration: ['p(95)<=200'], // 95th percentile <= 200ms
    error_rate: ['rate<=0.01'], // Custom error rate <= 1%
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL;
  if (!baseUrl) {
    throw new Error('BASE_URL environment variable is required');
  }

  const url = `${baseUrl}/health-lite`;
  const params = {
    headers: {
      'User-Agent': 'k6-performance-test/1.0',
    },
    timeout: '10s',
  };

  const response = http.get(url, params);
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  errorRate.add(!success);
  
  // Small sleep to prevent overwhelming the backend
  sleep(0.001);
}

export function handleSummary(data) {
  return {
    'perf-results.json': JSON.stringify(data, null, 2),
  };
}
