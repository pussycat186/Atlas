# Atlas UI Contract

**Version**: 2.0  
**Last Updated**: 2025-09-20T15:45:00Z  
**Scope**: All Atlas applications (proof-messenger, admin-insights, dev-portal)

## Overview

This document inventories all visible UI actions and controls across Atlas applications. **No action listed here may be removed or deleted.** If space constraints require reorganization, actions must be moved to overflow menus with clear labels and preserved functionality.

## Production URLs

- **Proof Messenger**: https://atlas-proof-messenger.vercel.app
- **Admin Insights**: https://atlas-admin-insights.vercel.app  
- **Dev Portal**: https://atlas-dev-portal.vercel.app

## Proof Messenger Actions

### Composer Actions
- **Send Message** (`data-testid="send-message-button"`)
  - Location: Main composer area
  - Action: Submit message to conversation
  - Current: Primary button with loading state
  - Hotkeys: Enter (send), Shift+Enter (new line)
- **Draft** (`data-testid="draft-message-button"`)
  - Location: Main composer area
  - Action: Save message as draft
  - Current: Outline button
- **Attach File** (to be implemented)
  - Location: Composer toolbar
  - Action: Open file picker
  - Current: Icon button with aria-label
- **Emoji Picker** (to be implemented)
  - Location: Composer toolbar
  - Action: Open emoji selection
  - Current: Icon button with aria-label
- **Slash Commands** (to be implemented)
  - Location: Composer input
  - Action: Trigger command menu
  - Current: Typed "/" trigger

### Connection Management
- **Refresh Connection** (`data-testid="refresh-connection"`)
  - Location: Header area
  - Action: Refresh connection status
  - Current: Ghost icon button with aria-label

### Message Actions
- **Copy Message ID** (`data-testid="copy-{msg.id}"`)
  - Location: Message list items
  - Action: Copy message ID to clipboard
  - Current: Ghost icon button with aria-label
- **React to Message** (to be implemented)
  - Location: Message bubbles
  - Action: Add emoji reaction
  - Current: Icon button with aria-label
- **Reply to Message** (to be implemented)
  - Location: Message bubbles
  - Action: Start reply thread
  - Current: Icon button with aria-label
- **Pin Message** (to be implemented)
  - Location: Message context menu
  - Action: Pin important messages
  - Current: Menu item with aria-label

### Search & Navigation
- **Search Messages** (to be implemented)
  - Location: Left sidebar
  - Action: Filter conversations
  - Current: Search input with aria-label
- **Jump to Date** (to be implemented)
  - Location: Message thread toolbar
  - Action: Navigate to specific date
  - Current: Icon button with aria-label
- **Mark All Read** (to be implemented)
  - Location: Conversation toolbar
  - Action: Mark all messages as read
  - Current: Icon button with aria-label

### Navigation Routes
- `/` - Home/Landing page
- `/messages` - Messages list (stub page created)
- `/receipts` - Message receipts (stub page created)  
- `/evidence` - Evidence viewer (stub page created)
- `/settings` - User settings (stub page created)

## Admin Insights Actions

### Dashboard Controls
- **Metrics View** - System metrics and KPIs
- **Traces View** - Request tracing and debugging
- **Witnesses View** - Witness node monitoring
- **Export Data** (to be implemented)
  - Location: Dashboard toolbar
  - Action: Export metrics to CSV/JSON
  - Current: Icon button with aria-label
- **Date Range Picker** (to be implemented)
  - Location: Dashboard header
  - Action: Select time period
  - Current: Input with aria-label
- **Chart Series Toggle** (to be implemented)
  - Location: Chart legends
  - Action: Show/hide data series
  - Current: Checkbox with aria-label

### Navigation Routes
- `/` - Dashboard home
- `/metrics` - Metrics dashboard (stub page created)
- `/traces` - Tracing interface (stub page created)
- `/witnesses` - Witness monitoring (stub page created)

## Dev Portal Actions

### Code Examples
- **Language Toggle** (JavaScript/Python/cURL)
  - Location: Code example tabs
  - Action: Switch between language examples
  - Current: Tab-style buttons with aria-selected
  - Hotkeys: Arrow keys for navigation
- **Copy to Clipboard** (`data-testid="copy-code-button"`)
  - Location: Code blocks
  - Action: Copy code example to clipboard
  - Current: Icon button with Copy icon and aria-label

### Search & Navigation
- **Command Palette** (`data-testid="command-palette-button"`)
  - Location: Header area
  - Action: Open global search and navigation
  - Current: Button with ⌘K shortcut
  - Hotkeys: Ctrl/Cmd+K (global)
- **Search Documentation** (to be implemented)
  - Location: Docs pages
  - Action: Search within documentation
  - Current: Search input with aria-label
- **Edit This Page** (to be implemented)
  - Location: Documentation pages
  - Action: Open source file for editing
  - Current: Link with aria-label

### Plugin Actions
- **Install Plugin** (to be implemented)
  - Location: Plugin cards
  - Action: Install plugin package
  - Current: Button with aria-label
