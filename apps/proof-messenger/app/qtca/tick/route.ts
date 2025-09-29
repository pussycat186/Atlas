export const runtime = 'edge';

export async function GET() {
  return Response.json({
    timestamp: new Date().toISOString(),
    tick: Math.floor(Date.now() / 1000),
    status: "active",
    quantum_state: "entangled",
    lite_mode: true
  });
}