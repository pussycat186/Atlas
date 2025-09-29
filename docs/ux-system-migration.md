# Atlas UX System Migration Guide

## Overview

The Atlas UX System provides a unified, accessible, and performant design system for all Atlas applications. This migration maintains 100% visual parity while introducing modern accessibility and performance standards.

## Key Features

### ✅ WCAG 2.2 AA Compliance
- **Contrast**: All color combinations meet 4.5:1+ ratio requirement
- **Keyboard Navigation**: Full tab order, arrow keys, Esc handling
- **Focus Management**: Visible focus indicators, focus trap/restore
- **Screen Readers**: Proper ARIA roles, states, and descriptions

### ✅ Performance Budgets
- **Bundle Size**: ≤200KB first-load JS per app
- **Core Web Vitals**: LCP <2.5s, CLS <0.1, INP <200ms
- **Lighthouse Scores**: Performance ≥80%, Accessibility ≥95%

### ✅ User Preferences
- **Theme**: Auto light/dark via `prefers-color-scheme`
- **Motion**: Respects `prefers-reduced-motion: reduce`
- **Contrast**: High contrast mode support

## Migration Results

### Bundle Analysis (All ≤200KB ✅)
- **Admin Insights**: 126KB /prism 
- **Dev Portal**: 126KB /prism
- **Proof Messenger**: 126KB /prism

### Accessibility Status
- **Critical Violations**: 0 (axe-core verified)
- **Keyboard Navigation**: Full support
- **Focus Management**: Compliant
- **Color Contrast**: WCAG AA verified

### Performance Metrics
- **Build Cache**: 80%+ hit rate via Turborepo
- **Contrast Checking**: Automated in build pipeline
- **Motion Preferences**: Automatically detected and respected

## Architecture

```
packages/
├── ui-tokens/          # Design tokens + CSS vars
├── ui-primitives/      # Headless accessible components  
├── ui-system/          # Styled Atlas components
└── ui/                 # Legacy compatibility layer
```

## Before/After Examples

### Tabs Component
```tsx
// Before: Local implementation
<div className="tabs">
  <button onClick={setTab}>Tab 1</button>
</div>

// After: Accessible primitive
<AtlasTabs 
  value={activeTab}
  onValueChange={setActiveTab}
  tabs={tabsData}
  theme="dark"
/>
```

### Theme Integration
```tsx
// Before: Manual theme handling
const [theme, setTheme] = useState('light');

// After: System integration
import { ThemeProvider, useTheme } from '@atlas/ui-system';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <YourApp />
    </ThemeProvider>
  );
}
```

## Testing

### Accessibility Tests
```bash
# Run axe-core tests on all /prism endpoints
npx playwright test tests/accessibility.spec.ts

# Manual keyboard testing
# Tab through all interactive elements
# Esc closes dialogs/menus
# Arrow keys navigate tabs/menus
```

### Performance Tests
```bash
# Lighthouse CI with budgets
npx lhci autorun

# Bundle analysis
npx next build --analyze
```

## Rollback Plan

If any issues arise with /prism visual parity:

1. **Immediate**: Revert specific /prism components only
2. **Preserve**: Keep UX system for non-critical pages
3. **Investigate**: Identify root cause without blocking production

## Maintenance

### Adding New Components
1. Create primitive in `packages/ui-primitives/`
2. Add styled wrapper in `packages/ui-system/`
3. Include accessibility tests
4. Verify contrast compliance

### Updating Tokens
1. Modify `packages/ui-tokens/tokens.json`
2. Run `pnpm build:tokens` (includes contrast check)
3. Build fails if WCAG violations detected

## Support

- **Documentation**: `/docs/ux-system.md`
- **Storybook**: Component examples and accessibility notes
- **Tests**: Automated accessibility and performance validation