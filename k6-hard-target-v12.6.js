import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '60s', target: 500 }, // 60s constant-arrival-rate = 500 req/s
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests must complete within 200ms
    http_req_failed: ['rate<0.01'],   // http errors should be less than 1%
    http_reqs: ['rate>=500'],         // at least 500 requests per second
  },
  ext: {
    loadimpact: {
      projectID: 3690700,
      name: 'Atlas v12.6 Performance Test - Hard Target',
    },
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
  discardResponseBodies: true,
  noConnectionReuse: false,
  userAgent: 'k6/Atlas-v12.6-HardTarget',
};

const BASE_URL = 'http://localhost:3001'; // Use proxy

export default function () {
  // 90% cacheable GET routes
  if (Math.random() < 0.9) {
    const routes = ['/', '/keys', '/playground', '/metrics'];
    const route = routes[Math.floor(Math.random() * routes.length)];
    
    let res = http.get(`${BASE_URL}${route}`);
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 200ms': (r) => r.timings.duration < 200,
    });
  } else {
    // 10% static assets (including favicon.ico)
    let res = http.get(`${BASE_URL}/favicon.ico`);
    check(res, {
      'static status is 200': (r) => r.status === 200,
      'static response time < 200ms': (r) => r.timings.duration < 200,
    });
  }
}
