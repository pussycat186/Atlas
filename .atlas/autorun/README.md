# ATLAS Auto-Run Trigger Directory

This directory contains trigger files that automatically start the ATLAS Orchestrator workflow.

## How It Works

1. **Automatic Trigger**: Any commit that adds/modifies files in `.atlas/autorun/**` will automatically trigger the `atlas-orchestrator.yml` workflow.

2. **Self-Starting**: The orchestrator can trigger itself by creating new trigger files here when auto-repair is needed.

3. **No Manual Clicks**: Once triggered, the orchestrator runs all S0-S6 stages automatically until PERFECT_LIVE is achieved.

## Trigger Files

Each trigger file is named: `trigger-<timestamp>.txt`

Example:
```
trigger-20251017-143022.txt
```

## Manual Trigger (Optional)

To manually trigger a new orchestrator run:

```powershell
# Create a new trigger file
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmmss")
"MANUAL_TRIGGER" | Out-File -FilePath ".atlas\autorun\trigger-$timestamp.txt" -Encoding UTF8

# Commit and push
git add .atlas/autorun/
git commit -m "trigger: manual orchestrator run"
git push origin main
```

Within seconds, the orchestrator workflow will start automatically.

## Orchestrator Workflow

Path: `.github/workflows/atlas-orchestrator.yml`

Stages executed automatically:
- **S0**: Secrets Audit (hard stop if missing)
- **S1**: Deploy Frontends (3 apps to Vercel)
- **S2**: Validate Security Headers
- **S3**: Quality Gates (Lighthouse/k6/Playwright)
- **S4**: Policy Check (OPA)
- **S5**: Acceptance & Evidence (SBOM/SLSA/Cosign/Receipts)
- **S6**: Design System Build (Tokens/Storybook/A11y)
- **Finalize**: Generate PERFECT_LIVE.json

## Auto-Repair

If any stage S2-S6 fails, the orchestrator will:
1. Apply minimal fixes to the codebase
2. Commit the fix with `ci(orchestrator): auto-fix <area>`
3. Create a new trigger file
4. Push to main, which automatically restarts the orchestrator

This loop continues until all stages pass (max 5 attempts).

## Evidence Output

After successful completion:
- `docs/evidence/<timestamp>/PERFECT_LIVE.json`
- Artifacts: `evidence-pack`, `ux-pack`

## Status Tracking

Monitor workflow runs at:
https://github.com/pussycat186/Atlas/actions/workflows/atlas-orchestrator.yml
