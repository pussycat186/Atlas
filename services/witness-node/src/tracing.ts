import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

let sdk: NodeSDK | undefined;

export async function initTracing(serviceName = 'atlas-witness') {
  try {
    if (process.env.OTEL_ENABLED !== '1') return;
    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
    const exporter = new OTLPTraceExporter({ url: `${endpoint}/v1/traces` });

    sdk = new NodeSDK({
      serviceName: serviceName,
      traceExporter: exporter,
      instrumentations: [getNodeAutoInstrumentations()],
    });
    await sdk.start();
  } catch (e: unknown) {
    console.warn('[otel] init failed:', e);
  }
}

export async function shutdownTracing() {
  try { if (sdk) await sdk.shutdown(); } catch (e: unknown) {
    console.warn('[otel] shutdown failed:', e);
  }
}
