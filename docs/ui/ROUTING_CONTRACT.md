# Atlas Routing Contract

**Version**: 2.0  
**Last Updated**: 2025-09-20T15:45:00Z  
**Scope**: Navigation and routing across all Atlas applications

## Overview

This document maps all navigation items (left menu, command palette, breadcrumbs) to actual routes and their status. All routes must return 200 OK or redirect to valid pages. No 404 errors are acceptable in production.

## Production Base URLs

- **Proof Messenger**: https://atlas-proof-messenger.vercel.app
- **Admin Insights**: https://atlas-admin-insights.vercel.app  
- **Dev Portal**: https://atlas-dev-portal.vercel.app

## Proof Messenger Routes

| Route | Status | Description | Navigation Location | File Path |
|-------|--------|-------------|-------------------|-----------|
| `/` | ✅ 200 | Home/Landing page | Main entry point | `apps/proof-messenger/src/app/page.tsx` |
| `/messages` | ✅ 200 | Messages list | Left menu, Command palette | `apps/proof-messenger/src/app/messages/page.tsx` |
| `/receipts` | ✅ 200 | Message receipts | Left menu, Command palette | `apps/proof-messenger/src/app/receipts/page.tsx` |
| `/evidence` | ✅ 200 | Evidence viewer | Left menu, Command palette | `apps/proof-messenger/src/app/evidence/page.tsx` |
| `/settings` | ✅ 200 | User settings | Left menu, Command palette | `apps/proof-messenger/src/app/settings/page.tsx` |

### Navigation Structure
```
Proof Messenger
├── Home (/)
├── Messages (/messages)
├── Receipts (/receipts)  
├── Evidence (/evidence)
└── Settings (/settings)
```

## Admin Insights Routes

| Route | Status | Description | Navigation Location | File Path |
|-------|--------|-------------|-------------------|-----------|
| `/` | ✅ 200 | Dashboard home | Main entry point | `apps/admin-insights/src/app/page.tsx` |
| `/metrics` | ✅ 200 | Metrics dashboard | Left menu, Command palette | `apps/admin-insights/src/app/metrics/page.tsx` |
| `/traces` | ✅ 200 | Tracing interface | Left menu, Command palette | `apps/admin-insights/src/app/traces/page.tsx` |
| `/witnesses` | ✅ 200 | Witness monitoring | Left menu, Command palette | `apps/admin-insights/src/app/witnesses/page.tsx` |

### Navigation Structure
```
Admin Insights
├── Dashboard (/)
├── Metrics (/metrics)
├── Traces (/traces)
└── Witnesses (/witnesses)
```

## Dev Portal Routes

| Route | Status | Description | Navigation Location | File Path |
|-------|--------|-------------|-------------------|-----------|
| `/` | ✅ 200 | Portal home | Main entry point | `apps/dev-portal/src/app/page.tsx` |
| `/docs` | ✅ 200 | Documentation | Left menu, Command palette | `apps/dev-portal/src/app/docs/page.tsx` |
| `/sdk` | ✅ 200 | SDK reference | Left menu, Command palette | `apps/dev-portal/src/app/sdk/page.tsx` |
| `/examples` | ✅ 200 | Code examples | Left menu, Command palette | `apps/dev-portal/src/app/examples/page.tsx` |

### Navigation Structure
```
Dev Portal
├── Home (/)
├── Documentation (/docs)
├── SDK (/sdk)
└── Examples (/examples)
```

## Command Palette Routes

### Global Navigation (Ctrl/Cmd+K)
- **Go to Messages** → `/messages` (Proof Messenger)
- **Go to Receipts** → `/receipts` (Proof Messenger)
- **Go to Evidence** → `/evidence` (Proof Messenger)
- **Go to Settings** → `/settings` (Proof Messenger)
- **Go to Metrics** → `/metrics` (Admin Insights)
- **Go to Traces** → `/traces` (Admin Insights)
- **Go to Witnesses** → `/witnesses` (Admin Insights)
- **Go to Documentation** → `/docs` (Dev Portal)
- **Go to SDK** → `/sdk` (Dev Portal)
- **Go to Examples** → `/examples` (Dev Portal)

### Quick Actions
- **Copy JavaScript Example** → Copy JS code example (Dev Portal)
- **Copy Python Example** → Copy Python code example (Dev Portal)
- **Copy cURL Example** → Copy cURL command example (Dev Portal)
- **Refresh Connection** → Refresh network connection (Proof Messenger)
- **Export Data** → Export dashboard data (Admin Insights)

## Route Implementation Status

