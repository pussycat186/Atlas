import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

// Enable verbose logs only if needed
if (process.env.OTEL_DEBUG === '1') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

const serviceName = process.env.OTEL_SERVICE_NAME || 'atlas-gateway';
const exporterEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4318';

export const sdk = new NodeSDK({
  resource: new Resource({ 'service.name': serviceName }),
  traceExporter: new OTLPTraceExporter({ url: `${exporterEndpoint}/v1/traces` }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Keep low‑risk defaults; http/undici/fastify auto‑enabled
      '@opentelemetry/instrumentation-fastify': { enabled: true },
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-undici': { enabled: true },
    }),
  ],
});
