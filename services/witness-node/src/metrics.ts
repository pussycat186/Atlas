import client from 'prom-client';
import { trace, context } from '@opentelemetry/api';

function getTraceId(): string | undefined {
  const span = trace.getSpan(context.active());
  return span?.spanContext().traceId;
}

export const registry = new client.Registry();

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5]
});

// HTTP request counter
const httpRequestCount = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Witness-specific metrics
const attestationCount = new client.Counter({
  name: 'witness_attestations_total',
  help: 'Total number of witness attestations',
  labelNames: ['app', 'status']
});

const attestationLatency = new client.Histogram({
  name: 'witness_attestation_duration_seconds',
  help: 'Duration of witness attestation processing',
  labelNames: ['app'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2]
});

const ledgerSize = new client.Gauge({
  name: 'witness_ledger_size',
  help: 'Current size of the witness ledger'
});

const ledgerOperations = new client.Counter({
  name: 'witness_ledger_operations_total',
  help: 'Total number of ledger operations',
  labelNames: ['operation']
});

// Register all metrics
registry.registerMetric(httpRequestDuration);
registry.registerMetric(httpRequestCount);
registry.registerMetric(attestationCount);
registry.registerMetric(attestationLatency);
registry.registerMetric(ledgerSize);
registry.registerMetric(ledgerOperations);

// Metrics middleware for Fastify
export const metricsMiddleware = async (request: any, reply: any) => {
  const end = httpRequestDuration.startTimer({
    method: request.method,
    route: request.url
  });
  
  reply.raw.on('finish', () => {
    httpRequestCount.inc({
      method: request.method,
      route: request.url,
      status_code: reply.statusCode
    });
    end({ status_code: reply.statusCode });
  });
};

// Expose metrics endpoint
export const exposeMetrics = async (request: any, reply: any) => {
  reply.type('text/plain');
  reply.send(await registry.metrics());
};

// Witness metrics helpers
export const recordAttestation = (app: string, status: string, duration: number) => {
  attestationCount.inc({ app, status });
  const traceId = getTraceId();
  attestationLatency.observe({ app }, duration, traceId ? { trace_id: traceId } : undefined);
};

export const updateLedgerSize = (size: number) => {
  ledgerSize.set(size);
};

export const recordLedgerOperation = (operation: string) => {
  ledgerOperations.inc({ operation });
};
