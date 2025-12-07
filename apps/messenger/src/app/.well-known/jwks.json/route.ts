// JWKS (JSON Web Key Set) endpoint - Cung cấp public keys cho xác thực JWT
// Theo chuẩn RFC 7517: https://tools.ietf.org/html/rfc7517

export async function GET() {
  // Tạo JWKS với các keys mẫu cho GA
  // Trong production, keys này sẽ được load từ secrets hoặc KMS
  const jwks = {
    keys: [
      {
        // Key ID - định danh duy nhất
        kid: "atlas-v2-signing-key-2025",
        
        // Key type - RSA cho digital signatures
        kty: "RSA",
        
        // Algorithm - RS256 (RSA Signature with SHA-256)
        alg: "RS256",
        
        // Public key usage
        use: "sig",
        
        // RSA modulus (n) - base64url encoded
        // Đây là public key component, không phải secret
        n: "xGOr-H7A-rCSN2LVcZLB2SFSwlHgXF2hMXZqLqQbSvMN2LYB8ZQXL3mLlqpH8QoJvVnWj4LKQWU8fN2YCpLF5kbZGQWXJ6Y4T2LMKZH4QH6vWX1mUjN3hLF9kQXLJ6YWJ3mQH6vWX1mUjN3hLF9kQXLJ6YWJ3mQH6vWX1mUjN3hLF9k",
        
        // RSA exponent (e) - base64url encoded
        // Thường là AQAB (65537 trong decimal)
        e: "AQAB"
      },
      {
        // Backup/rotation key
        kid: "atlas-v2-backup-key-2025",
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
      'Cache-Control': 'public, max-age=3600', // Cache 1 giờ
      'Access-Control-Allow-Origin': '*', // JWKS là public endpoint
    },
  });
}
