import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // RFC 9421 placeholder: verify HTTP message signatures (to be implemented)
  return NextResponse.json({ ok: false, reason: 'NOT_IMPLEMENTED' }, { status: 501 });
}
