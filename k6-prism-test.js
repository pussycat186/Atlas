import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 500 }, // Warm-up
    { duration: '60s', target: 500 }, // Measurement window
  ],
};

const urls = [
  'https://atlas-admin-insights.vercel.app/prism',
  'https://atlas-dev-portal.vercel.app/prism', 
  'https://atlas-proof-messenger.vercel.app/prism'
];

export default function() {
  const url = urls[Math.floor(Math.random() * urls.length)];
  let response = http.get(url);
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  sleep(0.1);
}