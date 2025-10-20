# Atlas Runbooks

## 1. Key Leak Response

**Trigger**: Private key exposed in logs/code

**Actions**:
1. Rotate JWKS immediately (emergency rotation)
2. Revoke compromised kid
3. Notify users (in-app banner)
4. Audit all receipts signed with compromised key
5. Post-mortem within 24h

## 2. Performance Regression

**Trigger**: p95 latency > 200ms for 10 minutes

**Actions**:
1. Check Cloud Run metrics (CPU, memory, concurrency)
2. Review recent deployments (rollback if needed)
3. Check database queries (Firestore)
4. Scale up instances if needed
5. Create incident report

## 3. Supply-Chain Alert

**Trigger**: Trivy finds HIGH/CRITICAL vulnerability

**Actions**:
1. Block deployment (CI gate)
2. Assess impact (reachable? exploitable?)
3. Update dependency or apply patch
4. Re-scan and verify fix
5. Deploy patched version
6. Announce in Trust Portal

---

**Ngày tạo**: 2025-10-21
