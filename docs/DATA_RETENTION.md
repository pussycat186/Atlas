# Data Retention Policy

**Version:** 1.0.0  
**Effective Date:** 2025-10-17  
**Review Cycle:** Quarterly

## Overview

This document defines data retention periods and deletion procedures for all data types in the ATLAS platform. The policy balances user privacy, operational needs, legal requirements, and storage costs.

## Guiding Principles

1. **Data Minimization**: Retain only what is necessary
2. **User Control**: Allow users to configure retention where appropriate
3. **Transparency**: Clear communication of retention periods
4. **Automation**: Automated deletion to ensure compliance
5. **Auditability**: Maintain logs of deletion events

## Retention Schedules

### User-Generated Content

#### Messages
- **Default Retention**: 30 days from creation
- **User Configurable**: 1 day to 365 days
- **Auto-Deletion**: Automatic at end of retention period
- **Manual Deletion**: User can delete anytime before expiry
- **Deletion Scope**: Message content, metadata, associated media references

**Implementation:**
```sql
-- Scheduled job runs daily at 02:00 UTC
DELETE FROM messages 
WHERE created_at < NOW() - INTERVAL '30 days'
AND user_retention_days IS NULL;

DELETE FROM messages
WHERE created_at < NOW() - INTERVAL user_retention_days DAY
AND user_retention_days IS NOT NULL;
```

#### Media Files (Images, Videos, Files)
- **Retention**: Tied to parent message retention
- **Maximum Size**: 10 MB per file
- **Storage**: Vercel Blob Storage
- **Deletion Trigger**: When parent message is deleted
- **Orphan Cleanup**: Weekly scan for orphaned media (deleted within 7 days)

**Workflow:**
1. Message deletion triggered
2. Retrieve associated media IDs from `message_media` table
3. Delete media files from blob storage
4. Delete `message_media` records

#### Cryptographic Receipts
- **Retention**: 90 days from creation
- **Rationale**: Extended retention for dispute resolution and auditing
- **User Control**: Cannot be deleted early (integrity requirement)
- **Content**: Receipt metadata + signature (no message content)

**Fields Retained:**
- Receipt ID (UUID)
- Message ID reference
- Sender/recipient IDs
- Timestamp
- Content hash (SHA-256)
- Signature (EdDSA)

### Account Data

#### User Profiles
- **Retention**: Until account deletion
- **Data Included**: Username, display name, creation date, settings
- **Deletion Trigger**: User-initiated account deletion
- **Grace Period**: 14 days (soft delete, recoverable)
- **Permanent Deletion**: After 14-day grace period

**Account Deletion Process:**
1. User requests deletion
2. Account marked as `deleted_at = NOW()`, status = `PENDING_DELETION`
3. All messages deleted immediately
4. Grace period: 14 days for recovery
5. After 14 days: permanent deletion (account, receipts, all data)

#### Authentication Data
- **Passkey Credentials**: Stored on user device only (not on server)
- **Session Tokens**: 24 hours or until logout
- **Refresh Tokens**: 30 days or until revoked
- **JWKS (Server Keys)**: Active keys + 60 days after rotation

### System Logs

#### Application Logs
- **Retention**: 7 days
- **Content**: Error logs, info logs, debug logs
- **Sanitization**: All PII removed before logging
- **Storage**: Vercel Logs

**Log Rotation:**
- Daily rotation
- Compressed archives for days 1-7
- Deleted after 7 days

#### Security Event Logs
- **Retention**: 90 days
- **Content**: Failed login attempts, rate limit violations, abuse flags
- **Sanitization**: IP addresses hashed, no raw PII
- **Purpose**: Security monitoring and incident response

**Examples:**
- Failed authentication attempts
- Rate limit breaches
- Suspicious activity flags
- WAF blocks

#### Audit Logs (Administrative Actions)
- **Retention**: 1 year
- **Content**: Admin actions, configuration changes, access grants
- **Purpose**: Compliance, forensics, accountability
- **Storage**: Append-only, tamper-evident

