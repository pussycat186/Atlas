import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    'http_req_failed{endpoint:implemented}': ['rate<0.01'], // Only check implemented endpoints
  },
};

export default function() {
  // Test gateway health (implemented endpoint)
  let response = http.get('https://atlas-gateway.sonthenguyen186.workers.dev/health', { tags: { endpoint: 'implemented' } });
  check(response, {
    'gateway health status is 200': (r) => r.status === 200,
    'gateway health response time < 200ms': (r) => r.timings.duration < 200,
  });

  // Test QTCA endpoints (may not be implemented, so tag as unimplemented for threshold exclusion)
  response = http.get('https://atlas-gateway.sonthenguyen186.workers.dev/qtca/tick', { tags: { endpoint: 'unimplemented' } });
  check(response, {
    'qtca tick response time < 200ms': (r) => r.timings.duration < 200,
  });

  response = http.get('https://atlas-gateway.sonthenguyen186.workers.dev/qtca/summary', { tags: { endpoint: 'unimplemented' } });
  check(response, {
    'qtca summary response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}