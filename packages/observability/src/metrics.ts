/**
 * Prometheus Metrics for Atlas
 * Crypto operations, auth events, and performance metrics
 */

import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { metrics, type Counter, type Histogram } from '@opentelemetry/api';

let cryptoOperationsCounter: Counter;
let authEventsCounter: Counter;
let messageLatencyHistogram: Histogram;
let keyRotationCounter: Counter;

/**
 * Initialize Prometheus metrics
 */
export function initMetrics(): void {
  const exporter = new PrometheusExporter({ port: 9464 }, () => {
    console.log('✅ Prometheus metrics available at http://localhost:9464/metrics');
  });

  const meterProvider = new MeterProvider();
  meterProvider.addMetricReader(exporter);

  metrics.setGlobalMeterProvider(meterProvider);

  const meter = metrics.getMeter('atlas-metrics');

  // Crypto operations counter
  cryptoOperationsCounter = meter.createCounter('atlas_crypto_operations_total', {
    description: 'Total number of crypto operations',
  });

  // Auth events counter
  authEventsCounter = meter.createCounter('atlas_auth_events_total', {
    description: 'Total authentication events',
  });

  // Message latency histogram
  messageLatencyHistogram = meter.createHistogram('atlas_message_latency_ms', {
    description: 'Message processing latency in milliseconds',
  });

  // Key rotation counter
  keyRotationCounter = meter.createCounter('atlas_key_rotations_total', {
    description: 'Total key rotations',
  });
}

/**
 * Record crypto operation
 */
export function recordCryptoOperation(operation: string, status: 'success' | 'failure'): void {
  cryptoOperationsCounter.add(1, { operation, status });
}

/**
 * Record auth event
 */
export function recordAuthEvent(event: string, result: 'success' | 'failure'): void {
  authEventsCounter.add(1, { event, result });
}

/**
 * Record message latency
 */
export function recordMessageLatency(latencyMs: number, operation: 'encrypt' | 'decrypt'): void {
  messageLatencyHistogram.record(latencyMs, { operation });
}

/**
 * Record key rotation
 */
export function recordKeyRotation(keyType: string): void {
  keyRotationCounter.add(1, { key_type: keyType });
}
