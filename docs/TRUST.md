# Atlas Trust & Security Documentation

## Production URLs

- **Proof Messenger**: https://atlas-proof-messenger.vercel.app
- **Admin Insights**: https://atlas-admin-insights.vercel.app  
- **Dev Portal**: https://atlas-dev-portal.vercel.app

### Prism UI Endpoints
- Proof `/prism`: https://atlas-proof-messenger.vercel.app/prism
- Insights `/prism`: https://atlas-admin-insights.vercel.app/prism
- Dev `/prism`: https://atlas-dev-portal.vercel.app/prism

## Security Headers Policy

### Content Security Policy (CSP)
All applications enforce strict CSP with nonce-based script execution:
```
default-src 'self'; 
script-src 'self' 'nonce-atlas-script'; 
style-src 'self' 'unsafe-inline'; 
img-src 'self' data: https:; 
font-src 'self' https://fonts.gstatic.com; 
connect-src 'self' https://atlas-*.vercel.app https://*.workers.dev; 
frame-ancestors 'none';
```

### Cross-Origin Policies
- **COOP**: `same-origin` - Prevents cross-origin window access
- **COEP**: `require-corp` - Requires explicit cross-origin resource sharing

### Additional Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

## Caching & ISR Strategy

### API Endpoints (/qtca/*)
- **Cache-Control**: `public, s-maxage=60, stale-while-revalidate=30`
- **CDN-Cache-Control**: `public, s-maxage=120, stale-while-revalidate=60`
- **Vercel-CDN-Cache-Control**: `public, s-maxage=600, stale-while-revalidate=60`

### Static Pages (/prism)
- **ISR Revalidation**: 600 seconds (10 minutes)
- **Cache-Control**: `public, max-age=0, must-revalidate`

## Supply Chain Security

### Software Bill of Materials (SBOM)
- **Location**: `docs/evidence/20251003-0754/sbom/`
- **Format**: npm ls JSON output for each application
- **Coverage**: All production dependencies and transitive dependencies

### SLSA Build Provenance
- **Location**: `docs/evidence/20251003-0754/slsa/`
- **Workflow**: `.github/workflows/slsa-provenance.yml`
- **Attestation**: GitHub Actions build provenance for all artifacts

## Service Level Objectives (SLO)

### Performance Targets
- **p95 Response Time**: < 200ms
- **Error Rate**: < 1%
- **Availability**: 99.9% uptime

### Monitoring
- **Lighthouse CI**: Nightly performance audits
- **k6 Load Testing**: 60 VUs for 60 seconds daily
- **Real User Monitoring**: Vercel Analytics

## Rollback Plan

### Immediate Response (< 5 minutes)
1. Revert to previous Vercel deployment via dashboard
2. Activate Cloudflare Worker proxy if needed
3. Update DNS if complete service failure

### Investigation Phase (< 30 minutes)
1. Check Vercel deployment logs
2. Review performance metrics
3. Validate security headers
4. Test critical user journeys

### Recovery Validation
1. Confirm all /prism endpoints return 200
2. Verify prism marker present: `ATLAS • Prism UI — Peak Preview`
3. Validate cache headers on /qtca/* endpoints
4. Run smoke test suite

## Evidence & Audit Trail

### Current Evidence Location
- **Base Path**: `docs/evidence/20251003-0754/`
- **SBOM**: `sbom/` - Software bill of materials
- **SLSA**: `slsa/` - Build provenance attestations  
- **Headers**: `headers/` - Security header verification
- **Lighthouse**: `lighthouse/` - Performance audit reports
- **k6**: `k6/` - Load testing results

### Compliance
- **SLSA Level 2**: Build provenance with GitHub Actions
- **NIST Cybersecurity Framework**: Identify, Protect, Detect, Respond, Recover
- **OWASP Top 10**: Mitigated via CSP, secure headers, and dependency scanning

## Contact & Escalation

For security incidents or trust-related concerns:
- **Primary**: Atlas Security Team
- **Escalation**: Engineering Leadership
- **External**: security@atlas.dev (if established)

---

*Last Updated: 2025-10-03 07:54 UTC*
*Evidence Timestamp: 20251003-0754*