**Actions Logged:**
- User account modifications by admins
- Permission changes
- Secret rotations
- Configuration updates

### Analytics and Metrics

#### Anonymized Usage Metrics
- **Retention**: 90 days
- **Content**: Aggregate counters (no user IDs)
- **Examples**: Page views, feature usage, error rates
- **Purpose**: Product improvement, performance monitoring

**Data Points:**
- Total messages sent (count only)
- Feature adoption rates
- Performance metrics (p50, p95, p99)
- Error rates by endpoint

**PII Exclusion:**
- No user IDs
- No IP addresses
- No session identifiers
- Only aggregate statistics

#### SLO/SLA Evidence
- **Retention**: 1 year
- **Content**: Health probe results, uptime data, performance baselines
- **Purpose**: Compliance with service level agreements
- **Storage**: `docs/evidence/` directory

### Evidence and Artifacts

#### CI/CD Evidence
- **Retention**: 1 year
- **Content**: Build logs, test results, deployment artifacts, SBOM
- **Purpose**: Audit trail, reproducibility, supply chain security
- **Storage**: Git repository + GitHub Actions artifacts

#### Security Artifacts
- **SBOM (Software Bill of Materials)**: 1 year
- **Cosign Signatures**: 1 year
- **Vulnerability Scans**: 90 days (latest kept indefinitely)
- **Penetration Test Results**: 3 years

## Deletion Procedures

### Automated Deletion
- **Scheduled Jobs**: Daily cron jobs for messages, media, logs
- **Execution Time**: 02:00 UTC (low-traffic period)
- **Monitoring**: Success/failure logged, alerts on failures
- **Retry Logic**: 3 attempts with exponential backoff

### Manual Deletion
- **User-Initiated**: Account settings or per-message deletion
- **Admin-Initiated**: Only in exceptional cases (legal compliance, abuse)
- **Audit Trail**: All manual deletions logged with justification

### Secure Deletion
- **Database**: `DELETE` statements (physical deletion, not soft delete)
- **Blob Storage**: Immediate deletion via Vercel Blob API
- **Backups**: 30-day backup retention, then purged
- **Encryption Keys**: Zeroed and rotated after data deletion

## Legal and Compliance Holds

### Legal Requests
In case of legal holds (court order, law enforcement request):
- Suspend automated deletion for affected data
- Tag data with `legal_hold = true`
- Retain until explicit release from legal team
- Document hold start/end dates

### Data Subject Requests (GDPR/CCPA)
- **Access Request**: Provide all data within 30 days
- **Deletion Request**: Complete deletion within 30 days
- **Portability Request**: JSON export within 30 days

## Backup Retention

### Production Backups
- **Frequency**: Daily snapshots
- **Retention**: 30 days rolling
- **Purpose**: Disaster recovery, not long-term archival
- **Deletion**: Automatic after 30 days

**Backup Scope:**
- Database snapshots
- Configuration files
- Secrets (encrypted vault backups)

**Exclusions:**
- Media files (stored in blob storage, not backed up)
- Logs (ephemeral, not critical for recovery)

## Review and Updates

### Quarterly Review
- Review retention periods for alignment with business needs
- Assess storage costs and optimize if necessary
- Update policy based on legal/regulatory changes

### Annual Audit
- Verify automated deletion jobs are functioning
- Confirm compliance with stated retention periods
- Audit manual deletions for proper justification

## Exceptions

### Extended Retention (Requires Approval)
- Ongoing legal investigation
- Regulatory requirement (e.g., financial records)
- Critical security incident under investigation

**Approval Authority:** CTO or Privacy Officer  
**Documentation:** Written justification required  
**Review:** Monthly review of all exceptions

## Contact

**Data Retention Questions**: privacy@atlas-platform.example  
**Legal Holds**: legal@atlas-platform.example  
**Technical Implementation**: engineering@atlas-platform.example

---

**Next Review Date:** 2026-01-17  
**Policy Owner:** Privacy Officer  
**Approved By:** [To be added before production]
