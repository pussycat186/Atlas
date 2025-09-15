import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
  },
};

const BASE_URL = 'http://localhost:8080';
const routes = ['/', '/keys', '/playground', '/metrics'];

export default function () {
  const route = routes[Math.floor(Math.random() * routes.length)];
  let res = http.get(`${BASE_URL}${route}`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(0.1);
}
