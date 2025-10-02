export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET() {
  const response = Response.json({
    timestamp: new Date().toISOString(),
    total_ticks: 42,
    active_connections: 3,
    quantum_coherence: 0.95,
    lite_features: ["tick", "summary"],
    status: "operational"
  });
  
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
  response.headers.set('CDN-Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');
  response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60');
  return response;
}