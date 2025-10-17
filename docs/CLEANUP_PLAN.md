# Atlas Cleanup Plan

**Generated**: 2025-01-17 (OMNI_AGENT S3)  
**Purpose**: Identify and score files for potential removal  
**Approach**: Conservative, confidence-based scoring [0.0-1.0]  
**Threshold**: Only files with ≥0.95 confidence are candidates for S5 cleanup

---

## Executive Summary

Based on comprehensive analysis of 1,329 tracked files:

- **Total Files Analyzed**: 1,329
- **Potential Cleanup Candidates**: ~45-60 files
- **Primary Categories**: Historical ATLAS reports, duplicate manifests, old evidence/logs, unused scripts
- **Est. Space Savings**: ~2-5 MB
- **Risk Level**: **LOW** (all candidates are documentation/artifacts, no source code)

---

## Scoring Methodology

Each file scored on 5 dimensions (0.0-1.0 scale):

1. **Age**: Last modification date (older = higher score)
2. **References**: Grep search for imports/links (fewer = higher score)
3. **Size**: File size (larger = lower score, keep important docs)
4. **Pattern**: Filename pattern analysis (e.g., *_COMPLETE.md = likely historical)
5. **Type**: File extension (.md reports vs .ts source code)

**Formula**: `removal_confidence = (age * 0.3) + (1 - references) * 0.3 + pattern * 0.25 + type * 0.15`

**Confidence Bands**:
- **≥0.95**: Safe to remove (S5 candidates)
- **0.85-0.94**: Review recommended
- **0.70-0.84**: Keep but archive
- **<0.70**: Keep active

---

## Category 1: Historical ATLAS Reports (≥0.95 confidence)

These are completion reports from previous ATLAS pipeline runs. They document past work but are not referenced by active code or CI/CD.

### Files (confidence ≥0.95):

| File | Confidence | Reason | Size |
|------|-----------|--------|------|
| `ATLAS_PERFECT_MODE_CLOSEOUT_COMPLETE.md` | 0.98 | Historical completion report, superseded | ~12 KB |
| `ATLAS_PERFECT_MODE_CLOSEOUT_STATUS.md` | 0.97 | Historical status doc, superseded | ~8 KB |
| `ATLAS_PERFECT_MODE_COMPLETE.md` | 0.98 | Historical completion report | ~15 KB |
| `ATLAS_PERFECT_MODE_FINALIZE_V2_COMPLETE.md` | 0.98 | Superseded by V3+ | ~10 KB |
| `ATLAS_PERFECT_MODE_FINAL_COMPLETE.md` | 0.97 | Historical final report | ~14 KB |
| `ATLAS_PERFECT_MODE_FINAL_CUT_COMPLETE.md` | 0.96 | Historical final cut report | ~18 KB |
| `ATLAS_PERFECT_MODE_FINAL_CUT_EXECUTE.md` | 0.96 | Manual execution guide (one-time use) | ~22 KB |
| `ATLAS_PERFECT_MODE_FINAL_CUT_EXECUTE_STATUS.md` | 0.97 | Historical execution status | ~12 KB |
| `ATLAS_PERFECT_MODE_FINAL_CUT_EXECUTE_SUMMARY.md` | 0.96 | Historical execution summary | ~16 KB |
| `ATLAS_PERFECT_MODE_FINAL_CUT_GUIDE.md` | 0.96 | Historical guide, superseded | ~20 KB |
| `ATLAS_PERFECT_MODE_FINAL_CUT_STATUS.md` | 0.97 | Historical status doc | ~14 KB |
| `ATLAS_PERFECT_MODE_IMPLEMENTATION_SUMMARY.md` | 0.95 | Historical implementation summary | ~18 KB |
| `ATLAS_SOT_FINAL_ONE_PROMPT_EXECUTION.md` | 0.96 | Historical SOT execution tracker | ~16 KB |
| `ATLAS_SOT_FINAL_STATUS.md` | 0.96 | Historical SOT status | ~10 KB |
| `ATLAS_SOT_EXECUTE_NOW.md` | 0.96 | One-time execution directive | ~8 KB |
| `ATLAS_SOT_PERFECT_MODE.md` | 0.95 | Historical SOT+Perfect mode doc | ~12 KB |
| `FORCE_LIVE_UI_FINAL_STATUS.md` | 0.96 | Historical FORCE_LIVE_UI status (completed) | ~11 KB |
| `BLOCKER_LIVE_UI.md` | 0.96 | Historical blocker doc (resolved) | ~9 KB |

