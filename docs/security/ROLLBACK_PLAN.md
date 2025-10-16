# Atlas Security Rollback Plan

**Generated:** 2025-10-16 UTC  
**Purpose:** Comprehensive rollback procedures for security hardening

## Emergency Contact Information

| Role | Contact | Responsibility |
|------|---------|----------------|
| **Security Lead** | security-lead@atlas.com | Overall security rollback decisions |
| **Platform Lead** | platform-lead@atlas.com | Infrastructure rollback execution |
| **Product Lead** | product-lead@atlas.com | Customer impact assessment |
| **On-call Engineer** | +1-555-ATLAS-1 | 24/7 incident response |

## Rollback Trigger Conditions

### Automatic Rollback Triggers
- **Error Rate**: >5% increase in 5xx responses for >5 minutes
- **Response Time**: P95 latency >2x baseline for >10 minutes  
- **User Impact**: >10% drop in successful user actions for >5 minutes
- **Security Gate Failure**: Critical security validation fails in production

### Manual Rollback Triggers  
- **Customer Complaints**: Multiple customers report access issues
- **Integration Breakage**: Key third-party services failing
- **Browser Incompatibility**: Major browser versions showing issues
- **Performance Degradation**: Unacceptable performance impact observed

---

## ROLLBACK PROCEDURES BY CONTROL

### 1. Browser Policy Rollback (CSP/COOP/COEP/HSTS)

#### Level 1: Feature Flag Rollback (< 2 minutes)
```bash
# Via GitHub Actions dispatch
gh workflow run security-rollback.yml -f control=browser-policy -f action=disable

# Via Vercel environment variables (if deployed)
vercel env add SECURITY_CSP_STRICT OFF production
vercel env add SECURITY_COOP_COEP OFF production  
vercel env add SECURITY_HSTS_PRELOAD OFF production

# Restart applications
vercel redeploy --prod
```

#### Level 2: Configuration Rollback (< 5 minutes)
```javascript
// next.config.js emergency patch
module.exports = {
  // ... other config
  async headers() {
    if (process.env.SECURITY_ROLLBACK === 'true') {
      return []; // Remove all security headers
    }
    
    return [
      {
        source: '/(.*)',
        headers: [
          // Rollback to minimal headers only
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN' // Less strict than DENY
          }
        ]
      }
    ];
  }
};
```

#### Level 3: Code Rollback (< 15 minutes)
```bash
# Revert security middleware commits
git revert --no-edit $(git log --oneline --grep="security: add CSP middleware" --format="%H")
git push origin main

# Trigger immediate redeploy
gh workflow run deploy-atlas-frontends.yml
```

---

### 2. Authentication Rollback (DPoP/mTLS)

#### Level 1: Dual-Accept Mode (< 1 minute)
```bash
# Environment variable toggle
export SECURITY_DPOP_ENFORCE=optional    # Accept with or without DPoP
export SECURITY_MTLS_INTERNAL=optional   # Accept with or without client certs

# Kubernetes live update
kubectl patch configmap atlas-config -p '{"data":{"SECURITY_DPOP_ENFORCE":"optional"}}'
kubectl rollout restart deployment/atlas-gateway
```

#### Level 2: Bypass Authentication (< 5 minutes)
```yaml
# API Gateway configuration rollback
apiVersion: v1
kind: ConfigMap
metadata:
  name: atlas-auth-config
data:
  auth_mode: "legacy"           # Disable DPoP requirement
  mtls_required: "false"        # Disable mTLS requirement
  bypass_mode: "true"           # Emergency bypass
  bypass_reason: "security_rollback_$(date +%s)"
```

#### Level 3: Legacy Authentication (< 15 minutes)
```javascript
// Gateway middleware rollback
function authMiddleware(req, res, next) {
  // Emergency: skip DPoP validation
  if (process.env.SECURITY_ROLLBACK === 'true') {
    return next();
  }
  
  // Legacy OAuth 2.0 Bearer token validation
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Validate token without DPoP binding
    return validateLegacyToken(authHeader.substring(7))
      .then(user => {
        req.user = user;
        next();
      })
      .catch(next);
  }
  
  return res.status(401).json({ error: 'Authentication required' });
}
```

---

### 3. Cryptography Rollback (PQC/Hybrid)

#### Level 1: Algorithm Selection (< 5 minutes)
```bash
# Force classical algorithms only
export SECURITY_PQC_HYBRID_ENCRYPT=OFF
export CRYPTO_ALGORITHM_PREFERENCE=classical

# Update KMS configuration
aws kms update-key-description \
  --key-id alias/atlas-dek \
  --description "ROLLBACK: Classical algorithms only"
```

