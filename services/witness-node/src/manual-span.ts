/* v11.5 fix: tiny manual span to verify startup tracing */
import { context, trace, SpanStatusCode } from '@opentelemetry/api';

export async function emitOneSpan(name: string = 'manual_test_span') {
  const tracer = trace.getTracer('manual');
  await context.with(trace.setSpan(context.active(), tracer.startSpan(name)), async () => {
    try {
      await new Promise((r) => setTimeout(r, 25));
      trace.getSpan(context.active())?.setStatus({ code: SpanStatusCode.OK });
    } finally {
      trace.getSpan(context.active())?.end();
    }
  });
}
