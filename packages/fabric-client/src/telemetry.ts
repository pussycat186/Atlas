/**
 * OpenTelemetry Instrumentation Setup
 * Centralized telemetry configuration for Atlas services
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp';
import { OTLPMetricExporter } from '@opentelemetry/exporter-otlp';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace, metrics } from '@opentelemetry/api';

export interface TelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  otlpEndpoint?: string;
  prometheusPort?: number;
  samplingRatio?: number;
  environment?: string;
}

export class AtlasTelemetry {
  private sdk: NodeSDK;
  private prometheusExporter?: PrometheusExporter;

  constructor(config: TelemetryConfig) {
    // Create resource
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment || 'development',
    });

    // Create exporters
    const traceExporter = config.otlpEndpoint
      ? new OTLPTraceExporter({
          url: `${config.otlpEndpoint}/v1/traces`,
        })
      : undefined;

    const metricExporter = config.otlpEndpoint
      ? new OTLPMetricExporter({
          url: `${config.otlpEndpoint}/v1/metrics`,
        })
      : undefined;

    // Create Prometheus exporter if port is specified
    if (config.prometheusPort) {
      this.prometheusExporter = new PrometheusExporter({
        port: config.prometheusPort,
      });
    }

    // Create SDK
    this.sdk = new NodeSDK({
      resource,
      traceExporter,
      metricExporter: this.prometheusExporter || metricExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            enabled: false, // Disable file system instrumentation
          },
          '@opentelemetry/instrumentation-dns': {
            enabled: false, // Disable DNS instrumentation
          },
          '@opentelemetry/instrumentation-net': {
            enabled: false, // Disable net instrumentation
          },
        }),
      ],
    });

    // Set sampling ratio
    if (config.samplingRatio !== undefined) {
      process.env.OTEL_TRACES_SAMPLER = 'traceidratio';
      process.env.OTEL_TRACES_SAMPLER_ARG = config.samplingRatio.toString();
    }
  }

  /**
   * Start telemetry
   */
  start(): void {
    this.sdk.start();
    console.log(`Telemetry started for service: ${process.env.OTEL_SERVICE_NAME || 'unknown'}`);
  }

  /**
   * Stop telemetry
   */
  async stop(): Promise<void> {
    await this.sdk.shutdown();
    console.log('Telemetry stopped');
  }

  /**
   * Get tracer
   */
  getTracer(name: string, version?: string) {
    return trace.getTracer(name, version);
  }

  /**
   * Get meter
   */
  getMeter(name: string, version?: string) {
    return metrics.getMeter(name, version);
  }

  /**
   * Get Prometheus metrics endpoint
   */
  getPrometheusEndpoint(): string | undefined {
    return this.prometheusExporter?.getMetricsEndpoint();
  }
}

// Default telemetry configuration
export const createDefaultTelemetry = (serviceName: string, serviceVersion: string = '1.0.0'): AtlasTelemetry => {
  const config: TelemetryConfig = {
    serviceName,
    serviceVersion,
    otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    prometheusPort: process.env.PROMETHEUS_PORT ? parseInt(process.env.PROMETHEUS_PORT) : 9090,
    samplingRatio: process.env.OTEL_SAMPLING_RATIO ? parseFloat(process.env.OTEL_SAMPLING_RATIO) : 1.0,
    environment: process.env.NODE_ENV || 'development',
  };

  return new AtlasTelemetry(config);
};
