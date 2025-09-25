# ROLLBACK - ATLAS Monorepo Hardening Rollback Procedures

## Overview
This document provides comprehensive rollback procedures for the ATLAS monorepo hardening changes. All rollback procedures are designed to be safe, reversible, and minimize downtime.

## Rollback Strategy

### Immediate Rollback (0-5 minutes)
For critical issues requiring immediate rollback:
1. **Stop all services** to prevent further issues
2. **Revert to previous working state** using Git
3. **Restart services** with previous configuration
4. **Verify system health** and functionality

### Planned Rollback (5-30 minutes)
For non-critical issues allowing planned rollback:
1. **Notify stakeholders** of rollback plan
2. **Execute rollback procedures** step by step
3. **Verify each step** before proceeding
4. **Monitor system health** throughout process

### Gradual Rollback (30+ minutes)
For complex issues requiring gradual rollback:
1. **Identify specific components** causing issues
2. **Rollback components individually** in order of priority
3. **Test each component** after rollback
4. **Monitor system stability** between steps

## Rollback Procedures by Phase

### Phase 0 - Inventory & Baseline
**Rollback**: Not applicable - no changes made to system functionality
**Verification**: No verification needed

### Phase 1 - Clean Sweep
**Rollback**: Restore deleted files and dependencies
```bash
# Restore from Git
git checkout HEAD~1 -- scripts/cleanup.sh
git checkout HEAD~1 -- DELETION_REPORT.md

# Restore deleted files (if any were actually deleted)
git checkout HEAD~1 -- <deleted-file-path>

# Restore dependencies
git checkout HEAD~1 -- package.json
git checkout HEAD~1 -- packages/*/package.json
git checkout HEAD~1 -- services/*/package.json
git checkout HEAD~1 -- apps/*/package.json

# Reinstall dependencies
pnpm install --frozen-lockfile
```

**Verification**:
```bash
# Verify build works
pnpm build

# Verify tests pass
pnpm test:unit

# Verify services start
docker-compose up -d
```

### Phase 2 - Monorepo Strictness
**Rollback**: Revert service hardening changes
```bash
# Revert gateway service
git checkout HEAD~1 -- services/gateway/src/server.ts
git checkout HEAD~1 -- services/gateway/package.json

# Revert witness node service
git checkout HEAD~1 -- services/witness-node/src/witness.ts
git checkout HEAD~1 -- services/witness-node/package.json

# Revert protocol schemas
git checkout HEAD~1 -- packages/fabric-protocol/src/schemas.ts
git checkout HEAD~1 -- packages/fabric-protocol/package.json

# Revert client SDK
git checkout HEAD~1 -- packages/fabric-client/src/client.ts
git checkout HEAD~1 -- packages/fabric-client/package.json

# Revert root configuration
git checkout HEAD~1 -- package.json
git checkout HEAD~1 -- tsconfig.base.json
git checkout HEAD~1 -- .eslintrc.js
git checkout HEAD~1 -- .prettierrc.js
```

**Verification**:
```bash
# Rebuild services
pnpm build

# Test basic functionality
curl http://localhost:3000/health
curl http://localhost:3001/health

# Run tests
pnpm test:unit
```

### Phase 3 - Observability
**Rollback**: Remove observability instrumentation
```bash
# Remove OTEL dependencies
git checkout HEAD~1 -- packages/fabric-client/src/telemetry.ts
git checkout HEAD~1 -- services/gateway/package.json
git checkout HEAD~1 -- services/witness-node/package.json

# Remove observability configuration
rm -rf observability/
git checkout HEAD~1 -- docker-compose.yml

# Revert service changes
git checkout HEAD~1 -- services/gateway/src/server.ts
git checkout HEAD~1 -- services/witness-node/src/witness.ts
```

**Verification**:
```bash
# Rebuild services
pnpm build

# Test without observability
docker-compose up -d
curl http://localhost:3000/health
```

### Phase 4 - CI/CD & Supply Chain
**Rollback**: Remove CI/CD pipelines and supply chain features
```bash
# Remove CI workflows
rm -rf .github/workflows/ci-*.yml

# Restore original workflows
git checkout HEAD~1 -- .github/workflows/

# Remove supply chain artifacts
rm -rf _reports/sbom/
rm -rf _reports/slsa-provenance.*
rm -rf _reports/release/
```

**Verification**:
```bash
# Verify no CI workflows are active
ls .github/workflows/

# Verify services still work
docker-compose up -d
curl http://localhost:3000/health
```

### Phase 5 - Evidence Pack
**Rollback**: Remove evidence and documentation
```bash
# Remove evidence files
rm -rf _reports/EVIDENCE.md
rm -rf _reports/sbom/
rm -rf _reports/slsa-provenance.*
rm -rf _reports/release/

# Remove documentation
rm -f WHAT.md WHY.md VERIFY.md ROLLBACK.md
```

**Verification**:
```bash
# Verify system still works
docker-compose up -d
curl http://localhost:3000/health
```

