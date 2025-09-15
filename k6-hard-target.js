import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // warm-up phase
    { duration: '60s', target: 500 }, // steady 500 RPS for 60s
    { duration: '10s', target: 0 },    // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests must complete within 200ms
    http_req_failed: ['rate<0.01'],   // http errors should be less than 1%
    http_reqs: ['rate>=500'],         // at least 500 requests per second
  },
  ext: {
    loadimpact: {
      projectID: 3690700,
      name: 'Atlas v12 Hard Target Test',
    },
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
  discardResponseBodies: true,
  noConnectionReuse: false,
  userAgent: 'k6/Atlas-v12-HardTarget',
};

const BASE_URL = 'http://localhost:3001'; // Use proxy

export default function () {
  // 100% cacheable GET routes
  const routes = ['/', '/keys', '/playground', '/metrics'];
  const route = routes[Math.floor(Math.random() * routes.length)];
  
  let res = http.get(`${BASE_URL}${route}`);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
