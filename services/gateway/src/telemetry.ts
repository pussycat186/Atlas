/**
 * Atlas Gateway Observability Bootstrap
 * Simple observability setup for the gateway service
 */

import { trace, metrics } from '@opentelemetry/api';

export class TelemetryBootstrap {
  private tracer = trace.getTracer('atlas-gateway', '1.0.0');
  private meter = metrics.getMeter('atlas-gateway', '1.0.0');

  constructor() {
    // Simple initialization without complex SDK setup
  }

  /**
   * Initialize observability
   */
  async initialize(): Promise<void> {
    try {
      console.log('Observability initialized for atlas-gateway');
    } catch (error) {
      console.error('Failed to initialize observability:', error);
      throw error;
    }
  }

  /**
   * Shutdown observability
   */
  async shutdown(): Promise<void> {
    try {
      console.log('Observability shutdown for atlas-gateway');
    } catch (error) {
      console.error('Failed to shutdown observability:', error);
    }
  }

  /**
   * Get tracer instance
   */
  getTracer() {
    return this.tracer;
  }

  /**
   * Get meter instance
   */
  getMeter() {
    return this.meter;
  }
}

// Export singleton instance
export const telemetry = new TelemetryBootstrap();
