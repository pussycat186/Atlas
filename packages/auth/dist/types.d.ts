/**
 * User credential lưu trong database
 */
export interface UserCredential {
    id: string;
    userId: string;
    publicKey: string;
    counter: number;
    transports: string[];
    createdAt: string;
}
/**
 * Session với DPoP binding
 */
export interface Session {
    sessionId: string;
    userId: string;
    dpopKeyThumbprint: string;
    createdAt: number;
    expiresAt: number;
}
/**
 * WebAuthn registration result
 */
export interface RegistrationResult {
    credentialId: string;
    publicKey: string;
    counter: number;
    transports: string[];
}
/**
 * WebAuthn authentication result
 */
export interface AuthenticationResult {
    credentialId: string;
    userId: string;
    newCounter: number;
}
//# sourceMappingURL=types.d.ts.map