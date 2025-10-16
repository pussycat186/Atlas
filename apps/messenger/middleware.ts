import { NextRequest, NextResponse } from 'next/server';
import { createSecurityMiddleware } from '../../middleware/security-headers';

/**
 * Messenger App S4 Security Middleware
 * Special configuration for real-time messaging with WebRTC support
 */

// Messenger specific security configuration for S4
const messengerSecurityConfig = {
  // Real-time messaging needs more permissive policies for WebRTC
  coopPolicy: 'same-origin-allow-popups' as const, // Allow WebRTC popups
  coepPolicy: 'credentialless' as const, // Less strict for media resources
  trustedTypes: true, // Still enforce for XSS protection
  hstsMaxAge: 31536000, // 1 year
  hstsPreload: true,
  permissionsPolicy: {
    'geolocation': ['none'],
    'camera': ['self'], // Required for video calls
    'microphone': ['self'], // Required for voice calls  
    'usb': ['none'],
    'bluetooth': ['none'],
    'payment': ['none'],
    'gyroscope': ['none'],
    'accelerometer': ['none'],
    'magnetometer': ['none'],
    'ambient-light-sensor': ['none'],
    'autoplay': ['self'], // Required for message sounds
    'encrypted-media': ['self'], // Required for secure media
    'fullscreen': ['self'], // Allow fullscreen for video calls
    'picture-in-picture': ['self'], // Allow PiP for video calls
    'display-capture': ['self'] // Allow screen sharing
  }
};

// Create S4 security middleware for messenger
const s4SecurityMiddleware = createSecurityMiddleware('messenger', messengerSecurityConfig);

/**
 * S4 Security middleware for messenger app
 * Implements transport security with WebRTC compatibility
 */
export function middleware(request: NextRequest) {
  // Apply S4 security headers with messenger-specific config
  const response = s4SecurityMiddleware(request);
  
  // Messenger-specific security headers
  response.headers.set('X-Messenger-App', 'true');
  response.headers.set('X-WebRTC-Enabled', 'true');
  response.headers.set('X-Security-Level', 'S4-MESSENGER');
  
  // WebRTC requires specific CORS headers for peer connections
  if (request.nextUrl.pathname.startsWith('/api/webrtc')) {
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, DPoP');
    response.headers.set('Access-Control-Max-Age', '86400');
  }
  
  // Real-time messaging cache headers
  if (request.nextUrl.pathname.startsWith('/api/messages')) {
    response.headers.set('Cache-Control', 'no-cache, must-revalidate');
    response.headers.set('X-Real-Time', 'true');
  }
  
  // WebSocket upgrade support
  if (request.headers.get('upgrade') === 'websocket') {
    response.headers.set('X-WebSocket-Security', 'enabled');
    // Don't apply COEP for WebSocket upgrades as it can interfere
    response.headers.delete('Cross-Origin-Embedder-Policy');
  }
  
  // Log S4 security status in development
  if (process.env.NODE_ENV === 'development') {
    const nonce = response.headers.get('X-Request-Nonce');
    console.log(`🛡️  S4 Messenger Security Applied:`, {
      app: 'messenger',
      webrtc: request.nextUrl.pathname.startsWith('/api/webrtc'),
      websocket: request.headers.get('upgrade') === 'websocket',
      nonce: nonce ? `${nonce.substring(0, 8)}...` : 'none',
      coop: response.headers.get('Cross-Origin-Opener-Policy'),
      coep: response.headers.get('Cross-Origin-Embedder-Policy'),
      permissions: response.headers.get('Permissions-Policy') ? 'enabled' : 'disabled'
    });
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Include API routes for WebRTC and messaging
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};