import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 60,
  duration: '60s',
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% errors
    http_req_duration: ['p(95)<200'], // 95% under 200ms
  },
};

const urls = [
  'https://atlas-proof-messenger.vercel.app/prism',
  'https://atlas-admin-insights.vercel.app/prism', 
  'https://atlas-dev-portal.vercel.app/prism'
];

export default function () {
  const url = urls[Math.floor(Math.random() * urls.length)];
  
  const response = http.get(url);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'contains prism marker': (r) => r.body.includes('ATLAS • Prism UI — Peak Preview'),
  });
}