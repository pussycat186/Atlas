# Legacy UI Components

This directory contains UI components that were replaced by the Atlas UX System but are preserved for rollback purposes.

## Rollback Instructions

If any issues arise with the new UX system:

1. **Immediate Rollback**: Copy components from this directory back to their original locations
2. **Partial Rollback**: Replace only specific components while keeping the UX system for others
3. **Full Rollback**: Restore entire legacy UI structure

## Preserved Components

- Original Tabs implementation
- Legacy theme handling
- Custom UI components replaced by @atlas/ui

## Git History

All changes are fully reversible through git history. Use `git revert` on specific commits to restore previous implementations.

## Safety

The /prism marker text "ATLAS • Prism UI — Peak Preview" has been preserved unchanged throughout the migration.