#### Level 2: Dual-Mode Decryption (< 10 minutes)
```javascript
// Crypto service rollback logic
async function decryptData(encryptedData, options = {}) {
  try {
    // Try hybrid decryption first
    if (encryptedData.algorithm === 'hybrid_v1' && !options.forceClassical) {
      return await hybridDecrypt(encryptedData);
    }
  } catch (hybridError) {
    console.warn('Hybrid decryption failed, falling back to classical:', hybridError);
  }
  
  // Fallback to classical decryption
  return await classicalDecrypt(encryptedData);
}

// Migration utility for emergency algorithm downgrade
async function downgradeCryptoAlgorithm(dataId) {
  const data = await getEncryptedData(dataId);
  if (data.algorithm === 'hybrid_v1') {
    const plaintext = await decryptData(data);
    const classicalCiphertext = await classicalEncrypt(plaintext);
    await updateEncryptedData(dataId, classicalCiphertext);
  }
}
```

#### Level 3: Database Crypto Rollback (< 30 minutes)
```sql
-- Emergency: decrypt all hybrid-encrypted data
UPDATE encrypted_data 
SET 
  algorithm = 'x25519_aes256gcm',
  ciphertext = classical_decrypt_reencrypt(ciphertext)
WHERE algorithm = 'hybrid_kyber768_x25519'
AND created_at > '2024-01-01'  -- Only recent data with hybrid encryption
LIMIT 10000;  -- Batch processing

-- Verify rollback
SELECT algorithm, COUNT(*) 
FROM encrypted_data 
GROUP BY algorithm;
```

---

### 4. Data Protection Rollback (Field Encryption)

#### Level 1: Bypass Encryption (< 5 minutes)
```bash
# Disable field-level encryption
export SECURITY_FIELD_ENCRYPTION=OFF
export ENCRYPTION_MODE=passthrough

# Update application configuration
kubectl patch configmap atlas-app-config -p '{"data":{"ENCRYPTION_MODE":"passthrough"}}'
```

#### Level 2: Transparent Decryption (< 15 minutes)
```javascript
// Database layer rollback middleware
class EncryptionBypassMiddleware {
  async beforeQuery(query, options) {
    if (process.env.SECURITY_ROLLBACK === 'true') {
      // Transparent decryption for reads
      if (query.type === 'SELECT') {
        query.attributes = this.addDecryptionSelectors(query.attributes);
      }
      
      // Skip encryption for writes  
      if (query.type === 'INSERT' || query.type === 'UPDATE') {
        query.data = await this.skipFieldEncryption(query.data);
      }
    }
    
    return query;
  }
  
  addDecryptionSelectors(attributes) {
    return attributes.map(attr => {
      if (this.isEncryptedField(attr)) {
        return `COALESCE(${attr}, decrypt_field(${attr}_enc)) as ${attr}`;
      }
      return attr;
    });
  }
}
```

#### Level 3: Database Schema Rollback (< 60 minutes)
```sql
-- Phase 1: Copy decrypted data back to original columns
UPDATE users 
SET 
  email = decrypt_field(email_enc, get_user_dek(user_id)),
  ssn = decrypt_field(ssn_enc, get_user_dek(user_id)),
  updated_at = NOW()
WHERE email_enc IS NOT NULL 
AND email IS NULL;

-- Phase 2: Verify data integrity
SELECT 
  COUNT(*) as total_users,
  COUNT(email) as users_with_email,
  COUNT(email_enc) as users_with_encrypted_email,
  COUNT(ssn) as users_with_ssn,
  COUNT(ssn_enc) as users_with_encrypted_ssn
FROM users;

-- Phase 3: Drop encryption columns (after verification)
-- DO NOT RUN without explicit approval from Security Lead
-- ALTER TABLE users DROP COLUMN email_enc, DROP COLUMN ssn_enc;
```

---

### 5. Edge Protection Rollback (WAF/Rate Limiting)

#### Level 1: Rate Limit Adjustment (< 2 minutes)
```bash
# Increase rate limits significantly
export WAF_RATE_LIMIT_MULTIPLIER=10    # 10x higher limits
export WAF_MODE=permissive             # Log only, don't block

# Cloudflare Workers update (if applicable)
curl -X PUT "https://api.cloudflare.com/client/v4/zones/{zone_id}/settings/security_level" \
  -H "Authorization: Bearer {api_token}" \
  -d '{"value":"essentially_off"}'
```

#### Level 2: WAF Rule Bypass (< 5 minutes)
```yaml
# Kong/nginx ingress configuration
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: atlas-ingress-rollback
  annotations:
    nginx.ingress.kubernetes.io/rate-limiting: "false"
    nginx.ingress.kubernetes.io/enable-modsecurity: "false"
    atlas.com/security-mode: "bypass"
spec:
  rules:
  - host: atlas.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: atlas-app-permissive
            port:
              number: 80
```

#### Level 3: Direct Backend Access (< 10 minutes)
```bash
# Emergency: bypass all edge protection
# Route traffic directly to application load balancer

# Update DNS to skip WAF
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789 \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.atlas.com",
        "Type": "CNAME", 
        "TTL": 60,
        "ResourceRecords": [{"Value": "atlas-alb-direct.us-east-1.elb.amazonaws.com"}]
      }
    }]
  }'
```

