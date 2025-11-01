import type { UserCredential, RegistrationResult, AuthenticationResult } from './types.js';
/**
 * Relying Party configuration
 */
interface RPConfig {
    name: string;
    id: string;
    origin: string;
}
/**
 * Tạo registration options (bước 1 của Passkey signup)
 * @param userId - Unique user ID
 * @param userName - User's display name
 * @param rpConfig - Relying Party config
 */
export declare function beginRegistration(userId: string, userName: string, rpConfig: RPConfig): Promise<unknown>;
/**
 * Verify registration response (bước 2 của Passkey signup)
 * @param userId - User ID
 * @param response - WebAuthn registration response từ browser
 * @param rpConfig - Relying Party config
 */
export declare function verifyRegistration(userId: string, response: unknown, rpConfig: RPConfig): Promise<RegistrationResult>;
/**
 * Tạo authentication options (bước 1 của Passkey login)
 * @param rpConfig - Relying Party config
 * @param allowedCredentials - Optional: list credential IDs (nếu không dùng discoverable)
 */
export declare function beginAuthentication(rpConfig: RPConfig, allowedCredentials?: UserCredential[]): Promise<unknown>;
/**
 * Verify authentication response (bước 2 của Passkey login)
 * @param response - WebAuthn authentication response từ browser
 * @param credential - User's stored credential
 * @param rpConfig - Relying Party config
 */
export declare function verifyAuthentication(response: any, credential: UserCredential, rpConfig: RPConfig): Promise<AuthenticationResult>;
export {};
//# sourceMappingURL=webauthn.d.ts.map