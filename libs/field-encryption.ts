/**
 * Field-Level Database Encryption for Atlas Applications
 * Provides application-layer encryption for PII and sensitive data
 * 
 * Features:
 * - Deterministic encryption for indexed fields (searchable)
 * - Randomized encryption for non-indexed fields (maximum security)
 * - Key rotation with backward compatibility
 * - Performance optimized with caching
 */

import { webcrypto } from 'crypto';
import { AtlasPQC } from './pqc-hybrid';

const crypto = webcrypto;

interface FieldEncryptionKey {
  keyId: string;
  key: CryptoKey;
  algorithm: string;
  created: Date;
  version: number;
}

interface EncryptedField {
  value: string;
  keyId: string;
  algorithm: string;
  isDeterministic: boolean;
  version: number;
}

interface FieldConfig {
  fieldName: string;
  isDeterministic: boolean;  // true for searchable fields (email, phone)
  isRequired: boolean;
  keyRotationDays: number;
}

export class FieldEncryption {
  private keys: Map<string, FieldEncryptionKey> = new Map();
  private fieldConfigs: Map<string, FieldConfig> = new Map();
  private readonly CURRENT_VERSION = 1;

  constructor() {
    this.initializeFieldConfigs();
  }

  /**
   * Initialize field encryption configurations
   */
  private initializeFieldConfigs(): void {
    // Define which fields need encryption and their properties
    const configs: FieldConfig[] = [
      {
        fieldName: 'email',
        isDeterministic: true,  // Searchable
        isRequired: true,
        keyRotationDays: 90
      },
      {
        fieldName: 'phoneNumber',
        isDeterministic: true,  // Searchable
        isRequired: false,
        keyRotationDays: 90
      },
      {
        fieldName: 'ssn',
        isDeterministic: false, // Maximum security
        isRequired: false,
        keyRotationDays: 30
      },
      {
        fieldName: 'creditCard',
        isDeterministic: false, // Maximum security
        isRequired: false,
        keyRotationDays: 30
      },
      {
        fieldName: 'address',
        isDeterministic: false, // Not searchable
        isRequired: false,
        keyRotationDays: 90
      },
      {
        fieldName: 'notes',
        isDeterministic: false, // Free text
        isRequired: false,
        keyRotationDays: 180
      }
    ];

    configs.forEach(config => {
      this.fieldConfigs.set(config.fieldName, config);
    });

    console.log(`🔐 Configured field encryption for ${configs.length} field types`);
  }

