/**
 * Atlas Secure Fabric Protocol Types
 * Zero-crypto messaging and storage platform with multi-witness quorum
 */
// Default Atlas configuration
export const DEFAULT_FABRIC_CONFIG = {
    total_witnesses: 5,
    quorum_size: 4,
    max_timestamp_skew_ms: 2000,
    witnesses: [
        { witness_id: 'w1', endpoint: 'http://witness-1:3001', region: 'us-east-1', active: true },
        { witness_id: 'w2', endpoint: 'http://witness-2:3001', region: 'us-west-2', active: true },
        { witness_id: 'w3', endpoint: 'http://witness-3:3001', region: 'eu-west-1', active: true },
        { witness_id: 'w4', endpoint: 'http://witness-4:3001', region: 'ap-southeast-1', active: true },
        { witness_id: 'w5', endpoint: 'http://witness-5:3001', region: 'ap-northeast-1', active: true }
    ],
    mirror_endpoints: [
        'https://ledger-mirror-1.s3.amazonaws.com',
        'https://ipfs.io/ipfs/ledger-mirror-2'
    ],
    security_track: 'Z'
};
//# sourceMappingURL=types.js.map