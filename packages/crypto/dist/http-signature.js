// Atlas Security-Core: HTTP Message Signatures (RFC 9421)
// Triển khai request/response signing với Ed25519
// Dùng cho integrity protection + non-repudiation
import { CryptoError } from './types.js';
/**
 * Build signature base theo RFC 9421 Section 2.5
 * Format: "@method": METHOD\n"@path": PATH\n"header": value\n"@signature-params": (...)
 */
export function buildSignatureBase(input) {
    const lines = [];
    // Derived components (prefix @)
    lines.push(`"@method": ${input.method}`);
    lines.push(`"@path": ${input.path}`);
    // HTTP headers (lowercase, sorted)
    const headerNames = Object.keys(input.headers).sort();
    for (const name of headerNames) {
        const value = input.headers[name];
        lines.push(`"${name.toLowerCase()}": ${value}`);
    }
    // Signature params (last line, special format)
    const params = input.signatureParams;
    const paramParts = [
        `"@method"`,
        `"@path"`,
        ...headerNames.map(h => `"${h.toLowerCase()}"`),
    ];
    const paramsStr = `(${paramParts.join(' ')});created=${params.created};keyid="${params.keyid}";alg="${params.algorithm}"`;
    if (params.expires) {
        // Insert before final ) if expires present
        const idx = paramsStr.lastIndexOf(';alg=');
        const withExpires = paramsStr.slice(0, idx) + `;expires=${params.expires}` + paramsStr.slice(idx);
        lines.push(`"@signature-params": ${withExpires}`);
    }
    else {
        lines.push(`"@signature-params": ${paramsStr}`);
    }
    return lines.join('\n');
}
/**
 * Base64URL encode Uint8Array
 */
function base64UrlEncode(bytes) {
    const base64 = btoa(String.fromCharCode(...bytes));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
/**
 * Base64URL decode to Uint8Array
 */
function base64UrlDecode(input) {
    // Add padding
    const padded = input + '==='.slice((input.length + 3) % 4);
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    return Uint8Array.from(binary, c => c.charCodeAt(0));
}
/**
 * Sign signature base với Ed25519 (using @noble/ed25519)
 * @param signatureBase - Output từ buildSignatureBase()
 * @param privateKeyHex - Ed25519 private key (64 hex chars)
 * @returns base64url signature
 */
export async function signEd25519(signatureBase, privateKeyHex) {
    // Import @noble/ed25519 dynamically
    const { sign } = await import('@noble/ed25519');
    const message = new TextEncoder().encode(signatureBase);
    const signatureBytes = await sign(message, privateKeyHex);
    return base64UrlEncode(signatureBytes);
}
/**
 * Verify Ed25519 signature (using @noble/ed25519)
 * @param signatureBase - Reconstructed signature base
 * @param signature - base64url signature string
 * @param publicKeyHex - Ed25519 public key (64 hex chars)
 * @returns true if valid
 */
export async function verifyEd25519(signatureBase, signature, publicKeyHex) {
    try {
        const { verify } = await import('@noble/ed25519');
        const signatureBytes = base64UrlDecode(signature);
        const message = new TextEncoder().encode(signatureBase);
        return await verify(signatureBytes, message, publicKeyHex);
    }
    catch (error) {
        // Crypto errors = invalid signature
        return false;
    }
}
/**
 * Parse Signature-Input header (RFC 9421 Section 4.1)
 * Format: sig1=("@method" "@path" "content-type");created=1234;keyid="key-1";alg="ed25519"
 * @returns SignatureMetadata hoặc throw nếu invalid
 */
export function parseSignatureInput(header) {
    // Simple regex parser (production cần parser mạnh hơn)
    const createdMatch = header.match(/;created=(\d+)/);
    const keyidMatch = header.match(/;keyid="([^"]+)"/);
    const algMatch = header.match(/;alg="([^"]+)"/);
    const expiresMatch = header.match(/;expires=(\d+)/);
    const nonceMatch = header.match(/;nonce="([^"]+)"/);
    if (!createdMatch || !keyidMatch || !algMatch) {
        throw new CryptoError('Invalid Signature-Input header', 'SIGNATURE_INVALID', { header });
    }
    return {
        keyid: keyidMatch[1],
        algorithm: algMatch[1],
        created: parseInt(createdMatch[1], 10),
        expires: expiresMatch ? parseInt(expiresMatch[1], 10) : undefined,
        nonce: nonceMatch ? nonceMatch[1] : undefined,
    };
}
/**
 * Verify HTTP signature với clock skew tolerance
 * @param signatureInput - Parsed signature-input header
 * @param signature - Signature value từ Signature header
 * @param publicKeyHex - Ed25519 public key từ JWKS (hex string)
 * @param clockSkewSeconds - Tolerance (default 300s = 5 phút)
 */
export async function verifyHttpSignature(signatureInput, signature, publicKeyHex, clockSkewSeconds = 300) {
    const now = Math.floor(Date.now() / 1000);
    const created = signatureInput.signatureParams.created;
    const expires = signatureInput.signatureParams.expires;
    // Clock skew check
    if (Math.abs(now - created) > clockSkewSeconds) {
        throw new CryptoError('Signature timestamp out of tolerance', 'EXPIRED', { created, now, skew: now - created });
    }
    // Expiry check
    if (expires && now > expires) {
        throw new CryptoError('Signature expired', 'EXPIRED', { expires, now });
    }
    // Algorithm check
    if (signatureInput.signatureParams.algorithm !== 'ed25519') {
        throw new CryptoError('Unsupported algorithm', 'SIGNATURE_INVALID', { alg: signatureInput.signatureParams.algorithm });
    }
    // Rebuild signature base
    const signatureBase = buildSignatureBase(signatureInput);
    // Verify Ed25519 signature
    return await verifyEd25519(signatureBase, signature, publicKeyHex);
}
//# sourceMappingURL=http-signature.js.map