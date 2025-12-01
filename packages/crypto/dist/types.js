// Atlas Security-Core Crypto Types
// Định nghĩa types dùng chung cho tất cả các module mật mã
/**
 * Error types cho crypto operations
 */
export class CryptoError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'CryptoError';
    }
}
//# sourceMappingURL=types.js.map