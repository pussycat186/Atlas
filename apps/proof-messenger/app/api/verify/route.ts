// Verify API Route - POST {receipt} → {valid, kid, epoch, ts}
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receipt } = body;

    if (!receipt || typeof receipt !== 'object') {
      return NextResponse.json(
        { valid: false, error: 'Invalid receipt format' },
        { status: 400 }
      );
    }

    // Stub verification logic - real verifier would verify signature
    // For now, return valid=true if signature field exists
    const isValid = Boolean(receipt.signature);

    if (isValid) {
      return NextResponse.json({
        valid: true,
        kid: receipt.metadata?.kid || 'unknown',
        algorithm: receipt.metadata?.algorithm || 'ecdsa-p256-sha256',
        epoch: receipt.metadata?.created || Math.floor(Date.now() / 1000),
        ts: receipt.metadata?.created || Math.floor(Date.now() / 1000),
      });
    } else {
      return NextResponse.json({
        valid: false,
        error: 'No signature found in receipt',
      });
    }
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
