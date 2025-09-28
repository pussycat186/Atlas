export const runtime = 'edge';

export async function GET() {
  return Response.json({ 
    app: 'admin-insights',
    status: 'ok',
    timestamp: Date.now()
  });
}