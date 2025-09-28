# Atlas UX System

## Overview

The Atlas UX System provides a unified design language with WCAG 2.2 AA compliant components, design tokens, and accessibility-first primitives for all Atlas applications.

## Architecture

### Design Tokens (`@atlas/ui-tokens`)
- **Source**: `tokens.json` with color, spacing, typography, motion values
- **Build**: Generates CSS custom properties + TypeScript types
- **Themes**: Light, dark, high-contrast with system preference detection
- **Accessibility**: 4.5:1+ contrast ratios, reduced motion support

### Primitives (`@atlas/ui-primitives`)
- **Headless components**: Tabs, Button, VisuallyHidden
- **ARIA compliant**: Proper roles, states, keyboard navigation
- **SSR safe**: No window access on import
- **Tree-shakable**: Minimal bundle impact

### UI System (`@atlas/ui-system`)
- **Styled components**: AtlasTabs, ThemeProvider, ThemeToggle
- **Theme integration**: Automatic light/dark switching
- **Motion**: Respects prefers-reduced-motion
- **Performance**: Optimized for Core Web Vitals

## Usage

### Theme Setup
```tsx
import { ThemeProvider } from '@atlas/ui-system';
import '@atlas/ui-tokens/src/globals.css';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      {/* Your app */}
    </ThemeProvider>
  );
}
```

### Components
```tsx
import { AtlasTabs, ThemeToggle } from '@atlas/ui-system';

const tabs = [
  { value: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
  { value: 'tab2', label: 'Tab 2', content: <div>Content 2</div> }
];

<AtlasTabs 
  value={activeTab} 
  onValueChange={setActiveTab}
  tabs={tabs}
  theme="dark"
  sku="pro"
/>
```

## Performance Budgets

- **Bundle Size**: ≤ 200KB first-load JS per app
- **LCP**: < 2.5s on 4x CPU slowdown
- **CLS**: < 0.1
- **INP**: < 200ms

## Accessibility Standards

- **WCAG 2.2 AA**: All components tested
- **Keyboard Navigation**: Full tab order, escape handling
- **Screen Readers**: Proper ARIA labels and descriptions
- **Focus Management**: Visible focus indicators, focus trapping

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Update tokens in `packages/ui-tokens/tokens.json`
2. Run `pnpm build:tokens` to generate CSS/TS
3. Test with `pnpm test:a11y` for accessibility compliance
4. Verify performance budgets with Lighthouse CI