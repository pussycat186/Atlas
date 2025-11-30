// API Healthz endpoint - Health check cho Vercel preview
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(
    { ok: true, timestamp: new Date().toISOString(), service: 'proof-messenger' },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
