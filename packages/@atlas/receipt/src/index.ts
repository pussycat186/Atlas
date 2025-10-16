import * as jose from 'jose';
import { createHash, createHmac } from 'crypto';
import { z } from 'zod';

// RFC 9421 compliant receipt schema
export const ReceiptSchema = z.object({
  id: z.string().uuid(),
  subject: z.string(),
  actor: z.string(),
  action: z.string(),
  at: z.number(),
  ctx: z.record(z.any()).optional(),
  digest: z.string(),
  alg: z.enum(['Ed25519', 'ES256', 'RS256', 'HS256']),
  kid: z.string(),
  sig: z.string()
});

export type Receipt = z.infer<typeof ReceiptSchema>;

// HTTP Message Signature components
export interface SignatureComponents {
  '@method'?: string;
  '@target-uri'?: string;
  '@authority'?: string;
  '@scheme'?: string;
  '@request-target'?: string;
  '@path'?: string;
  '@query'?: string;
  '@status'?: number;
  'content-digest'?: string;
  'content-type'?: string;
  'content-length'?: number;
  date?: string;
  host?: string;
  [header: string]: any;
}

export interface SignatureParams {
  keyid: string;
  algorithm: 'ed25519' | 'ecdsa-p256-sha256' | 'rsa-pss-sha256' | 'hmac-sha256';
  created?: number;
  expires?: number;
  nonce?: string;
  tag?: string;
}

// Atlas-specific receipt content
export interface AtlasReceiptContent {
  messageId?: string;
  conversationId?: string;
  participants?: string[];
  mlsEpoch?: number;
  deliveryStatus?: 'sent' | 'delivered' | 'read';
  timestamp: number;
  hash: string;
}

export class RFC9421Signer {
  private privateKey: jose.KeyLike;
  private keyId: string;
  private algorithm: string;
  
  constructor(privateKey: jose.KeyLike, keyId: string, algorithm: string = 'Ed25519') {
    this.privateKey = privateKey;
    this.keyId = keyId;
    this.algorithm = algorithm;
  }
  
  // Create HTTP Message Signature per RFC 9421
  async createSignature(
    components: SignatureComponents,
    params?: Partial<SignatureParams>
  ): Promise<string> {
    const signatureParams: SignatureParams = {
      keyid: this.keyId,
      algorithm: this.algorithm.toLowerCase() as any,
      created: Math.floor(Date.now() / 1000),
      ...params
    };
    
    // Build signature base string
    const signatureBase = this.buildSignatureBase(components, signatureParams);
    
    // Sign the base string
    const signature = await this.signData(signatureBase);
    
    // Return signature header value
    return this.formatSignatureHeader(signatureParams, signature);
  }
  
  // Create Atlas receipt with RFC 9421 signature
  async createReceipt(
    subject: string,
    actor: string, 
    action: string,
    content: AtlasReceiptContent,
    context?: Record<string, any>
  ): Promise<Receipt> {
    const receiptId = crypto.randomUUID();
    const timestamp = Date.now();
    
    // Create content digest
    const contentString = JSON.stringify(content, null, 0);
    const digest = createHash('sha256').update(contentString).digest('base64');
    
    // Prepare signature components for receipt
    const components: SignatureComponents = {
      '@method': 'POST',
      '@target-uri': `https://receipts.atlas.chat/verify/${receiptId}`,
      'content-digest': `sha-256=:${digest}:`,
      'content-type': 'application/json',
      date: new Date(timestamp).toUTCString()
    };
    
    // Generate signature
    const signature = await this.createSignature(components, {
      keyid: this.keyId,
      created: Math.floor(timestamp / 1000)
    });
    
    return {
      id: receiptId,
      subject,
      actor,
      action,
      at: timestamp,
      ctx: context,
      digest,
      alg: this.algorithm as any,
      kid: this.keyId,
      sig: signature
    };
  }
  
  private buildSignatureBase(
    components: SignatureComponents,
    params: SignatureParams
  ): string {
    const lines: string[] = [];
    
    // Add covered components in order
    const coveredComponents = Object.keys(components).sort();
    
    for (const component of coveredComponents) {
      const value = components[component];
      
      if (component.startsWith('@')) {
        // Derived component
        lines.push(`"${component}": ${JSON.stringify(value)}`);
      } else {
        // HTTP header
        lines.push(`"${component.toLowerCase()}": ${JSON.stringify(value)}`);
      }
    }
    
    // Add signature parameters
    const paramString = Object.entries(params)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(';');
    
    lines.push(`"@signature-params": (${coveredComponents.map(c => `"${c}"`).join(' ')});${paramString}`);
    
    return lines.join('\n');
  }
  
  private async signData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    
    // Sign with specified algorithm
    switch (this.algorithm.toLowerCase()) {
      case 'ed25519':
        const signature = await jose.flattenedSign(
          dataBytes,
          this.privateKey,
          { alg: 'EdDSA' }
        );
        return signature.signature;
        
      case 'es256':
        const es256Sig = await jose.flattenedSign(
          dataBytes,
          this.privateKey,
          { alg: 'ES256' }
        );
        return es256Sig.signature;
        
      case 'rs256':
        const rs256Sig = await jose.flattenedSign(
          dataBytes,
          this.privateKey,
          { alg: 'RS256' }
        );
        return rs256Sig.signature;
        
      default:
        throw new Error(`Unsupported algorithm: ${this.algorithm}`);
    }
  }
  
  private formatSignatureHeader(params: SignatureParams, signature: string): string {
    const paramString = Object.entries(params)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(';');
    
    return `sig1=:${signature}:;${paramString}`;
  }
}

