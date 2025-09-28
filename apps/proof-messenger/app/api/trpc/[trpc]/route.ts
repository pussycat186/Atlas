export const runtime = 'edge';

export async function GET() {
  return Response.json({ 
    app: 'proof-messenger',
    status: 'ok',
    timestamp: Date.now()
  });
}