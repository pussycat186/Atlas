import http from 'k6/http';
import { Counter } from 'k6/metrics';

export const options = { vus: 60, duration: '60s' };
const codes = new Counter('status_code');
const paths = ['/prism', '/qtca/tick', '/qtca/summary'];

export default function() {
  const base = __ENV.BASE;
  const p = paths[Math.floor(Math.random() * paths.length)];
  const r = http.get(`${base}${p}`, { tags: { path: p } });
  codes.add(r.status, { path: p });
}