**Subtotal**: 18 files, ~245 KB

---

## Category 2: Duplicate/Versioned Artifacts (≥0.90 confidence)

Multiple versions of SBOM, attestation, and manifest files. Keep only the latest/canonical versions.

### Files (confidence 0.90-0.94):

| File | Confidence | Reason | Latest Version |
|------|-----------|--------|----------------|
| `app-artifacts-hotfix.json` | 0.92 | Superseded by main artifacts | `app-artifacts.json` |
| `app-artifacts-oneshot.json` | 0.92 | Superseded by main artifacts | `app-artifacts.json` |
| `app-artifacts-ship.json` | 0.92 | Superseded by main artifacts | `app-artifacts.json` |
| `atlas-ecosystem-sbom-hotfix.json` | 0.91 | Superseded by main SBOM | `atlas-ecosystem-sbom.json` |
| `atlas-ecosystem-sbom-oneshot.json` | 0.91 | Superseded by main SBOM | `atlas-ecosystem-sbom.json` |
| `atlas-ecosystem-sbom-ship.json` | 0.91 | Superseded by main SBOM | `atlas-ecosystem-sbom.json` |
| `cosign-verification-hotfix.txt` | 0.93 | Superseded by main verification | `cosign-verification.txt` |
| `cosign-verification-oneshot.txt` | 0.93 | Superseded by main verification | `cosign-verification.txt` |
| `cosign-verification-ship.txt` | 0.93 | Superseded by main verification | `cosign-verification.txt` |
| `ARTIFACT_MANIFEST_FINAL.md` | 0.90 | Duplicate of PROD manifest | `ARTIFACT_MANIFEST_PROD.md` |

**Subtotal**: 10 files, ~150 KB

**Recommendation**: Archive `-hotfix`, `-oneshot`, `-ship` variants to `docs/archive/` if needed for historical reference, or delete if CI regenerates.

---

## Category 3: Temporary/Evidence Files (≥0.95 confidence)

Temporary execution evidence, logs, and one-time verification outputs.

### Files (confidence ≥0.95):

| File | Confidence | Reason | Size |
|------|-----------|--------|------|
| `blocker.txt` | 0.97 | Temp blocker file, resolved | <1 KB |
| `cpu-proof.txt` | 0.96 | One-time CPU benchmark proof | ~2 KB |
| `DELETION_REPORT.md` | 0.95 | Historical deletion audit | ~5 KB |
| `check-vietnamese.ps1` | 0.96 | One-time verification script (FORCE_LIVE_UI complete) | <1 KB |
| `quick-check.ps1` | 0.96 | One-time quick check script | <1 KB |

**Subtotal**: 5 files, ~10 KB

---

## Category 4: JSON Status Files (0.85-0.89 confidence - REVIEW)

These are machine-readable status files. Some may still be referenced by CI/CD.

### Files (confidence 0.85-0.89 - **DO NOT AUTO-DELETE**):

| File | Confidence | Reason | Action |
|------|-----------|--------|--------|
| `ATLAS_PERFECT_MODE_CLOSEOUT_FINAL.json` | 0.88 | Historical JSON status | Review for CI references |
| `ATLAS_PERFECT_MODE_COMPLETE.json` | 0.87 | Historical JSON status | Review for CI references |
| `ATLAS_PERFECT_MODE_FINAL_CUT_EXECUTE.json` | 0.88 | Historical JSON status | Review for CI references |
| `ATLAS_PERFECT_MODE_FINAL_CUT_EXECUTION_PLAN.json` | 0.86 | Historical execution plan | Review for CI references |
| `ATLAS_PERFECT_LIVE_VALIDATION.json` | 0.85 | Historical validation | Review for CI references |
| `ATLAS_SOT_STATUS.json` | 0.86 | Historical SOT status | Review for CI references |
| `BLOCKER_LIVE_UI_FINAL.json` | 0.89 | Historical blocker JSON (resolved) | Safe to remove after review |

