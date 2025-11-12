/**
 * OpenTelemetry Tracing Setup
 * Distributed tracing for Atlas services
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { trace, context, SpanStatusCode, type Span } from '@opentelemetry/api';

/**
 * Initialize OpenTelemetry SDK
 */
export function initTelemetry(serviceName: string, serviceVersion: string): NodeSDK {
  const sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: serviceName,
      [SEMRESATTRS_SERVICE_VERSION]: serviceVersion,
    }),
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // Reduce noise
        },
      }),
    ],
  });

  sdk.start();
  console.log('✅ OpenTelemetry tracing initialized');

  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('OpenTelemetry shut down'))
      .catch((err) => console.error('Error shutting down OpenTelemetry', err));
  });

  return sdk;
}

/**
 * Create a new span for a crypto operation
 */
export function traceCryptoOperation<T>(
  operationName: string,
  attributes: Record<string, string | number>,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = trace.getTracer('atlas-crypto');
  return tracer.startActiveSpan(operationName, { attributes }, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Trace E2EE message encryption
 */
export async function traceEncryption(
  senderId: string,
  recipientId: string,
  fn: () => Promise<Uint8Array>
): Promise<Uint8Array> {
  return traceCryptoOperation(
    'e2ee.encrypt',
    {
      'atlas.sender_id': senderId,
      'atlas.recipient_id': recipientId,
      'atlas.operation': 'encrypt',
    },
    async (span) => {
      const ciphertext = await fn();
      span.setAttribute('atlas.ciphertext_size', ciphertext.byteLength);
      return ciphertext;
    }
  );
}

/**
 * Trace E2EE message decryption
 */
export async function traceDecryption(recipientId: string, fn: () => Promise<Uint8Array>): Promise<Uint8Array> {
  return traceCryptoOperation(
    'e2ee.decrypt',
    {
      'atlas.recipient_id': recipientId,
      'atlas.operation': 'decrypt',
    },
    async (span) => {
      const plaintext = await fn();
      span.setAttribute('atlas.plaintext_size', plaintext.byteLength);
      return plaintext;
    }
  );
}

export { trace, context };
