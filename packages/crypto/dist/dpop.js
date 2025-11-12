// Atlas Security-Core: DPoP (RFC 9449) Implementation
// Demonstrating Proof-of-Possession for OAuth 2.0 tokens
// Sử dụng Web Crypto API cho ES256 signing
import { CryptoError } from './types.js';
/**
 * In-memory JTI store (production nên dùng Redis với TTL)
 */
const usedJTIs = new Set();
const JTI_TTL_MS = 60_000; // 1 phút
/**
 * Clear JTI cache (for testing only)
 * @internal
 */
export function clearJTICache() {
    usedJTIs.clear();
}
/**
 * Tạo ES256 key pair cho DPoP
 * @returns Key pair với private key + public JWK
 */
export async function generateKeyPair() {
    const keyPair = await crypto.subtle.generateKey({
        name: 'ECDSA',
        namedCurve: 'P-256'
    }, true, // extractable
    ['sign', 'verify']);
    const publicJWK = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    // Thêm alg và kid vào JWK
    publicJWK.alg = 'ES256';
    publicJWK.kid = await generateKID(publicJWK);
    return {
        privateKey: keyPair.privateKey,
        publicKey: keyPair.publicKey,
        jwk: publicJWK
    };
}
/**
 * Tạo DPoP proof JWT
 * @param keyPair - DPoP key pair
 * @param method - HTTP method (GET, POST, etc.)
 * @param uri - Full request URI (không bao gồm query/fragment)
 * @param accessToken - Optional access token (để tính ath claim)
 */
export async function createProof(keyPair, method, uri, accessToken) {
    // Tạo unique JTI
    const jti = crypto.randomUUID();
    // Tính ath claim nếu có access token
    let ath;
    if (accessToken) {
        ath = await hashAccessToken(accessToken);
    }
    // Build JWT header
    const header = {
        typ: 'dpop+jwt',
        alg: 'ES256',
        jwk: keyPair.jwk
    };
    // Build JWT payload
    const payload = {
        jti,
        htm: method.toUpperCase(),
        htu: uri,
        iat: Math.floor(Date.now() / 1000),
        ...(ath && { ath })
    };
    // Encode header và payload
    const encodedHeader = base64urlEncode(JSON.stringify(header));
    const encodedPayload = base64urlEncode(JSON.stringify(payload));
    // Sign với ES256
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = await sign(keyPair.privateKey, signatureInput);
    return `${signatureInput}.${signature}`;
}
/**
 * Verify DPoP proof JWT
 * @param proof - DPoP JWT string
 * @param method - Expected HTTP method
 * @param uri - Expected request URI
 * @param accessToken - Optional access token (để verify ath claim)
 */
export async function verifyProof(proof, method, uri, accessToken) {
    const parts = proof.split('.');
    if (parts.length !== 3) {
        throw new CryptoError('Invalid DPoP proof format', 'SIGNATURE_INVALID');
    }
    const [encodedHeader, encodedPayload, signature] = parts;
    // Decode header và payload
    const header = JSON.parse(base64urlDecode(encodedHeader));
    const payload = JSON.parse(base64urlDecode(encodedPayload));
    // Validate header
    if (header.typ !== 'dpop+jwt' || header.alg !== 'ES256' || !header.jwk) {
        throw new CryptoError('Invalid DPoP header', 'SIGNATURE_INVALID');
    }
    // Validate payload claims
    if (payload.htm !== method.toUpperCase()) {
        throw new CryptoError('Method mismatch', 'SIGNATURE_INVALID', { expected: method, got: payload.htm });
    }
    if (payload.htu !== uri) {
        throw new CryptoError('URI mismatch', 'SIGNATURE_INVALID', { expected: uri, got: payload.htu });
    }
    // Check JTI uniqueness
    if (usedJTIs.has(payload.jti)) {
        throw new CryptoError('JTI reused', 'NONCE_REUSED', { jti: payload.jti });
    }
    // Check expiration (DPoP proof phải fresh, max 60s)
    const now = Math.floor(Date.now() / 1000);
    if (now - payload.iat > 60) {
        throw new CryptoError('DPoP proof expired', 'EXPIRED', { iat: payload.iat, now });
    }
    // Verify ath claim nếu có access token
    if (accessToken) {
        const expectedAth = await hashAccessToken(accessToken);
        if (payload.ath !== expectedAth) {
            throw new CryptoError('Access token hash mismatch', 'SIGNATURE_INVALID');
        }
    }
    // Import public key từ JWK
    const publicKey = await crypto.subtle.importKey('jwk', header.jwk, {
        name: 'ECDSA',
        namedCurve: 'P-256'
    }, false, ['verify']);
    // Verify signature
    const isValid = await verify(publicKey, `${encodedHeader}.${encodedPayload}`, signature);
    if (!isValid) {
        throw new CryptoError('Invalid DPoP signature', 'SIGNATURE_INVALID');
    }
    // Lưu JTI vào store
    usedJTIs.add(payload.jti);
    setTimeout(() => usedJTIs.delete(payload.jti), JTI_TTL_MS);
    return payload;
}
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Tính SHA-256 hash của access token (cho ath claim)
 */
async function hashAccessToken(token) {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return base64urlEncode(hash);
}
/**
 * Sign data với ES256
 */
async function sign(privateKey, data) {
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign({
        name: 'ECDSA',
        hash: 'SHA-256'
    }, privateKey, encoder.encode(data));
    return base64urlEncode(signature);
}
/**
 * Verify ES256 signature
 */
async function verify(publicKey, data, signature) {
    const encoder = new TextEncoder();
    const signatureBytes = base64urlDecodeBytes(signature);
    const dataBytes = encoder.encode(data);
    // @ts-ignore - TS5.3+ has ArrayBuffer/SharedArrayBuffer type confusion with DOM types
    return crypto.subtle.verify({
        name: 'ECDSA',
        hash: 'SHA-256'
    }, publicKey, signatureBytes, dataBytes);
}
/**
 * Generate kid (Key ID) từ JWK thumbprint (RFC 7638)
 */
async function generateKID(jwk) {
    // Canonical JWK (chỉ giữ required members, sorted)
    const canonical = JSON.stringify({
        crv: jwk.crv,
        kty: jwk.kty,
        x: jwk.x,
        y: jwk.y
    });
    const encoder = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-256', encoder.encode(canonical));
    return base64urlEncode(hash).substring(0, 8); // Lấy 8 ký tự đầu
}
/**
 * Base64URL encode (RFC 4648)
 */
function base64urlEncode(input) {
    let bytes;
    if (typeof input === 'string') {
        bytes = new TextEncoder().encode(input);
    }
    else {
        bytes = new Uint8Array(input);
    }
    const base64 = btoa(String.fromCharCode(...bytes));
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
/**
 * Base64URL decode to string
 */
function base64urlDecode(input) {
    const base64 = input
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const decoded = atob(padded);
    return decoded;
}
/**
 * Base64URL decode to Uint8Array
 */
function base64urlDecodeBytes(input) {
    const base64 = input
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const decoded = atob(padded);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
}
//# sourceMappingURL=dpop.js.map