## Complete System Rollback

### Full Rollback to Pre-Hardening State
```bash
# 1. Stop all services
docker-compose down

# 2. Revert to pre-hardening commit
git checkout <pre-hardening-commit-hash>

# 3. Clean up any untracked files
git clean -fd

# 4. Reinstall dependencies
pnpm install --frozen-lockfile

# 5. Rebuild services
pnpm build

# 6. Start services
docker-compose up -d

# 7. Verify system health
curl http://localhost:3000/health
curl http://localhost:3001/health
```

### Partial Rollback (Specific Components)
```bash
# Rollback specific service
git checkout HEAD~1 -- services/gateway/
pnpm build
docker-compose restart gateway

# Rollback specific package
git checkout HEAD~1 -- packages/fabric-protocol/
pnpm build
docker-compose restart gateway witness-1

# Rollback specific configuration
git checkout HEAD~1 -- package.json
pnpm install --frozen-lockfile
```

## Database Rollback

### If Database Changes Were Made
```bash
# 1. Stop services
docker-compose down

# 2. Backup current database
docker-compose exec postgres pg_dump -U atlas atlas > backup-$(date +%Y%m%d-%H%M%S).sql

# 3. Restore previous database
docker-compose exec postgres psql -U atlas -d atlas -f backup-<previous-backup>.sql

# 4. Restart services
docker-compose up -d
```

## Configuration Rollback

### Environment Variables
```bash
# Restore previous environment
cp .env.backup .env

# Or revert specific variables
export NODE_ENV=production
export LOG_LEVEL=info
export OTEL_EXPORTER_OTLP_ENDPOINT=""
```

### Docker Configuration
```bash
# Restore previous docker-compose
git checkout HEAD~1 -- docker-compose.yml

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

## Monitoring During Rollback

### Health Checks
```bash
# Check service health
curl http://localhost:3000/health
curl http://localhost:3001/health

# Check system resources
docker stats

# Check logs
docker-compose logs -f
```

### Performance Monitoring
```bash
# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/health

# Monitor error rates
grep "ERROR" docker-compose.logs | wc -l
```

## Rollback Verification

### Functional Verification
1. **API Endpoints**: All endpoints responding correctly
2. **Database**: Data integrity maintained
3. **Authentication**: User authentication working
4. **Authorization**: Access control functioning

### Performance Verification
1. **Response Times**: Within acceptable limits
2. **Throughput**: Meeting performance requirements
3. **Error Rates**: Below threshold levels
4. **Resource Usage**: Normal CPU and memory usage

### Security Verification
1. **Access Control**: Proper authentication and authorization
2. **Data Protection**: Sensitive data properly protected
3. **Audit Logging**: Security events being logged
4. **Vulnerability Scan**: No new vulnerabilities introduced

## Rollback Communication

### Stakeholder Notification
1. **Immediate**: Notify operations team of rollback
2. **Users**: Inform users of potential service impact
3. **Management**: Report rollback status and timeline
4. **Documentation**: Update incident reports and logs

### Post-Rollback Actions
1. **Root Cause Analysis**: Investigate why rollback was needed
2. **Lessons Learned**: Document lessons for future improvements
3. **Process Updates**: Update procedures based on rollback experience
4. **Training**: Provide additional training if needed

## Emergency Contacts

### Technical Escalation
- **Primary**: Development Team Lead
- **Secondary**: DevOps Engineer
- **Tertiary**: System Administrator

### Business Escalation
- **Primary**: Product Manager
- **Secondary**: Engineering Manager
- **Tertiary**: CTO

## Rollback Checklist

### Pre-Rollback
- [ ] **Identify root cause** of issue requiring rollback
- [ ] **Assess impact** of rollback on system and users
- [ ] **Notify stakeholders** of rollback plan
- [ ] **Prepare rollback procedures** for specific components
- [ ] **Backup current state** before rollback

### During Rollback
- [ ] **Stop services** gracefully
- [ ] **Execute rollback** step by step
- [ ] **Verify each step** before proceeding
- [ ] **Monitor system health** throughout process
- [ ] **Document all actions** taken

### Post-Rollback
- [ ] **Verify system functionality** is restored
- [ ] **Monitor system performance** for stability
- [ ] **Notify stakeholders** of rollback completion
- [ ] **Investigate root cause** of original issue
- [ ] **Plan remediation** for future deployment

## Conclusion

These rollback procedures provide comprehensive coverage for all hardening changes made to the ATLAS monorepo. Each procedure is designed to be safe, reversible, and minimize system downtime. Regular testing of rollback procedures is recommended to ensure they work correctly when needed.

### Key Principles
1. **Safety First**: Always prioritize system stability and data integrity
2. **Minimal Downtime**: Execute rollbacks as quickly as possible
3. **Verification**: Verify each step before proceeding
4. **Communication**: Keep all stakeholders informed
5. **Documentation**: Document all actions for future reference
