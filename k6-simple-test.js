import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function() {
  // Test gateway health
  let response = http.get('https://atlas-gateway.sonthenguyen186.workers.dev/health');
  check(response, {
    'gateway health status is 200': (r) => r.status === 200,
    'gateway health response time < 200ms': (r) => r.timings.duration < 200,
  });

  // Test QTCA endpoints
  response = http.get('https://atlas-gateway.sonthenguyen186.workers.dev/qtca/tick');
  check(response, {
    'qtca tick status is 200': (r) => r.status === 200,
    'qtca tick response time < 200ms': (r) => r.timings.duration < 200,
  });

  response = http.get('https://atlas-gateway.sonthenguyen186.workers.dev/qtca/summary');
  check(response, {
    'qtca summary status is 200': (r) => r.status === 200,
    'qtca summary response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}