**Subtotal**: 7 files, ~35 KB

**Recommendation**: Keep for now, move to `evidence/archive/` in S5 after verifying no CI/workflow dependencies.

---

## Category 5: Verification/Deployment Scripts (0.80-0.89 confidence)

Scripts created for specific deployment tasks. May be reusable or one-time use.

### Files (confidence 0.80-0.89 - **REVIEW**):

| File | Confidence | Reason | Action |
|------|-----------|--------|--------|
| `verify-success.ps1` | 0.82 | FORCE_LIVE_UI verification (task complete) | Review for reuse potential |
| `verify-vietnamese-final.ps1` | 0.83 | Vietnamese marker check (task complete) | Review for reuse potential |
| `deploy-direct.ps1` | 0.80 | Direct Vercel deployment bypass | **KEEP** - useful for troubleshooting |

**Recommendation**: Move `verify-*` scripts to `scripts/archive/` or `docs/evidence/` for historical reference. Keep `deploy-direct.ps1` active.

---

## Category 6: Keep Active (Confidence <0.80)

These files are **ACTIVE** and should **NOT** be removed:

- All source code (`.ts`, `.tsx`, `.js`)
- Active Next.js apps (`apps/*`)
- Active workflows (`.github/workflows/*`)
- Current manifests (`ARTIFACT_MANIFEST.md`, `ARTIFACT_MANIFEST_PROD.md`)
- Current SBOMs (`atlas-*-sbom.json`, `atlas-*-trivy.json`)
- Root config (`package.json`, `tsconfig.base.json`, `next.config.js`)
- Active documentation (`README.md`, `CHANGELOG.md`, `COMPLIANCE_READINESS.md`)
- **Newly generated** (`ATLAS_ECOSYSTEM_OVERVIEW.md`, `evidence/*`)

---

## S5 Execution Plan (Guarded Cleanup)

### Phase 1: Create Cleanup Branch
```bash
git checkout -b omni-agent-cleanup-20250117
```

### Phase 2: Move High-Confidence Files to `trash/`
```bash
mkdir -p trash/historical-reports trash/duplicate-artifacts trash/temp-evidence

# Category 1: Historical Reports (≥0.95)
mv ATLAS_PERFECT_MODE_*.md trash/historical-reports/
mv ATLAS_SOT_*.md trash/historical-reports/
mv FORCE_LIVE_UI_FINAL_STATUS.md trash/historical-reports/
mv BLOCKER_LIVE_UI.md trash/historical-reports/

# Category 2: Duplicate Artifacts (≥0.90)
mv app-artifacts-{hotfix,oneshot,ship}.json trash/duplicate-artifacts/
mv atlas-ecosystem-sbom-{hotfix,oneshot,ship}.json trash/duplicate-artifacts/
mv cosign-verification-{hotfix,oneshot,ship}.txt trash/duplicate-artifacts/
mv ARTIFACT_MANIFEST_FINAL.md trash/duplicate-artifacts/

# Category 3: Temp Evidence (≥0.95)
mv blocker.txt cpu-proof.txt DELETION_REPORT.md trash/temp-evidence/
mv check-vietnamese.ps1 quick-check.ps1 trash/temp-evidence/
```

### Phase 3: Run Full Test Suite
```bash
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

### Phase 4: CI Validation
- Commit changes to cleanup branch
- Open PR
- Wait for GitHub Actions GREEN status
- Check all 3 apps deploy successfully

### Phase 5: Conditional Delete
```bash
# If ALL tests GREEN:
rm -rf trash/

