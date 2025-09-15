import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');

export let options = {
  stages: [
    { duration: '10s', target: 100 }, // Ramp up
    { duration: '60s', target: 500 }, // Stay at 500 RPS
    { duration: '10s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests must be below 200ms
    http_req_failed: ['rate<0.01'],   // Error rate must be below 1%
    http_reqs: ['rate>=500'],         // Must achieve at least 500 RPS
  },
};

export default function () {
  // Test the home page
  let response = http.get('http://localhost:3000/');
  
  let success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'response has title': (r) => r.body.includes('Atlas'),
  });
  
  errorRate.add(!success);
  
  // Test the keys page
  response = http.get('http://localhost:3000/keys');
  
  success = check(response, {
    'keys status is 200': (r) => r.status === 200,
    'keys response time < 200ms': (r) => r.timings.duration < 200,
    'keys has API Keys heading': (r) => r.body.includes('API Keys'),
  });
  
  errorRate.add(!success);
  
  // Test the playground page
  response = http.get('http://localhost:3000/playground');
  
  success = check(response, {
    'playground status is 200': (r) => r.status === 200,
    'playground response time < 200ms': (r) => r.timings.duration < 200,
    'playground has Message Playground heading': (r) => r.body.includes('Message Playground'),
  });
  
  errorRate.add(!success);
  
  // Test the metrics page
  response = http.get('http://localhost:3000/metrics');
  
  success = check(response, {
    'metrics status is 200': (r) => r.status === 200,
    'metrics response time < 200ms': (r) => r.timings.duration < 200,
    'metrics has Metrics Dashboard heading': (r) => r.body.includes('Metrics Dashboard'),
  });
  
  errorRate.add(!success);
  
  sleep(0.1); // Small delay between requests
}
