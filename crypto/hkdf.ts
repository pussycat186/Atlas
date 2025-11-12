/**
 * RFC 5869 - HMAC-based Extract-and-Expand Key Derivation Function (HKDF)
 * Triển khai chuẩn HKDF cho dẫn xuất khóa an toàn
 */

import { createHmac } from 'crypto';

/**
 * HKDF-Extract: Trích xuất khóa giả ngẫu nhiên (PRK) từ input key material
 * @param salt - Salt (nếu null thì dùng chuỗi 0 với độ dài hash)
 * @param ikm - Input Key Material
 * @param hash - Thuật toán hash (mặc định: sha256)
 * @returns Pseudo-Random Key (PRK)
 */
export function hkdfExtract(
  salt: Uint8Array | null,
  ikm: Uint8Array,
  hash: string = 'sha256'
): Uint8Array {
  const hashLen = hash === 'sha256' ? 32 : 64;
  const actualSalt = salt || new Uint8Array(hashLen);
  
  const hmac = createHmac(hash, Buffer.from(actualSalt));
  hmac.update(Buffer.from(ikm));
  return new Uint8Array(hmac.digest());
}

/**
 * HKDF-Expand: Mở rộng PRK thành khóa đầu ra với độ dài mong muốn
 * @param prk - Pseudo-Random Key từ Extract
 * @param info - Context và application specific information
 * @param length - Độ dài khóa đầu ra (bytes)
 * @param hash - Thuật toán hash (mặc định: sha256)
 * @returns Output Key Material (OKM)
 */
export function hkdfExpand(
  prk: Uint8Array,
  info: Uint8Array,
  length: number,
  hash: string = 'sha256'
): Uint8Array {
  const hashLen = hash === 'sha256' ? 32 : 64;
  const n = Math.ceil(length / hashLen);
  
  if (n > 255) {
    throw new Error('HKDF: length too large');
  }
  
  const okm = new Uint8Array(length);
  let t = new Uint8Array(0);
  let offset = 0;
  
  for (let i = 1; i <= n; i++) {
    const hmac = createHmac(hash, Buffer.from(prk));
    hmac.update(Buffer.from(t));
    hmac.update(Buffer.from(info));
    hmac.update(new Uint8Array([i]));
    t = new Uint8Array(hmac.digest());
    
    const copyLen = Math.min(t.length, length - offset);
    okm.set(t.subarray(0, copyLen), offset);
    offset += copyLen;
  }
  
  return okm;
}

/**
 * HKDF - Hàm dẫn xuất khóa đầy đủ (Extract + Expand)
 * @param salt - Salt
 * @param ikm - Input Key Material
 * @param info - Context information
 * @param length - Độ dài khóa đầu ra
 * @param hash - Thuật toán hash
 * @returns Output Key Material
 */
export function hkdf(
  salt: Uint8Array | null,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
  hash: string = 'sha256'
): Uint8Array {
  const prk = hkdfExtract(salt, ikm, hash);
  return hkdfExpand(prk, info, length, hash);
}

/**
 * Dẫn xuất nhiều khóa từ một IKM (tiện ích cho Double Ratchet)
 * @param ikm - Input Key Material
 * @param salt - Salt
 * @param count - Số lượng khóa cần dẫn xuất
 * @param keyLen - Độ dài mỗi khóa (bytes)
 * @returns Mảng các khóa đã dẫn xuất
 */
export function deriveKeys(
  ikm: Uint8Array,
  salt: Uint8Array | null,
  count: number,
  keyLen: number = 32
): Uint8Array[] {
  const keys: Uint8Array[] = [];
  
  for (let i = 0; i < count; i++) {
    const info = new Uint8Array([i]);
    const key = hkdf(salt, ikm, info, keyLen);
    keys.push(key);
  }
  
  return keys;
}
