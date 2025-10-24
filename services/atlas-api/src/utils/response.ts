/**
 * Response utility functions
 */

export function jsonResponse(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown
): Response {
  return jsonResponse(
    {
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    status
  );
}
