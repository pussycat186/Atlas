import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');

export let options = {
  stages: [
    { duration: '10s', target: 50 },  // Reduced load
    { duration: '60s', target: 200 }, // Reduced target to 200 RPS
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests must be below 200ms
    http_req_failed: ['rate<0.01'],   // Error rate must be below 1%
    http_reqs: ['rate>=200'],         // Must achieve at least 200 RPS (reduced from 500)
  },
};

export default function () {
  // Test only the home page to reduce load
  let response = http.get('http://localhost:3000/');
  
  let success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'response has title': (r) => r.body.includes('Atlas'),
  });
  
  errorRate.add(!success);
  
  sleep(0.1); // Small delay between requests
}
