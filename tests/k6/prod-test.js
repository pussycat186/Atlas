import http from 'k6/http';
import { check } from 'k6';
export const options = {
  vus: 60, duration: '60s',
  thresholds: { http_req_duration: ['p(95)<200'], http_req_failed: ['rate<0.01'] }
};
export default function() {
  const r = http.get('https://atlas-admin-insights.vercel.app/prism');
  check(r, { ok: (res) => res.status === 200 });
}
