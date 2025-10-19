import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const baseCsp = "default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
  const script = "script-src 'self' 'strict-dynamic' 'nonce-__CSP_NONCE__'";
  res.headers.set('Content-Security-Policy', `${baseCsp}; ${script}; require-trusted-types-for 'script'; trusted-types nextjs#bundler`);
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  res.headers.set('Cross-Origin-Resource-Policy', 'same-site');
  res.headers.set('Origin-Agent-Cluster', '?1');
  return res;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
