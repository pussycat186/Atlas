/**
 * DPoP (Demonstrating Proof-of-Possession) Implementation
 * 
 * Triển khai RFC 9449 - OAuth 2.0 Demonstrating Proof-of-Possession (DPoP)
 * DPoP ngăn chặn tấn công replay và token theft bằng cách yêu cầu client
 * chứng minh quyền sở hữu khóa riêng tương ứng với khóa công khai trong token.
 * 
 * Tham khảo: https://datatracker.ietf.org/doc/html/rfc9449
 * 
 * Lưu ý: Đây là stub placeholder. Triển khai thực sự cần:
 * - Tạo và ký JWT DPoP proof
 * - Xác thực DPoP proof phía server
 * - Quản lý JTI (JWT ID) để ngăn chặn replay
 * - Rotation khóa an toàn
 */

export interface DPoPProof {
  /** JWT token đầy đủ (header.payload.signature) */
  jwt: string;
  /** Khóa công khai (JWK format) */
  jwk: JsonWebKey;
  /** Thời gian tạo (Unix timestamp) */
  iat: number;
  /** JWT ID duy nhất (để chống replay) */
  jti: string;
  /** HTTP method (GET, POST, etc.) */
  htm: string;
  /** HTTP URI */
  htu: string;
  /** Access token hash (tùy chọn) */
  ath?: string;
}

export interface DPoPKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  jwk: JsonWebKey;
}

// In-memory store cho JTI đã sử dụng (để phát hiện replay)
// Trong production, nên dùng Redis hoặc distributed cache
const usedJtis = new Set<string>();
const JTI_EXPIRY_MS = 60 * 1000; // 60 giây

/**
 * Sinh cặp khóa EC cho DPoP (ES256 - P-256)
 * @returns Cặp khóa và JWK tương ứng
 */
export async function generateKeyPair(): Promise<DPoPKeyPair> {
  // TODO: Triển khai sinh khóa thực sự
  // Sử dụng Web Crypto API: crypto.subtle.generateKey
  // Algorithm: ECDSA với curve P-256 (ES256)
  
  const placeholder: DPoPKeyPair = {
    publicKey: {} as CryptoKey,
    privateKey: {} as CryptoKey,
    jwk: {
      kty: 'EC',
      crv: 'P-256',
      x: 'placeholder_x',
      y: 'placeholder_y',
      use: 'sig',
      kid: 'dpop-key-1',
    },
  };
  
  return placeholder;
}

/**
 * Tạo DPoP proof JWT
 * @param keyPair - Cặp khóa DPoP
 * @param method - HTTP method
 * @param uri - HTTP URI đầy đủ
 * @param accessToken - Access token (tùy chọn, để tính hash)
 * @returns DPoP proof JWT
 */
export async function createProof(
  keyPair: DPoPKeyPair,
  method: string,
  uri: string,
  accessToken?: string
): Promise<string> {
  // TODO: Triển khai tạo proof thực sự
  // 1. Tạo JTI ngẫu nhiên (UUID hoặc random bytes)
  // 2. Tạo JWT header với typ: "dpop+jwt", alg: "ES256", jwk
  // 3. Tạo JWT payload với htm, htu, iat, jti, (ath nếu có accessToken)
  // 4. Ký JWT bằng privateKey
  // 5. Trả về JWT hoàn chỉnh
  
  const jti = `jti_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const iat = Math.floor(Date.now() / 1000);
  
  // Placeholder JWT structure
  const header = {
    typ: 'dpop+jwt',
    alg: 'ES256',
    jwk: {
      kty: keyPair.jwk.kty,
      crv: keyPair.jwk.crv,
      x: keyPair.jwk.x,
      y: keyPair.jwk.y,
    },
  };
  
  const payload = {
    jti,
    htm: method.toUpperCase(),
    htu: uri,
    iat,
    ...(accessToken ? { ath: await hashToken(accessToken) } : {}),
  };
  
  // Placeholder JWT (không ký thực sự)
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signatureB64 = 'placeholder_signature';
  
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

/**
 * Xác thực DPoP proof JWT
 * @param proofJwt - JWT proof cần xác thực
 * @param method - HTTP method mong đợi
 * @param uri - HTTP URI mong đợi
 * @returns true nếu hợp lệ, false nếu không
 */
export async function verifyProof(
  proofJwt: string,
  method: string,
  uri: string
): Promise<boolean> {
  // TODO: Triển khai xác thực thực sự
  // 1. Parse JWT header và payload
  // 2. Kiểm tra header.typ === "dpop+jwt"
  // 3. Kiểm tra header.alg được hỗ trợ (ES256)
  // 4. Trích xuất JWK từ header
  // 5. Xác thực chữ ký JWT bằng JWK
  // 6. Kiểm tra payload.htm === method
  // 7. Kiểm tra payload.htu === uri
  // 8. Kiểm tra payload.iat (không quá cũ hoặc tương lai)
  // 9. Kiểm tra payload.jti chưa được sử dụng (anti-replay)
  // 10. Lưu jti vào usedJtis với expiry
  
  try {
    const parts = proofJwt.split('.');
    if (parts.length !== 3) return false;
    
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    
    // Kiểm tra cơ bản
    if (header.typ !== 'dpop+jwt') return false;
    if (payload.htm !== method.toUpperCase()) return false;
    if (payload.htu !== uri) return false;
    
    // Kiểm tra thời gian (iat không quá 60 giây trước đó)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - payload.iat) > 60) return false;
    
    // Kiểm tra JTI replay
    if (usedJtis.has(payload.jti)) return false;
    usedJtis.add(payload.jti);
    
    // Dọn dẹp JTI cũ (simple implementation)
    setTimeout(() => usedJtis.delete(payload.jti), JTI_EXPIRY_MS);
    
    // TODO: Xác thực chữ ký thực sự bằng crypto.subtle.verify
    
    return true;
  } catch (error) {
    console.error('DPoP verification error:', error);
    return false;
  }
}

/**
 * Tính hash SHA-256 của access token (cho claim 'ath')
 * @param token - Access token
 * @returns Base64url-encoded hash
 */
async function hashToken(token: string): Promise<string> {
  // TODO: Triển khai hash thực sự bằng crypto.subtle.digest
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  // Placeholder: trong thực tế cần dùng SHA-256
  return base64UrlEncode('placeholder_hash');
}

/**
 * Base64url encode (RFC 4648)
 */
function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64url decode
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) base64 += '='.repeat(4 - pad);
  return atob(base64);
}

/**
 * Dọn dẹp JTI store (gọi định kỳ trong production)
 */
export function cleanupJtiStore(): void {
  // Trong production, cần cơ chế dọn dẹp thông minh hơn
  // với distributed cache và TTL tự động
  usedJtis.clear();
}

/**
 * Lấy số lượng JTI đang lưu trữ (cho debugging/monitoring)
 */
export function getJtiStoreSize(): number {
  return usedJtis.size;
}