- **Try in Sandbox** (to be implemented)
  - Location: Plugin cards
  - Action: Open sandbox environment
  - Current: Button with aria-label

### Navigation Routes
- `/` - Portal home with code examples
- `/docs` - Documentation (stub page created)
- `/sdk` - SDK reference (stub page created)
- `/examples` - Code examples (stub page created)

## Design System Components

### Existing Components
- **Button** (`@atlas/design-system`)
  - Variants: default, destructive, outline, secondary, ghost, link
  - Sizes: default, sm, lg, icon
  - States: hover, focus, disabled, loading
  - Accessibility: ARIA attributes, keyboard navigation, ≥24×24px targets

- **CommandPalette** (`@atlas/design-system`)
  - Global search and navigation (Ctrl/Cmd+K)
  - Keyboard navigable with ARIA combobox/listbox semantics
  - Categories and shortcuts support
  - Focus management and escape handling

### Required Components (to be implemented)
- **Card** - Container component with elevation
- **Input** - Form input wrapper with validation states
- **Badge** - Status indicators with semantic colors
- **Tooltip** - Contextual help text with proper positioning
- **Dialog** - Overlay dialogs with focus trapping
- **TabNav** - Navigation tabs with keyboard support
- **DataTable** - Virtualized data tables with sorting
- **Skeleton** - Loading states with shimmer animation
- **Toast** - Notification system with auto-dismiss
- **Menu** - Dropdown menus with keyboard navigation
- **Popover** - Contextual overlays with arrow positioning

## Accessibility Requirements

### Focus Management
- All interactive elements must have visible focus indicators
- Focus rings must meet 3:1 contrast ratio against adjacent colors
- Tab order must be logical and predictable
- Focus trapped in modals and dropdowns

### Target Sizes
- Minimum 24×24px for all clickable targets
- Icon-only buttons must have accessible names via aria-label
- Touch targets should be 44×44px minimum on mobile
- Spacing exceptions allowed with proper documentation

### Keyboard Navigation
- All actions must be keyboard accessible
- Standard shortcuts (Ctrl+K for search, Enter for send, etc.)
- Escape key closes modals and dropdowns
- Arrow keys navigate within components (tabs, menus, etc.)

### Screen Reader Support
- All interactive elements need `aria-label` or `aria-labelledby`
- Form fields need proper labeling and error states
- Status messages use `role="status"` or `role="alert"`
- Live regions for dynamic content updates
- Proper heading hierarchy (h1 → h2 → h3, no skipping)

## Motion & Animation

### Performance
- All animations must respect `prefers-reduced-motion`
- Micro-interactions: 120-200ms duration
- Page transitions: 200-320ms duration
- Use transform and opacity for smooth 60fps animations
- No animations that block user input

### Guidelines
- Easing: cubic-bezier(0.2, 0, 0, 1)
- Hover/focus: 120ms
- Page/overlay: 200-320ms
- Loading states: skeleton screens preferred over spinners
- Reduce motion: replace animations with fade/scale

## Data Attributes

### Test IDs (Required)
All interactive elements must have stable `data-testid` attributes:
- `send-message-button` - Send message button
- `draft-message-button` - Draft message button
- `refresh-connection` - Refresh connection button
- `copy-{msg.id}` - Copy message ID buttons
- `message-input` - Message textarea
- `connection-indicator` - Connection status indicator
- `command-palette-button` - Command palette trigger
- `copy-code-button` - Code copy buttons
- `language-tab-{lang}` - Language selection tabs

## Migration Rules

### Preservation Requirements
1. **No Deletion**: Never remove existing actions or buttons
2. **Overflow Strategy**: Move to "More…" menu if space constrained
3. **Label Preservation**: Maintain clear, descriptive labels
4. **Functionality**: Preserve all current behaviors and workflows
5. **Accessibility**: Maintain or improve current a11y standards
6. **Hotkeys**: Preserve all keyboard shortcuts

### Reorganization Guidelines
- Group related actions logically
- Use consistent iconography across apps
- Provide clear visual hierarchy
- Maintain discoverability through design patterns
- Document any relocations in this contract

## Quality Gates

### Performance
- Per-route JS bundle ≤ 300KB gzipped (Basic)
- Per-route JS bundle ≤ 250KB gzipped (Pro)
- Lighthouse Performance ≥ 90 (Basic) / ≥ 95 (Pro)
- No console errors
- LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms

### Accessibility  
- Lighthouse Accessibility ≥ 95
- WCAG 2.2 AA compliance
- Keyboard navigation complete
- Screen reader compatible
- Target sizes ≥ 24×24px
- Color contrast ratio ≥ 4.5:1

### Functionality
- All existing actions preserved
- No broken workflows
- Consistent behavior across apps
- Production-ready stability
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

---

**Note**: This contract is binding for all UI changes. Any modifications must be documented here with migration paths for existing users. All actions listed here must be preserved or properly relocated with clear documentation.