import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '10s', target: 100 },
    { duration: '50s', target: 500 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'https://atlas-api.workers.dev';

export default function () {
  // Test JWKS endpoint
  const jwksRes = http.get(`${BASE_URL}/.well-known/jwks.json`);
  check(jwksRes, {
    'JWKS status 200': (r) => r.status === 200,
    'JWKS has keys': (r) => JSON.parse(r.body).keys?.length > 0,
  }) || errorRate.add(1);

  // Test health endpoint
  const healthRes = http.get(`${BASE_URL}/healthz`);
  check(healthRes, {
    'Health status 200': (r) => r.status === 200,
    'Health ok': (r) => JSON.parse(r.body).ok === true,
  }) || errorRate.add(1);

  // Test verify endpoint (POST)
  const verifyPayload = JSON.stringify({
    message: {
      method: 'POST',
      url: 'https://example.com/test',
      headers: {},
    },
    signature: 'test-signature',
    signatureInput: 'sig=("@method" "@target-uri");keyid="test-key";alg="ed25519"',
  });

  const verifyRes = http.post(`${BASE_URL}/verify`, verifyPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(verifyRes, {
    'Verify returns response': (r) => r.status >= 200 && r.status < 500,
  }) || errorRate.add(1);

  sleep(0.1);
}

export function handleSummary(data) {
  return {
    'k6-results.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';
  let summary = '\n';
  
  summary += `${indent}✓ checks.........................: ${(data.metrics.checks.values.passes / data.metrics.checks.values.count * 100).toFixed(2)}%\n`;
  summary += `${indent}  http_req_duration..............: avg=${data.metrics.http_req_duration.values.avg.toFixed(2)}ms p(95)=${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  http_reqs......................: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}  errors.........................: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%\n`;
  
  return summary;
}
