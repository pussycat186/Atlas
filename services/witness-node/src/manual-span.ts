import type { Span } from '@opentelemetry/api';

export function withSpan<T>(span: Span, run: () => T): T {
  return run();
}
