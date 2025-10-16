# Secrets Setup Guide for Atlas

## Required GitHub Secrets

To enable full Atlas functionality, configure these secrets in your repository:

**Repository Settings → Secrets and variables → Actions → New repository secret**

### Vercel Deployment Secrets

```
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=team_xxxxxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxxxx
```

### How to Get Vercel Values

1. **VERCEL_TOKEN**:
   - Go to https://vercel.com/account/tokens
   - Click "Create Token"
   - Name: "Atlas GitHub Actions"
   - Scope: Full Account access
   - Expiration: No expiration (or 1 year max)
   - Copy the generated token

2. **VERCEL_ORG_ID**:
   - Go to https://vercel.com/teams
   - Click on your team/personal account
   - Settings → General
   - Copy "Team ID" value

3. **VERCEL_PROJECT_ID**:
   - Go to your Vercel dashboard
   - Select your Atlas project
   - Settings → General  
   - Copy "Project ID" value

### Additional Secrets (Optional)

```
# For enhanced security scanning
SONAR_TOKEN=your_sonarcloud_token

# For Slack notifications (if desired)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## Validation

After adding secrets, check:

1. **GitHub Actions**: Should deploy successfully without "VERCEL_TOKEN not configured" messages
2. **Vercel Dashboard**: Should show deployments triggered by GitHub
3. **URLs**: Should be accessible at `https://atlas-{app}.vercel.app`

## Security Notes

- Never commit secrets to the repository
- Use environment-specific secrets for staging vs production
- Rotate tokens every 90 days for security
- Monitor secret usage in Actions logs

## Troubleshooting

### "Invalid token" errors
- Verify token has correct permissions
- Check token hasn't expired
- Ensure team/org ID matches your Vercel account

### "Project not found" errors  
- Verify project ID is correct
- Ensure GitHub repository is connected to Vercel project
- Check project exists in the specified team/org

### "Permission denied" errors
- Token needs deployment permissions
- User must be owner/admin of Vercel team
- Project must allow GitHub deployments

## Without Secrets

If secrets are not configured:
- Local development still works in Codespaces
- Build and test phases run successfully  
- Only deployment phase will be skipped
- All other quality gates continue to function