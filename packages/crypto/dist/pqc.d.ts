import type { PQCConfig } from './types.js';
/**
 * PQC configuration mặc định (disabled vì chưa stable)
 */
export declare const DEFAULT_PQC_CONFIG: PQCConfig;
/**
 * ML-KEM-768 (Kyber) key encapsulation
 * @param publicKey - Recipient's Kyber public key
 * @returns Encapsulated key + shared secret
 */
export declare function kemEncapsulate(publicKey: Uint8Array): Promise<{
    ciphertext: Uint8Array;
    sharedSecret: Uint8Array;
}>;
/**
 * ML-KEM-768 (Kyber) key decapsulation
 * @param ciphertext - Encapsulated key
 * @param privateKey - Our Kyber private key
 * @returns Shared secret
 */
export declare function kemDecapsulate(ciphertext: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array>;
/**
 * ML-DSA-3 (Dilithium) signature generation
 * @param message - Message to sign
 * @param privateKey - Dilithium private key
 * @returns Signature bytes
 */
export declare function dilithiumSign(message: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array>;
/**
 * ML-DSA-3 (Dilithium) signature verification
 * @param message - Original message
 * @param signature - Signature to verify
 * @param publicKey - Dilithium public key
 * @returns true nếu valid
 */
export declare function dilithiumVerify(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): Promise<boolean>;
/**
 * Generate ML-KEM-768 key pair
 */
export declare function generateKyberKeyPair(): Promise<{
    publicKey: Uint8Array;
    privateKey: Uint8Array;
}>;
/**
 * Generate ML-DSA-3 key pair
 */
export declare function generateDilithiumKeyPair(): Promise<{
    publicKey: Uint8Array;
    privateKey: Uint8Array;
}>;
/**
 * Check PQC availability (liên kết với feature flags)
 */
export declare function isPQCAvailable(config: PQCConfig): {
    kyber: boolean;
    dilithium: boolean;
};
//# sourceMappingURL=pqc.d.ts.map