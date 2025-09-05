import client from 'prom-client';

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

// Quorum-specific metrics
const quorumAttempts = new client.Counter({
  name: 'quorum_attempts_total',
  help: 'Total number of quorum attempts',
  labelNames: ['status']
});

const quorumSuccess = new client.Counter({
  name: 'quorum_success_total',
  help: 'Total number of successful quorum operations',
  labelNames: ['witness_count']
});

const quorumFailure = new client.Counter({
  name: 'quorum_failure_total',
  help: 'Total number of failed quorum operations',
  labelNames: ['reason']
});

// Witness client metrics
const witnessRequestDuration = new client.Histogram({
  name: 'witness_request_duration_seconds',
  help: 'Duration of witness requests in seconds',
  labelNames: ['witness_id', 'endpoint'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2]
});

const witnessRequestCount = new client.Counter({
  name: 'witness_requests_total',
  help: 'Total number of witness requests',
  labelNames: ['witness_id', 'endpoint', 'status']
});

// Register all metrics
registry.registerMetric(httpRequestDuration);
registry.registerMetric(httpRequestCount);
registry.registerMetric(quorumAttempts);
registry.registerMetric(quorumSuccess);
registry.registerMetric(quorumFailure);
registry.registerMetric(witnessRequestDuration);
registry.registerMetric(witnessRequestCount);

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

// Quorum metrics helpers
export const recordQuorumAttempt = (status: string) => {
  quorumAttempts.inc({ status });
};

export const recordQuorumSuccess = (witnessCount: number) => {
  quorumSuccess.inc({ witness_count: witnessCount.toString() });
};

export const recordQuorumFailure = (reason: string) => {
  quorumFailure.inc({ reason });
};

// Witness metrics helpers
export const recordWitnessRequest = (witnessId: string, endpoint: string, duration: number, status: string) => {
  witnessRequestCount.inc({ 
    witness_id: witnessId, 
    endpoint, 
    status 
  });
  witnessRequestDuration.observe({ 
    witness_id: witnessId, 
    endpoint 
  }, duration);
};
