import { healthCheck } from '@atlas/db';

export const runtime = 'edge';

export async function GET() {
  const health = await healthCheck();
  return Response.json({ 
    app: 'dev-portal',
    ...health 
  });
}