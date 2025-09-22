# ATLAS Basic SKU - Prism UI

## Overview
ATLAS Basic provides essential quantum messaging capabilities with a clean, accessible interface built on the Prism UI framework.

## Features

### Messenger
- **Quantum Messaging**: Send and receive messages with quantum-tag verification
- **Real-time Status**: Message status indicators (sending, sent, verified)
- **Production API Integration**: Connects to live Atlas Gateway endpoints
- **Accessibility**: WCAG 2.2 AA compliant with keyboard navigation

### Admin Dashboard
- **Live Metrics**: Real-time RPS, p95 latency, error rates, and quorum status
- **Health Monitoring**: Gateway health checks with degraded mode fallback
- **Basic Analytics**: Essential performance indicators

### Dev Portal
- **API Documentation**: Complete endpoint reference with live examples
- **Code Samples**: JavaScript and cURL examples with production URLs
- **Copy-to-Clipboard**: One-click code copying functionality

## Technical Specifications

### Performance Thresholds
- **Lighthouse Performance**: ≥90
- **Accessibility**: ≥95
- **Best Practices**: ≥95
- **SEO**: ≥95
- **Bundle Size**: ≤300KB gzipped per route

### API Endpoints
- `POST /record` - Send messages with idempotency
- `GET /record/:id` - Retrieve message by ID
- `GET /health` - Gateway health status
- `GET /metrics` - Performance metrics

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Getting Started

1. **Send a Message**:
   ```javascript
   const response = await fetch('https://atlas-gateway.sonthenguyen186.workers.dev/record', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Idempotency-Key': crypto.randomUUID()
     },
     body: JSON.stringify({
       content: 'Hello Atlas',
       metadata: { timestamp: new Date().toISOString() }
     })
   });
   ```

2. **Verify a Message**:
   ```javascript
   const response = await fetch(`https://atlas-gateway.sonthenguyen186.workers.dev/record/${messageId}`);
   ```

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Reader Support**: Proper ARIA labels and roles
- **High Contrast**: Supports system high contrast mode
- **Reduced Motion**: Respects `prefers-reduced-motion` setting
- **Focus Management**: Clear focus indicators and logical tab order

## Theme Support

### Light Theme
- Background: `#f7f7fb` (luxury off-white)
- Surface: `#ffffffcc` (semi-transparent white)
- Border: `#e5e7eb` (subtle gray)

### Dark Theme
- Background: `#0a0a0a` (deep black)
- Surface: `#1a1a1a` (charcoal)
- Accent: Neon cyan and violet highlights

## Production URLs

- **Proof Messenger**: https://atlas-proof-messenger.vercel.app
- **Admin Insights**: https://atlas-admin-insights.vercel.app
- **Dev Portal**: https://atlas-dev-portal.vercel.app
- **Gateway API**: https://atlas-gateway.sonthenguyen186.workers.dev

## Support

For technical support or feature requests, please refer to the Dev Portal documentation or contact the Atlas team.
