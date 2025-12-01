// Atlas Security-Core: HTTP Message Signatures (RFC 9421)
// Verify Ed25519 signatures trên HTTP receipts
// Sử dụng Web Crypto API
import { CryptoError } from './types.js';
/**
 * JWKS cache (production nên dùng Redis với TTL)
 */
const jwksCache = new Map();
const JWKS_TTL_MS = 300_000; // 5 phút
/**
 * Parse Signature header (RFC 9421 format)
 * Example: sig1=:signature_bytes:; keyid="key-123"; created=1618884475; alg="ed25519"
 */
export function parseSignatureHeader(signatureHeader) {
    const parts = {};
    // Parse signature value (sig1=:base64:)
    const sigMatch = signatureHeader.match(/sig1=:([^:]+):/);
    if (!sigMatch) {
        throw new CryptoError('Invalid signature format', 'SIGNATURE_INVALID');
    }
    parts.signature = sigMatch[1];
    // Parse parameters
    const params = signatureHeader.split(';').slice(1); // Skip sig1=:...:
    for (const param of params) {
        const [key, value] = param.trim().split('=');
        parts[key] = value.replace(/"/g, '');
    }
    return {
        signature: parts.signature,
        keyId: parts.keyid,
        algorithm: parts.alg,
        created: parseInt(parts.created, 10),
        expires: parts.expires ? parseInt(parts.expires, 10) : undefined,
        headers: parts.headers ? parts.headers.split(' ') : []
    };
}
/**
 * Build signature base string (RFC 9421 Section 2.5)
 * @param method - HTTP method
 * @param path - Request path
 * @param headers - HTTP headers object
 * @param signedHeaders - List of header names to include
 */
export function buildSignatureBase(method, path, headers, signedHeaders) {
    const lines = [];
    // Add @method pseudo-header
    if (signedHeaders.includes('@method')) {
        lines.push(`"@method": ${method.toUpperCase()}`);
    }
    // Add @path pseudo-header
    if (signedHeaders.includes('@path')) {
        lines.push(`"@path": ${path}`);
    }
    // Add regular headers
    for (const headerName of signedHeaders) {
        if (headerName.startsWith('@'))
            continue; // Skip pseudo-headers
        const value = headers[headerName.toLowerCase()];
        if (value !== undefined) {
            lines.push(`"${headerName.toLowerCase()}": ${value}`);
        }
    }
    // Add @signature-params pseudo-header (MUST be last)
    const params = signedHeaders.map(h => `"${h}"`).join(' ');
    lines.push(`"@signature-params": (${params})`);
    return lines.join('\n');
}
/**
 * Verify HTTP signature
 * @param signature - Parsed signature metadata
 * @param signatureBase - Signature base string
 * @param jwksUri - URI to fetch JWKS (e.g., /.well-known/jwks.json)
 */
export async function verifySignature(signature, signatureBase, jwksUri) {
    // Check expiration
    if (signature.expires && Date.now() / 1000 > signature.expires) {
        throw new CryptoError('Signature expired', 'EXPIRED', { expires: signature.expires });
    }
    // Check algorithm
    if (signature.algorithm !== 'ed25519') {
        throw new CryptoError('Unsupported algorithm', 'SIGNATURE_INVALID', { alg: signature.algorithm });
    }
    // Fetch public key từ JWKS
    const publicJWK = await fetchPublicKey(jwksUri, signature.keyId);
    // Import Ed25519 public key
    const publicKey = await crypto.subtle.importKey('jwk', publicJWK, {
        name: 'Ed25519'
    }, false, ['verify']);
    // Decode signature từ base64
    const signatureBytes = base64DecodeBytes(signature.signature);
    // Verify signature
    const encoder = new TextEncoder();
    // @ts-ignore - TS5.3+ has ArrayBuffer/SharedArrayBuffer type confusion with DOM types
    const isValid = await crypto.subtle.verify('Ed25519', publicKey, signatureBytes, encoder.encode(signatureBase));
    if (!isValid) {
        throw new CryptoError('Signature verification failed', 'SIGNATURE_INVALID');
    }
    return true;
}
/**
 * Fetch public key từ JWKS endpoint
 * @param jwksUri - JWKS URI (e.g., https://example.com/.well-known/jwks.json)
 * @param keyId - Key ID to lookup
 */
async function fetchPublicKey(jwksUri, keyId) {
    // Check cache
    const cached = jwksCache.get(`${jwksUri}:${keyId}`);
    if (cached) {
        return cached;
    }
    // Fetch JWKS (production nên add retry + timeout)
    const response = await fetch(jwksUri);
    if (!response.ok) {
        throw new CryptoError('Failed to fetch JWKS', 'INVALID_KEY', { status: response.status });
    }
    const jwks = await response.json();
    // Find key by kid
    const key = jwks.keys.find(k => k.kid === keyId);
    if (!key) {
        throw new CryptoError('Key not found in JWKS', 'INVALID_KEY', { keyId });
    }
    // Validate key type
    if (key.kty !== 'OKP' || key.crv !== 'Ed25519') {
        throw new CryptoError('Invalid key type', 'INVALID_KEY', { kty: key.kty, crv: key.crv });
    }
    // Cache key
    jwksCache.set(`${jwksUri}:${keyId}`, key);
    setTimeout(() => jwksCache.delete(`${jwksUri}:${keyId}`), JWKS_TTL_MS);
    return key;
}
/**
 * Sign HTTP message (for server-side signing)
 * @param privateKey - Ed25519 private key (CryptoKey)
 * @param signatureBase - Signature base string
 * @param keyId - Key identifier
 */
export async function signMessage(privateKey, signatureBase, keyId, signedHeaders) {
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign('Ed25519', privateKey, encoder.encode(signatureBase));
    const signatureB64 = base64Encode(signature);
    const created = Math.floor(Date.now() / 1000);
    // Format theo RFC 9421
    const headersList = signedHeaders.map(h => `"${h}"`).join(' ');
    return `sig1=:${signatureB64}:; keyid="${keyId}"; created=${created}; alg="ed25519"; headers=(${headersList})`;
}
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Base64 encode (standard, với padding)
 */
function base64Encode(input) {
    const bytes = new Uint8Array(input);
    return btoa(String.fromCharCode(...bytes));
}
/**
 * Base64 decode to Uint8Array
 */
function base64DecodeBytes(input) {
    const decoded = atob(input);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
}
//# sourceMappingURL=http-signatures.js.map