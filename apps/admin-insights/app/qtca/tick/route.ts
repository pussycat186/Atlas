export const runtime = 'nodejs';
export const revalidate = 60;

export async function GET() {
  const response = Response.json({
    timestamp: new Date().toISOString(),
    tick: Math.floor(Date.now() / 1000),
    status: "active",
    quantum_state: "entangled",
    lite_mode: true
  });
  
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
  response.headers.set('CDN-Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');
  response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60');
  return response;
}