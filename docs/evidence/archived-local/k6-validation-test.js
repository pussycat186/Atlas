import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    // Warm-up phase (15-30s)
    { duration: '20s', target: 100 },
    // Measurement phase (60s at 500 RPS)
    { duration: '60s', target: 500 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Test the gateway health endpoint
  const response = http.get('http://localhost:3000/health');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  // Test the metrics endpoint
  const metricsResponse = http.get('http://localhost:3000/metrics');
  
  check(metricsResponse, {
    'metrics status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