### ✅ Implemented Routes
All routes listed above are implemented and return 200 OK responses.

### 🔧 Implementation Details

#### Stub Pages Created
The following minimal pages were created to ensure no 404 errors:
- `apps/proof-messenger/src/app/messages/page.tsx`
- `apps/proof-messenger/src/app/receipts/page.tsx`
- `apps/proof-messenger/src/app/evidence/page.tsx`
- `apps/proof-messenger/src/app/settings/page.tsx`
- `apps/admin-insights/src/app/metrics/page.tsx`
- `apps/admin-insights/src/app/traces/page.tsx`
- `apps/admin-insights/src/app/witnesses/page.tsx`
- `apps/dev-portal/src/app/docs/page.tsx`
- `apps/dev-portal/src/app/sdk/page.tsx`
- `apps/dev-portal/src/app/examples/page.tsx`

#### Page Structure
Each stub page follows this pattern:
```tsx
export default function PageName() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Page Title</h1>
      <p>Page description - App Name</p>
      {/* Future content will be added here */}
    </div>
  );
}
```

## Navigation Components

### Left Menu Structure
Each app maintains a consistent left navigation:
- Home/Dashboard link
- Primary feature links
- Settings/Configuration link
- Theme toggle (where applicable)

### Command Palette Structure
Global search and navigation (Ctrl/Cmd+K):
1. **Navigation** - All available routes
2. **Actions** - Quick actions (copy, search, refresh, etc.)
3. **Search** - Full-text search across content
4. **Shortcuts** - Keyboard shortcuts display

### Breadcrumb Navigation
For multi-level content:
- Home > Section > Page
- Clear hierarchy with clickable ancestors
- Current page highlighted
- Accessible navigation landmarks

## Accessibility Requirements

### Keyboard Navigation
- **Tab** - Navigate between interactive elements
- **Enter/Space** - Activate buttons and links
- **Arrow Keys** - Navigate menu items and tabs
- **Escape** - Close modals and dropdowns
- **Ctrl/Cmd+K** - Open command palette
- **Home/End** - Navigate to start/end of lists

### Screen Reader Support
- All navigation items have proper `aria-label` attributes
- Current page indicated with `aria-current="page"`
- Navigation landmarks use `<nav>` with `aria-label`
- Command palette uses `role="dialog"` with proper focus management
- Skip links for keyboard users

### Focus Management
- Focus visible on all interactive elements
- Logical tab order throughout navigation
- Focus trapped in modals and dropdowns
- Focus restored when closing overlays

## Performance Requirements

### Route Loading
- Initial route load ≤ 300KB gzipped JS (Basic)
- Initial route load ≤ 250KB gzipped JS (Pro)
- Subsequent routes ≤ 150KB gzipped JS
- Lazy loading for non-critical routes
- Prefetching for likely next routes

### Navigation Response
- Menu interactions ≤ 100ms response time
- Route transitions ≤ 300ms
- Command palette search ≤ 200ms
- No layout shift during navigation
- Skeleton loading for async content

## Error Handling

### 404 Prevention
- All navigation items must link to valid routes
- Stub pages created for missing routes
- Redirect fallbacks for moved routes
- Graceful degradation for offline scenarios

### Error States
- Network errors show retry options
- Invalid routes redirect to home
- Broken links provide helpful error messages
- Offline mode preserves navigation structure
- Custom 404 page with helpful navigation

## Testing Requirements

### Production Validation
- All routes return 200 OK (or valid redirects)
- No 404 errors in navigation
- Command palette finds all routes
- Keyboard navigation complete
- Screen reader compatibility verified
- Cross-browser functionality tested

### Automated Tests
- Route accessibility tests
- Navigation interaction tests
- Command palette functionality tests
- Keyboard navigation tests
- Performance benchmarks
- Visual regression tests

## Future Route Additions

### Planned Routes
- `/plugins` - Plugin registry (Dev Portal)
- `/sandbox` - Development sandbox (Dev Portal)
- `/api` - Interactive API explorer (Dev Portal)
- `/admin/users` - User management (Admin Insights)
- `/admin/audit` - Audit logs (Admin Insights)
- `/conversations` - Conversation list (Proof Messenger)
- `/search` - Message search (Proof Messenger)

### Route Naming Conventions
- Use kebab-case for multi-word routes
- Keep routes descriptive but concise
- Maintain consistency across apps
- Document all route additions in this contract

---

**Note**: This routing contract ensures zero navigation errors in production. All routes must be validated before deployment. Any route additions or changes must be documented here with proper accessibility and performance considerations.