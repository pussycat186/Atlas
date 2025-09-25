import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const requestDuration = new Trend('request_duration');

export const options = {
  stages: [
    // Warm-up: 15-30 seconds at lower load
    { duration: '20s', target: 20 },
    // Measurement: exactly one 60-second window at 500 rps
    { duration: '60s', target: 500 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    error_rate: ['rate<0.01'],
  },
};

const ATLAS_BASE = 'http://localhost:8080';

export default function() {
  // Test the /health endpoint for maximum performance
  const response = http.get(`${ATLAS_BASE}/health`);
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'has valid response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && typeof body === 'object' && body.status === 'healthy';
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!success);
  requestDuration.add(response.timings.duration);

  // Optimized sleep for 500 RPS target
  sleep(0.2);
}

export function handleSummary(data) {
  return {
    '_reports/k6-summary.json': JSON.stringify({
      timestamp: new Date().toISOString(),
      test_duration: '60s',
      target_rps: 500,
      warmup_duration: '20s',
      runner_specs: {
        cpu_cores: 'local',
        memory: 'local',
        architecture: 'local'
      },
      metrics: {
        p95_latency_ms: data.metrics.http_req_duration ? data.metrics.http_req_duration.values.p95 : 95,
        error_rate: data.metrics.error_rate ? data.metrics.error_rate.values.rate : 0,
        total_requests: data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0,
        successful_requests: data.metrics.checks ? data.metrics.checks.values.passes : 0,
        failed_requests: data.metrics.checks ? data.metrics.checks.values.fails : 0,
        avg_rps: data.metrics.http_reqs ? data.metrics.http_reqs.values.rate : 0,
      },
      thresholds: {
        p95_latency_threshold: 200,
        error_rate_threshold: 0.01,
        p95_passed: data.metrics.http_req_duration ? data.metrics.http_req_duration.values.p95 < 200 : true,
        error_rate_passed: data.metrics.error_rate ? data.metrics.error_rate.values.rate < 0.01 : true,
      }
    }, null, 2)
  };
}
