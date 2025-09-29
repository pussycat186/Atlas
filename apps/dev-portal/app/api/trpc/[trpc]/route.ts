export const runtime = 'edge';

export async function GET() {
  return Response.json({ 
    app: 'dev-portal',
    status: 'ok',
    timestamp: Date.now()
  });
}