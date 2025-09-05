import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

let sdk: NodeSDK | undefined;

export async function initTracing() {
  if (process.env.OTEL_ENABLED !== '1') return;
  const endpoint = (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4318').replace(/\/$/, '');
  const serviceName = process.env.OTEL_SERVICE_NAME || 'atlas-gateway';
  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION || 'dev',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.DEPLOYMENT_ENV || 'local',
    }),
    traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
    instrumentations: [getNodeAutoInstrumentations()],
  });
  await sdk.start();
  process.on('SIGTERM', () => { sdk?.shutdown().catch(() => {}); });
}
