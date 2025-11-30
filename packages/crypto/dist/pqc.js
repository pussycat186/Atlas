// Atlas Security-Core: Post-Quantum Cryptography (PQC) Support
// ML-KEM-768 (Kyber) và ML-DSA-3 (Dilithium) với feature flags
// 
// ⚠️ PLACEHOLDER: NIST đang finalize standards, chưa có Web Crypto API support
// Production sẽ cần WASM library (e.g., pqc-wasm, liboqs-js)
/**
 * PQC configuration mặc định (disabled vì chưa stable)
 */
export const DEFAULT_PQC_CONFIG = {
    enableKyber: false,
    enableDilithium: false
};
/**
 * ML-KEM-768 (Kyber) key encapsulation
 * @param publicKey - Recipient's Kyber public key
 * @returns Encapsulated key + shared secret
 */
export async function kemEncapsulate(publicKey) {
    // TODO: Implement với pqc-wasm hoặc liboqs-js
    // const kyber = await loadKyber768();
    // return kyber.encapsulate(publicKey);
    throw new Error('ML-KEM-768 not yet implemented - feature flag disabled');
}
/**
 * ML-KEM-768 (Kyber) key decapsulation
 * @param ciphertext - Encapsulated key
 * @param privateKey - Our Kyber private key
 * @returns Shared secret
 */
export async function kemDecapsulate(ciphertext, privateKey) {
    // TODO: Implement với pqc-wasm
    throw new Error('ML-KEM-768 not yet implemented - feature flag disabled');
}
/**
 * ML-DSA-3 (Dilithium) signature generation
 * @param message - Message to sign
 * @param privateKey - Dilithium private key
 * @returns Signature bytes
 */
export async function dilithiumSign(message, privateKey) {
    // TODO: Implement với pqc-wasm
    throw new Error('ML-DSA-3 not yet implemented - feature flag disabled');
}
/**
 * ML-DSA-3 (Dilithium) signature verification
 * @param message - Original message
 * @param signature - Signature to verify
 * @param publicKey - Dilithium public key
 * @returns true nếu valid
 */
export async function dilithiumVerify(message, signature, publicKey) {
    // TODO: Implement với pqc-wasm
    throw new Error('ML-DSA-3 not yet implemented - feature flag disabled');
}
/**
 * Generate ML-KEM-768 key pair
 */
export async function generateKyberKeyPair() {
    // TODO: Implement
    throw new Error('ML-KEM-768 not yet implemented - feature flag disabled');
}
/**
 * Generate ML-DSA-3 key pair
 */
export async function generateDilithiumKeyPair() {
    // TODO: Implement
    throw new Error('ML-DSA-3 not yet implemented - feature flag disabled');
}
/**
 * Check PQC availability (liên kết với feature flags)
 */
export function isPQCAvailable(config) {
    return {
        kyber: config.enableKyber && false, // false vì chưa implement
        dilithium: config.enableDilithium && false
    };
}
//# sourceMappingURL=pqc.js.map