export class RFC9421Verifier {
  private publicKeys: Map<string, jose.KeyLike> = new Map();
  
  // Add public key for verification
  addPublicKey(keyId: string, publicKey: jose.KeyLike): void {
    this.publicKeys.set(keyId, publicKey);
  }
  
  // Verify RFC 9421 signature
  async verifySignature(
    components: SignatureComponents,
    signatureHeader: string
  ): Promise<boolean> {
    try {
      // Parse signature header
      const { params, signature } = this.parseSignatureHeader(signatureHeader);
      
      // Get public key
      const publicKey = this.publicKeys.get(params.keyid);
      if (!publicKey) {
        throw new Error(`Public key not found for keyid: ${params.keyid}`);
      }
      
      // Rebuild signature base
      const signatureBase = this.buildSignatureBase(components, params);
      
      // Verify signature
      return await this.verifySignatureData(signatureBase, signature, params.algorithm, publicKey);
      
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }
  
  // Verify Atlas receipt
  async verifyReceipt(receipt: Receipt): Promise<boolean> {
    try {
      // Validate receipt schema
      ReceiptSchema.parse(receipt);
      
      // Get public key
      const publicKey = this.publicKeys.get(receipt.kid);
      if (!publicKey) {
        return false;
      }
      
      // Reconstruct signature components from receipt
      const components: SignatureComponents = {
        '@method': 'POST',
        '@target-uri': `https://receipts.atlas.chat/verify/${receipt.id}`,
        'content-digest': `sha-256=:${receipt.digest}:`,
        'content-type': 'application/json',
        date: new Date(receipt.at).toUTCString()
      };
      
      // Verify signature
      return await this.verifySignature(components, receipt.sig);
      
    } catch (error) {
      console.error('Receipt verification failed:', error);
      return false;
    }
  }
  
  private parseSignatureHeader(header: string): { params: SignatureParams; signature: string } {
    // Parse signature header format: sig1=:signature:;keyid="key1";created=1234567890
    const match = header.match(/^(\w+)=:([^:]+):;(.+)$/);
    if (!match) {
      throw new Error('Invalid signature header format');
    }
    
    const [, sigName, signature, paramString] = match;
    
    // Parse parameters
    const params: any = {};
    const paramPairs = paramString.split(';');
    
    for (const pair of paramPairs) {
      const [key, value] = pair.split('=', 2);
      if (value.startsWith('"') && value.endsWith('"')) {
        params[key] = value.slice(1, -1);
      } else {
        params[key] = parseInt(value) || value;
      }
    }
    
    return { params: params as SignatureParams, signature };
  }
  
  private buildSignatureBase(components: SignatureComponents, params: SignatureParams): string {
    // Same implementation as RFC9421Signer
    const lines: string[] = [];
    
    const coveredComponents = Object.keys(components).sort();
    
    for (const component of coveredComponents) {
      const value = components[component];
      
      if (component.startsWith('@')) {
        lines.push(`"${component}": ${JSON.stringify(value)}`);
      } else {
        lines.push(`"${component.toLowerCase()}": ${JSON.stringify(value)}`);
      }
    }
    
    const paramString = Object.entries(params)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(';');
    
    lines.push(`"@signature-params": (${coveredComponents.map(c => `"${c}"`).join(' ')});${paramString}`);
    
    return lines.join('\n');
  }
  
  private async verifySignatureData(
    data: string, 
    signature: string, 
    algorithm: string, 
    publicKey: jose.KeyLike
  ): Promise<boolean> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    
    try {
      switch (algorithm.toLowerCase()) {
        case 'ed25519':
          const result = await jose.flattenedVerify(
            { signature, protected: '', payload: '' },
            publicKey,
            { algorithms: ['EdDSA'] }
          );
          return true;
          
        case 'ecdsa-p256-sha256':
          await jose.flattenedVerify(
            { signature, protected: '', payload: '' },
            publicKey,
            { algorithms: ['ES256'] }
          );
          return true;
          
        case 'rsa-pss-sha256':
          await jose.flattenedVerify(
            { signature, protected: '', payload: '' },
            publicKey,
            { algorithms: ['RS256'] }
          );
          return true;
          
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }
}

// Key management utilities
export class AtlasKeyManager {
  // Generate Ed25519 key pair for receipts
  static async generateEd25519KeyPair(): Promise<{ privateKey: jose.KeyLike; publicKey: jose.KeyLike }> {
    const keyPair = await jose.generateKeyPair('EdDSA', { crv: 'Ed25519' });
    return keyPair;
  }
  
  // Generate ECDSA P-256 key pair
  static async generateECDSAKeyPair(): Promise<{ privateKey: jose.KeyLike; publicKey: jose.KeyLike }> {
    const keyPair = await jose.generateKeyPair('ES256');
    return keyPair;
  }
  
  // Export public key to JWK format
  static async exportPublicKeyJWK(publicKey: jose.KeyLike, keyId: string): Promise<jose.JWK> {
    const jwk = await jose.exportJWK(publicKey);
    jwk.kid = keyId;
    jwk.use = 'sig';
    jwk.alg = jwk.kty === 'OKP' ? 'EdDSA' : 'ES256';
    return jwk;
  }
  
  // Import public key from JWK
  static async importPublicKeyJWK(jwk: jose.JWK): Promise<jose.KeyLike> {
    return await jose.importJWK(jwk);
  }
}