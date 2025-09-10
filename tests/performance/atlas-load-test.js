import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users over 30 seconds
    { duration: '1m', target: 20 },   // Stay at 20 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],              // Custom error rate must be below 10%
  },
};

export default function () {
  // Test Grafana health endpoint
  let response = http.get('http://localhost:3030/api/health');
  let success = check(response, {
    'Grafana health check status is 200': (r) => r.status === 200,
    'Grafana response time < 2s': (r) => r.timings.duration < 2000,
  });
  errorRate.add(!success);

  sleep(1);

  // Test web app homepage (if available)
  response = http.get('http://localhost:3006/');
  success = check(response, {
    'Web app homepage status is 200': (r) => r.status === 200,
    'Web app response time < 3s': (r) => r.timings.duration < 3000,
  });
  errorRate.add(!success);

  sleep(1);

  // Test API keys page
  response = http.get('http://localhost:3006/keys');
  success = check(response, {
    'API keys page status is 200': (r) => r.status === 200,
    'API keys response time < 3s': (r) => r.timings.duration < 3000,
  });
  errorRate.add(!success);

  sleep(1);

  // Test playground page
  response = http.get('http://localhost:3006/playground');
  success = check(response, {
    'Playground page status is 200': (r) => r.status === 200,
    'Playground response time < 3s': (r) => r.timings.duration < 3000,
  });
  errorRate.add(!success);

  sleep(1);

  // Test witness status page
  response = http.get('http://localhost:3006/witness');
  success = check(response, {
    'Witness status page status is 200': (r) => r.status === 200,
    'Witness status response time < 3s': (r) => r.timings.duration < 3000,
  });
  errorRate.add(!success);

  sleep(1);

  // Test metrics page
  response = http.get('http://localhost:3006/metrics');
  success = check(response, {
    'Metrics page status is 200': (r) => r.status === 200,
    'Metrics response time < 3s': (r) => r.timings.duration < 3000,
  });
  errorRate.add(!success);

  sleep(1);

  // Test docs page
  response = http.get('http://localhost:3006/docs');
  success = check(response, {
    'Docs page status is 200': (r) => r.status === 200,
    'Docs response time < 3s': (r) => r.timings.duration < 3000,
  });
  errorRate.add(!success);

  sleep(1);

  // Test settings page
  response = http.get('http://localhost:3006/settings');
  success = check(response, {
    'Settings page status is 200': (r) => r.status === 200,
    'Settings response time < 3s': (r) => r.timings.duration < 3000,
  });
  errorRate.add(!success);

  sleep(1);

  // Test admin dashboard
  response = http.get('http://localhost:3006/admin');
  success = check(response, {
    'Admin dashboard status is 200': (r) => r.status === 200,
    'Admin dashboard response time < 3s': (r) => r.timings.duration < 3000,
  });
  errorRate.add(!success);

  sleep(1);
}

export function handleSummary(data) {
  return {
    'performance-results.json': JSON.stringify(data, null, 2),
    stdout: `
    ========================
    Atlas v12 Performance Test Results
    ========================
    
    Total Requests: ${data.metrics.http_reqs.values.count}
    Failed Requests: ${data.metrics.http_req_failed.values.count}
    Error Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
    
    Response Times:
    - Average: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
    - P95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
    - P99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
    - Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms
    
    Throughput: ${data.metrics.http_reqs.values.rate.toFixed(2)} requests/second
    
    Test Duration: ${data.state.testRunDurationMs / 1000}s
    
    ========================
    `,
  };
}
