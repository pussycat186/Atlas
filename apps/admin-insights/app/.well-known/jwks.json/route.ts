// JWKS (JSON Web Key Set) endpoint - RFC 7517
export const dynamic = 'force-dynamic';

export async function GET() {
  const jwks = {
    keys: [
      {
        kid: "atlas-admin-insights-2025",
        kty: "RSA",
        alg: "RS256",
        use: "sig",
        n: "yHPs-I8B-sDTo3MWdaML3TGSxmIhYG3iNYarMrRcTwNO3MZC9aRYM4nMmmrqI9RpKwVoXk5MpLRXv9LVU9oMG6lcaHRYk7Z5U3MNLaI5RI7vXY2nVkO4iMG0lRYMK7ZXK4nRI7vXY2nVkO4iMG0lRYMK7ZXK4nRI7vXY2nVkO4iMG0lR",
        e: "AQAB"
      }
    ]
  };

  return Response.json(jwks, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
