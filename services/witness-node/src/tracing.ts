/* v11.5 fix: OTel bootstrap with OTLP/HTTP exporter, gated by OTEL_ENABLED */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const enabled = process.env.OTEL_ENABLED === '1' || process.env.OTEL_ENABLED === 'true';
if (enabled) {
  const svc = process.env.OTEL_SERVICE_NAME || 'atlas-witness';
  const endpoint = (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4318') + '/v1/traces';
  const exporter = new OTLPTraceExporter({ url: endpoint });
  const sdk = new NodeSDK({
    traceExporter: exporter,
    serviceName: svc,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-express': { enabled: true }
      })
    ]
  });
  sdk.start();
  console.log(`[OTEL] started for ${svc} → ${endpoint}`);
}
