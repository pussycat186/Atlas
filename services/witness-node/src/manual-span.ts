import { trace, context } from '@opentelemetry/api';

export async function emitOneSpan() {
  const tracer = trace.getTracer('manual');
  return await tracer.startActiveSpan('manual_test_span', async (span) => {
    span.setAttribute('component', 'witness');
    span.setAttribute('kind', 'startup');
    await new Promise((r) => setTimeout(r, 50));
    span.end();
  });
}