  /**
   * Encrypt a field value based on its configuration
   */
  async encryptField(fieldName: string, value: string, userId?: string): Promise<EncryptedField> {
    if (!value || value.trim() === '') {
      throw new Error('Cannot encrypt empty field value');
    }

    const config = this.fieldConfigs.get(fieldName);
    if (!config) {
      throw new Error(`No encryption configuration found for field: ${fieldName}`);
    }

    try {
      const key = await this.getOrCreateKey(fieldName);
      
      let encryptedValue: string;
      
      if (config.isDeterministic) {
        // Deterministic encryption for searchable fields
        encryptedValue = await this.encryptDeterministic(value, key.key, userId);
      } else {
        // Randomized encryption for maximum security
        encryptedValue = await this.encryptRandomized(value, key.key);
      }

      console.log(`🔒 Encrypted field ${fieldName} (deterministic: ${config.isDeterministic})`);

      return {
        value: encryptedValue,
        keyId: key.keyId,
        algorithm: key.algorithm,
        isDeterministic: config.isDeterministic,
        version: this.CURRENT_VERSION
      };
    } catch (error) {
      console.error(`❌ Failed to encrypt field ${fieldName}:`, error);
      throw new Error(`Field encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt a field value
   */
  async decryptField(encryptedField: EncryptedField): Promise<string> {
    try {
      const key = this.keys.get(encryptedField.keyId);
      if (!key) {
        throw new Error(`Encryption key not found: ${encryptedField.keyId}`);
      }

      let decryptedValue: string;

      if (encryptedField.isDeterministic) {
        decryptedValue = await this.decryptDeterministic(encryptedField.value, key.key);
      } else {
        decryptedValue = await this.decryptRandomized(encryptedField.value, key.key);
      }

      console.log(`🔓 Decrypted field (key: ${encryptedField.keyId.substring(0, 8)}...)`);
      return decryptedValue;
    } catch (error) {
      console.error(`❌ Failed to decrypt field:`, error);
      throw new Error(`Field decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt multiple fields in a record
   */
  async encryptRecord(record: Record<string, any>, userId?: string): Promise<Record<string, any>> {
    const encryptedRecord = { ...record };

    for (const [fieldName, value] of Object.entries(record)) {
      const config = this.fieldConfigs.get(fieldName);
      if (config && value != null && value !== '') {
        try {
          encryptedRecord[fieldName] = await this.encryptField(fieldName, String(value), userId);
        } catch (error) {
          console.error(`Failed to encrypt field ${fieldName}:`, error);
          // Decision: fail fast or continue with unencrypted value
          throw error; // Fail fast for security
        }
      }
    }

    return encryptedRecord;
  }

  /**
   * Decrypt multiple fields in a record
   */
  async decryptRecord(encryptedRecord: Record<string, any>): Promise<Record<string, any>> {
    const decryptedRecord = { ...encryptedRecord };

    for (const [fieldName, value] of Object.entries(encryptedRecord)) {
      if (value && typeof value === 'object' && value.keyId && value.value) {
        // This looks like an encrypted field
        try {
          decryptedRecord[fieldName] = await this.decryptField(value as EncryptedField);
        } catch (error) {
          console.error(`Failed to decrypt field ${fieldName}:`, error);
          // Keep encrypted value if decryption fails
          decryptedRecord[fieldName] = '[DECRYPT_FAILED]';
        }
      }
    }

    return decryptedRecord;
  }

  /**
   * Generate search token for deterministic fields
   */
  async generateSearchToken(fieldName: string, searchValue: string, userId?: string): Promise<string> {
    const config = this.fieldConfigs.get(fieldName);
    if (!config || !config.isDeterministic) {
      throw new Error(`Field ${fieldName} is not configured for deterministic encryption`);
    }

    const key = await this.getOrCreateKey(fieldName);
    return await this.encryptDeterministic(searchValue, key.key, userId);
  }

  /**
   * Deterministic encryption (same input always produces same output)
   * Used for searchable fields like email, phone number
   */
  private async encryptDeterministic(
    value: string, 
    key: CryptoKey, 
    userId?: string
  ): Promise<string> {
    // Create deterministic IV based on value and optional user context
    const context = userId ? `${value}:${userId}` : value;
    const contextHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(context));
    const iv = new Uint8Array(contextHash.slice(0, 12)); // AES-GCM needs 12-byte IV

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(value)
    );

    // Prepend IV for storage (even though it's deterministic, we need it for decryption)
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Randomized encryption (different output each time)
   * Used for non-searchable sensitive fields
   */
  private async encryptRandomized(value: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(value)
    );

    // Prepend IV for storage
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypt deterministic encryption
   */
  private async decryptDeterministic(encryptedValue: string, key: CryptoKey): Promise<string> {
    return this.decryptWithKey(encryptedValue, key);
  }

  /**
   * Decrypt randomized encryption
   */
  private async decryptRandomized(encryptedValue: string, key: CryptoKey): Promise<string> {
    return this.decryptWithKey(encryptedValue, key);
  }

  /**
   * Common decryption logic
   */
  private async decryptWithKey(encryptedValue: string, key: CryptoKey): Promise<string> {
    const combined = new Uint8Array(
      atob(encryptedValue).split('').map(c => c.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Get or create encryption key for a field
   */
  private async getOrCreateKey(fieldName: string): Promise<FieldEncryptionKey> {
    // In production, this should integrate with KMS/HSM
    // For now, generate keys on demand and cache them
    
    const existingKey = Array.from(this.keys.values()).find(k => 
      k.keyId.startsWith(`${fieldName}-`)
    );

    if (existingKey) {
      return existingKey;
    }

    // Generate new key
    const keyId = `${fieldName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // not extractable for security
      ['encrypt', 'decrypt']
    );

    const fieldKey: FieldEncryptionKey = {
      keyId,
      key,
      algorithm: 'AES-256-GCM',
      created: new Date(),
      version: this.CURRENT_VERSION
    };

    this.keys.set(keyId, fieldKey);
    console.log(`🔑 Generated new field encryption key: ${keyId}`);

    return fieldKey;
  }

  /**
   * Rotate encryption keys (should be called by scheduled job)
   */
  async rotateKeys(): Promise<void> {
    console.log('🔄 Starting key rotation process...');
    
    const now = new Date();
    let rotatedCount = 0;

    for (const [fieldName, config] of this.fieldConfigs.entries()) {
      const existingKey = Array.from(this.keys.values()).find(k => 
        k.keyId.startsWith(`${fieldName}-`)
      );

      if (existingKey) {
        const daysSinceCreation = Math.floor(
          (now.getTime() - existingKey.created.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceCreation >= config.keyRotationDays) {
          // Generate new key (old key remains available for decryption)
          await this.getOrCreateKey(`${fieldName}-rotated`);
          rotatedCount++;
          console.log(`🔄 Rotated key for field: ${fieldName}`);
        }
      }
    }

    console.log(`✅ Key rotation completed. Rotated ${rotatedCount} keys.`);
  }
}

// Export singleton for Atlas applications
export const atlasFieldEncryption = new FieldEncryption();