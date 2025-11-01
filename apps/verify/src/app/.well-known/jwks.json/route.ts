// JWKS (JSON Web Key Set) endpoint - RFC 7517
export const dynamic = 'force-dynamic';

export async function GET() {
  const jwks = {
    keys: [
      {
        kid: "atlas-verify-2025",
        kty: "RSA",
        alg: "RS256",
        use: "sig",
        n: "xGOr-H7A-rCSN2LVcZLB2SFSwlHgXF2hMXZqLqQbSvMN2LYB8ZQXL3mLlqpH8QoJvVnWj4LKQWU8fN2YCpLF5kbZGQWXJ6Y4T2LMKZH4QH6vWX1mUjN3hLF9kQXLJ6YWJ3mQH6vWX1mUjN3hLF9kQXLJ6YWJ3mQH6vWX1mUjN3hLF9k",
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
