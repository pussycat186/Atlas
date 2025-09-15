import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

export const options = {
  stages: [
    { duration: '15s', target: 50 },   // warm-up phase
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
      name: 'Atlas v12 Performance Test - Optimized',
    },
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
  discardResponseBodies: true,
  noConnectionReuse: false,
  userAgent: 'k6/Atlas-v12-PerfTest-Optimized',
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Home page
  let res = http.get(`${BASE_URL}/`);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'response has title': (r) => r.body.includes('Atlas - Secure Messaging & Storage'),
  });

  // API Keys page
  res = http.get(`${BASE_URL}/keys`);
  check(res, {
    'keys status is 200': (r) => r.status === 200,
    'keys response time < 200ms': (r) => r.timings.duration < 200,
    'keys has API Keys heading': (r) => r.body.includes('API Keys'),
  });

  // Playground page
  res = http.get(`${BASE_URL}/playground`);
  check(res, {
    'playground status is 200': (r) => r.status === 200,
    'playground response time < 200ms': (r) => r.timings.duration < 200,
    'playground has Message Playground heading': (r) => r.body.includes('Message Playground'),
  });

  // Metrics page
  res = http.get(`${BASE_URL}/metrics`);
  check(res, {
    'metrics status is 200': (r) => r.status === 200,
    'metrics response time < 200ms': (r) => r.timings.duration < 200,
    'metrics has Metrics Dashboard heading': (r) => r.body.includes('Metrics Dashboard'),
  });
}
