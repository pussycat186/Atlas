// Atlas Security-Core: WebAuthn/Passkey Implementation
// Sử dụng @simplewebauthn cho registration + authentication flows
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
/**
 * Challenge store (production dùng Redis với TTL 5 phút)
 */
const challenges = new Map();
const CHALLENGE_TTL_MS = 300_000; // 5 phút
/**
 * Tạo registration options (bước 1 của Passkey signup)
 * @param userId - Unique user ID
 * @param userName - User's display name
 * @param rpConfig - Relying Party config
 */
export async function beginRegistration(userId, userName, rpConfig) {
    const opts = {
        rpName: rpConfig.name,
        rpID: rpConfig.id,
        userName,
        userID: new TextEncoder().encode(userId), // TS DOM types workaround
        // Timeout: 5 phút
        timeout: 300_000,
        // Attestation: none (không cần device attestation cho demo)
        attestationType: 'none',
        // Authenticator selection
        authenticatorSelection: {
            residentKey: 'required', // Passkey (discoverable credential)
            userVerification: 'required', // Yêu cầu biometric/PIN
            authenticatorAttachment: 'platform' // Platform authenticator (Touch ID, Windows Hello, etc.)
        },
        // Supported algorithms (ES256, RS256)
        supportedAlgorithmIDs: [-7, -257]
    };
    const options = await generateRegistrationOptions(opts);
    // Lưu challenge (để verify response)
    challenges.set(userId, options.challenge);
    setTimeout(() => challenges.delete(userId), CHALLENGE_TTL_MS);
    return options;
}
/**
 * Verify registration response (bước 2 của Passkey signup)
 * @param userId - User ID
 * @param response - WebAuthn registration response từ browser
 * @param rpConfig - Relying Party config
 */
export async function verifyRegistration(userId, response, rpConfig) {
    const expectedChallenge = challenges.get(userId);
    if (!expectedChallenge) {
        throw new Error('Challenge not found or expired');
    }
    const opts = {
        response: response,
        expectedChallenge,
        expectedOrigin: rpConfig.origin,
        expectedRPID: rpConfig.id
    };
    const verification = await verifyRegistrationResponse(opts);
    if (!verification.verified || !verification.registrationInfo) {
        throw new Error('Registration verification failed');
    }
    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
    // Xóa challenge đã dùng
    challenges.delete(userId);
    // Encode credential ID và public key
    const credentialIdB64 = base64urlEncode(credentialID);
    const publicKeyB64 = base64urlEncode(credentialPublicKey);
    return {
        credentialId: credentialIdB64,
        publicKey: publicKeyB64,
        counter,
        transports: [] // SimpleWebAuthn v9 không expose transports trong registrationInfo
    };
}
/**
 * Tạo authentication options (bước 1 của Passkey login)
 * @param rpConfig - Relying Party config
 * @param allowedCredentials - Optional: list credential IDs (nếu không dùng discoverable)
 */
export async function beginAuthentication(rpConfig, allowedCredentials) {
    const opts = {
        rpID: rpConfig.id,
        timeout: 300_000,
        userVerification: 'required',
        // Nếu có allowedCredentials, gửi cho browser (conditional UI)
        allowCredentials: allowedCredentials?.map(cred => ({
            type: 'public-key',
            id: base64urlDecodeBytes(cred.id), // TS DOM types workaround
            transports: cred.transports
        }))
    };
    const options = await generateAuthenticationOptions(opts);
    // Lưu challenge (dùng challenge làm key vì chưa biết userId)
    challenges.set(options.challenge, options.challenge);
    setTimeout(() => challenges.delete(options.challenge), CHALLENGE_TTL_MS);
    return options;
}
/**
 * Verify authentication response (bước 2 của Passkey login)
 * @param response - WebAuthn authentication response từ browser
 * @param credential - User's stored credential
 * @param rpConfig - Relying Party config
 */
export async function verifyAuthentication(response, credential, rpConfig) {
    const expectedChallenge = challenges.get(response.response.clientDataJSON
        ? JSON.parse(atob(response.response.clientDataJSON)).challenge
        : '');
    if (!expectedChallenge) {
        throw new Error('Challenge not found or expired');
    }
    const opts = {
        response,
        expectedChallenge,
        expectedOrigin: rpConfig.origin,
        expectedRPID: rpConfig.id,
        authenticator: {
            credentialID: base64urlDecodeBytes(credential.id),
            credentialPublicKey: base64urlDecodeBytes(credential.publicKey),
            counter: credential.counter
        }
    };
    const verification = await verifyAuthenticationResponse(opts);
    if (!verification.verified) {
        throw new Error('Authentication verification failed');
    }
    // Xóa challenge
    challenges.delete(expectedChallenge);
    return {
        credentialId: credential.id,
        userId: credential.userId,
        newCounter: verification.authenticationInfo.newCounter
    };
}
// ============================================================================
// Helper Functions
// ============================================================================
function base64urlEncode(buffer) {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
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
//# sourceMappingURL=webauthn.js.map