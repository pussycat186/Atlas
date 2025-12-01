// JWKS (JSON Web Key Set) endpoint - RFC 7517
export const dynamic = 'force-dynamic';

export async function GET() {
  const jwks = {
    keys: [
      {
        kid: "atlas-proof-messenger-2025",
        kty: "RSA",
        alg: "RS256",
        use: "sig",
        n: "zIPt-J9C-tEUq4NXebNM4UHTynJiZH4jOZbsNsSdUxOP4NaD0bSZN5oNnnstJ0SqLxWpYl6NqMSYw0MWW0pNH7mdbiSZl8a6V4OOMbJ6SJ8wYZ3oWlP5jNG1mSZNL8aYL5oSJ8wYZ3oWlP5jNG1mSZNL8aYL5oSJ8wYZ3oWlP5jNG1mSZO",
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
