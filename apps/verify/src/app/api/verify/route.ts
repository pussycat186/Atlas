import { NextRequest, NextResponse } from 'next/server';
import { RFC9421Verifier, AtlasKeyManager, type Receipt } from '@atlas/receipt';

export async function POST(request: NextRequest) {
  try {
    const { receipt } = await request.json();
    
    if (!receipt) {
      return NextResponse.json({ 
        valid: false, 
        error: 'No receipt provided' 
      }, { status: 400 });
    }

    // Fetch JWKS from the Atlas JWKS service
    const jwksResponse = await fetch(
      process.env.JWKS_URL || 'http://localhost:3012/.well-known/jwks.json',
      { 
        cache: 'force-cache',
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!jwksResponse.ok) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Unable to fetch verification keys' 
      }, { status: 503 });
    }

    const jwks = await jwksResponse.json();
    
    // Create verifier and add public keys
    const verifier = new RFC9421Verifier();
    
    for (const jwk of jwks.keys) {
      const publicKey = await AtlasKeyManager.importPublicKeyJWK(jwk);
      verifier.addPublicKey(jwk.kid, publicKey);
    }

    // Verify the receipt
    const isValid = await verifier.verifyReceipt(receipt as Receipt);

    return NextResponse.json({ 
      valid: isValid,
      verifiedAt: Date.now(),
      keyId: receipt.kid,
      algorithm: receipt.alg
    });

  } catch (error) {
    console.error('Receipt verification error:', error);
    
    return NextResponse.json({ 
      valid: false, 
      error: 'Verification failed: ' + (error as Error).message 
    }, { status: 500 });
  }
}