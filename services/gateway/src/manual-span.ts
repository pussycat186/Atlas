import { trace } from '@opentelemetry/api';

export async function emitOneSpan() {
  const tracer = trace.getTracer('manual');
  const span = tracer.startSpan('manual_test_span');
  await new Promise((r) => setTimeout(r, 200));
  span.setAttribute('demo', 'true');
  span.end();
  console.log('[OTEL] Manual span emitted');
}