---

### 6. Supply Chain Rollback (SBOM/SLSA/Cosign)

#### Level 1: Skip Verification (< 2 minutes)
```bash
# Disable signature verification in deployment pipeline
export SUPPLY_CHAIN_SBOM_SLSA=OFF
export COSIGN_VERIFY_SIGNATURES=OFF
export SLSA_VERIFY_PROVENANCE=OFF

# Update deployment workflow
gh workflow run deploy-atlas-frontends.yml -f skip_security_verification=true
```

#### Level 2: Emergency Deployment (< 10 minutes)
```yaml
# GitHub Actions workflow override
name: Emergency Deployment (Security Rollback)
on:
  workflow_dispatch:
    inputs:
      security_override:
        description: 'Security verification override'
        required: true
        default: 'false'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Emergency Deploy (Skip Security)
      if: github.event.inputs.security_override == 'true'
      run: |
        echo "WARNING: Deploying without security verification"
        # Direct deployment without SBOM/SLSA/Cosign
        docker build -t atlas-app:emergency .
        docker push atlas-app:emergency
        kubectl set image deployment/atlas-app container=atlas-app:emergency
```

---

## ROLLBACK VALIDATION CHECKLIST

### Post-Rollback Health Checks
- [ ] **Application Health**: All services returning 200 OK on health endpoints
- [ ] **Database Connectivity**: All database queries working without encryption errors
- [ ] **Authentication Flow**: Users can successfully log in and access resources
- [ ] **Third-party Integrations**: External APIs/webhooks functioning normally
- [ ] **Performance Metrics**: Response times back to baseline levels
- [ ] **Error Rates**: 5xx error rates back to normal levels (<1%)

### Functional Verification Tests
```bash
# Automated rollback validation
./scripts/validate-rollback.sh --control=all --environment=production

# Manual verification commands  
curl -I https://atlas.com/health                    # Should return 200
curl -H "Authorization: Bearer $TOKEN" \            # Should work without DPoP
  https://api.atlas.com/v1/user/profile
  
# Database connectivity test
psql -c "SELECT COUNT(*) FROM users WHERE email IS NOT NULL"  # Should return data
```

### Communication Templates

#### Internal Incident Update
```
SUBJECT: [RESOLVED] Atlas Security Rollback - {Control Name}

Team,

We have successfully rolled back the {Control Name} security enhancement due to {reason}.

ROLLBACK COMPLETED: {timestamp}
SERVICES AFFECTED: {list}
CUSTOMER IMPACT: {description}
ROOT CAUSE: {brief explanation}

Current Status: All systems operational
Next Steps: {post-rollback actions}

Point of Contact: {engineer}
```

#### Customer Communication
```
SUBJECT: Atlas Service Update - Security Enhancement Temporarily Disabled

Dear Atlas Users,

We have temporarily disabled a recent security enhancement to ensure optimal service availability. 

IMPACT: None - all functionality remains available
TIMELINE: {duration of rollback}
NEXT STEPS: We are working on an improved implementation

We apologize for any confusion and appreciate your understanding.

The Atlas Team
```

---

## ROLLBACK METRICS & MONITORING

### Key Metrics to Track During Rollback
- **MTTR (Mean Time to Recovery)**: Target <30 minutes for Level 1-2 rollbacks
- **Customer Impact Duration**: Minimize time users experience issues  
- **Data Integrity**: Ensure no data corruption during crypto/encryption rollbacks
- **Security Posture**: Document temporary security reduction

### Automated Monitoring Alerts
```yaml
# Rollback completion alerts
alerts:
  - name: security_rollback_completed
    condition: security_rollback_mode == "active"
    notification: "Security control {control} has been rolled back"
    severity: warning
    
  - name: rollback_health_check
    condition: health_check_success_rate < 0.95 AND security_rollback_mode == "active"
    notification: "Health checks failing during security rollback"
    severity: critical
```

### Post-Rollback Analysis Requirements
1. **Root Cause Analysis**: Why did the security control need to be rolled back?
2. **Impact Assessment**: What was the blast radius and customer impact?
3. **Process Improvement**: How can we prevent this rollback scenario in the future?
4. **Security Gap Analysis**: What security risks are introduced by the rollback?
5. **Timeline for Re-implementation**: When will the security control be restored?

---

## ROLLBACK TESTING & VALIDATION

### Pre-Deployment Rollback Testing
All rollback procedures must be tested in staging before production deployment:

```bash
# Staging rollback test script
./scripts/test-rollback.sh \
  --environment=staging \
  --control=csp_headers \
  --validate-health-checks \
  --simulate-customer-traffic
```

### Regular Rollback Drills
- **Monthly**: Test Level 1 rollbacks (feature flags)
- **Quarterly**: Test Level 2 rollbacks (configuration changes)  
- **Annually**: Test Level 3 rollbacks (code/database changes)

This rollback plan will be updated and refined based on actual rollback experiences and lessons learned during the security hardening implementation.