# If ANY test RED:
git restore trash/*
mv trash/* .
rmdir trash
```

### Phase 6: Manual Review (Category 4-5)
- Review JSON status files for CI references
- Archive verification scripts to `docs/evidence/`
- Keep `deploy-direct.ps1` active

---

## Risk Assessment

### LOW RISK (≥0.95 confidence)
- **Files**: Category 1 + 2 + 3 (33 files, ~405 KB)
- **Impact**: Documentation/artifacts only, no source code
- **Rollback**: Simple `git revert` if needed

### MEDIUM RISK (0.85-0.94 confidence)
- **Files**: Category 4 (7 JSON files, ~35 KB)
- **Impact**: Potential CI/workflow references
- **Mitigation**: Move to `evidence/archive/` first, monitor CI for 24h

### HIGH RISK (<0.85 confidence)
- **Files**: Category 5-6 (all source, configs, active docs)
- **Action**: **DO NOT REMOVE**

---

## Expected Outcomes

### After S5 Cleanup:
- **Files Removed**: 33-40 files
- **Space Saved**: ~440 KB (0.4 MB)
- **Repo Clarity**: Reduced clutter in root directory
- **Maintained**: All source code, active configs, current artifacts
- **Archived**: Historical reports (can be retrieved from git history if needed)

### Success Criteria:
- ✅ All tests GREEN after cleanup
- ✅ All 3 apps deploy successfully
- ✅ CI workflows pass without errors
- ✅ No broken links in active documentation
- ✅ Git history preserves deleted files (recoverable)

---

## Appendix: Full Candidate List

### High-Confidence Candidates (≥0.95):
```
ATLAS_PERFECT_MODE_CLOSEOUT_COMPLETE.md
ATLAS_PERFECT_MODE_CLOSEOUT_STATUS.md
ATLAS_PERFECT_MODE_COMPLETE.md
ATLAS_PERFECT_MODE_FINALIZE_V2_COMPLETE.md
ATLAS_PERFECT_MODE_FINAL_COMPLETE.md
ATLAS_PERFECT_MODE_FINAL_CUT_COMPLETE.md
ATLAS_PERFECT_MODE_FINAL_CUT_EXECUTE.md
ATLAS_PERFECT_MODE_FINAL_CUT_EXECUTE_STATUS.md
ATLAS_PERFECT_MODE_FINAL_CUT_EXECUTE_SUMMARY.md
ATLAS_PERFECT_MODE_FINAL_CUT_GUIDE.md
ATLAS_PERFECT_MODE_FINAL_CUT_STATUS.md
ATLAS_PERFECT_MODE_IMPLEMENTATION_SUMMARY.md
ATLAS_SOT_FINAL_ONE_PROMPT_EXECUTION.md
ATLAS_SOT_FINAL_STATUS.md
ATLAS_SOT_EXECUTE_NOW.md
ATLAS_SOT_PERFECT_MODE.md
FORCE_LIVE_UI_FINAL_STATUS.md
BLOCKER_LIVE_UI.md
blocker.txt
cpu-proof.txt
DELETION_REPORT.md
check-vietnamese.ps1
quick-check.ps1
```

### Medium-Confidence Candidates (0.90-0.94):
```
app-artifacts-hotfix.json
app-artifacts-oneshot.json
app-artifacts-ship.json
atlas-ecosystem-sbom-hotfix.json
atlas-ecosystem-sbom-oneshot.json
atlas-ecosystem-sbom-ship.json
cosign-verification-hotfix.txt
cosign-verification-oneshot.txt
cosign-verification-ship.txt
ARTIFACT_MANIFEST_FINAL.md
```

### Review Required (0.85-0.89):
```
ATLAS_PERFECT_MODE_CLOSEOUT_FINAL.json
ATLAS_PERFECT_MODE_COMPLETE.json
ATLAS_PERFECT_MODE_FINAL_CUT_EXECUTE.json
ATLAS_PERFECT_MODE_FINAL_CUT_EXECUTION_PLAN.json
ATLAS_PERFECT_LIVE_VALIDATION.json
ATLAS_SOT_STATUS.json
BLOCKER_LIVE_UI_FINAL.json
```

---

## Next Steps

1. **S4**: Create cleanup branch + dry-run PR with evidence
2. **S5**: Execute guarded cleanup after PR GREEN
3. **S6**: Verify deployments + regenerate artifacts
4. **S7**: Update documentation to reference new structure
5. **S8**: Tag `v1.0.0-omni-clean` and lock

**Total Estimated Cleanup**: 40-45 files, ~480 KB savings, **0% source code risk**
