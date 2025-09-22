import http from 'k6/http';
import { check } from 'k6';

export let options = {
  thresholds: {
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<200'],
  },
  vus: 10,
  duration: '30s',
};

export default function() {
  let response = http.get(`${__ENV.BASE_URL || 'https://atlas-gateway.sonthenguyen186.workers.dev'}/health`);
  
  check(response, {
    'health endpoint returns 200': (r) => r.status === 200,
    'response time is acceptable': (r) => r.timings.duration < 200,
  });
}
