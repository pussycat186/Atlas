import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const serviceName = process.env.OTEL_SERVICE_NAME || 'atlas-witness';
const exporterEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4318';

export const sdk = new NodeSDK({
  resource: new Resource({
    'service.name': serviceName,
    'service.instance.id': process.env.WITNESS_ID || process.env.HOSTNAME || 'witness',
  }),
  traceExporter: new OTLPTraceExporter({ url: `${exporterEndpoint}/v1/traces` }),
  instrumentations: [ getNodeAutoInstrumentations() ],
});
