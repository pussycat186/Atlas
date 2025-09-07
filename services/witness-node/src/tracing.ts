import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const enabled = process.env.OTEL_ENABLED === '1' || process.env.OTEL_ENABLED === 'true';
if (enabled) {
  const svc = process.env.OTEL_SERVICE_NAME || 'atlas-witness';
  const url = (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4318') + '/v1/traces';
  const exporter = new OTLPTraceExporter({ url });
  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: svc,
    }),
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });
  sdk.start().catch((e) => console.error('OTEL start error', e));
}
