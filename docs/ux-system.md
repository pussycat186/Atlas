# Atlas UX System

Complete design system with WCAG 2.2 AA compliance, performance budgets, and Figma integration.

## Architecture

```
packages/
├── ui-tokens/          # Design tokens from Figma
├── ui-primitives/      # Headless accessible components
├── ui-system/          # Styled Atlas components
└── ui/                 # Legacy compatibility + new wrappers
```

## Quick Start

```bash
# Pull tokens from Figma
FIGMA_TOKEN=your_token pnpm tokens:pull

# Build system
pnpm tokens:build
pnpm build

# Development
pnpm dev
```

## Components

### Primitives (Headless)
- `Tabs` - ARIA compliant with roving tabindex
- `Dialog` - Focus trap/restore, Esc to close
- `Menu` - Arrow navigation, click-outside
- `Toast` - ARIA live regions
- `Select` - Combobox pattern
- `Input` - Error states, descriptions
- `Switch` - Proper ARIA roles

### Styled Wrappers
- `AtlasTabs` - Motion-aware tabs
- `AtlasCard` - Theme-responsive cards
- `AtlasNavbar` - Navigation with theme toggle
- `AtlasMinimap` - Page navigation
- `ThemeToggle` - Light/dark/high-contrast

## Theme System

```tsx
import { ThemeProvider } from '@atlas/ui-system';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <YourApp />
    </ThemeProvider>
  );
}
```

Themes: `light` | `dark` | `high-contrast` | `system`

## Accessibility

- **WCAG 2.2 AA**: 4.5:1 contrast, focus management
- **ARIA APG**: Complete implementation
- **Keyboard**: Tab order, arrow navigation, Esc handling
- **Motion**: Respects `prefers-reduced-motion`

## Performance

- **Bundle Budget**: ≤200KB first-load JS
- **Core Web Vitals**: LCP <2.5s, CLS <0.1, INP <200ms
- **Lighthouse**: Performance ≥80%, Accessibility ≥95%

## Testing

```bash
# Accessibility
npx playwright test tests/accessibility.spec.ts

# Performance
pnpm analyze:bundles

# Visual regression
FIGMA_TOKEN=token node scripts/visual-compare.mjs
```