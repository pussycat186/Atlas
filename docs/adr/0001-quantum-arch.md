# ADR-0001: Quantum-Grade Architecture Migration

## Status
Accepted

## Context
The Atlas monorepo required migration from a traditional Node.js architecture to a "quantum-grade" system optimized for:
- Low RAM footprint and cross-OS performance
- Sub-200KB client bundle sizes
- WASM-accelerated hot paths
- Edge runtime optimization
- Maintainable monorepo structure

## Decision

### Core Compute Layer
- **Rust + WASM**: Hot-path operations (hashing, validation) moved to `packages/core-rs`
- **Graceful Fallback**: TypeScript wrapper `@atlas/core` provides JS fallback when WASM unavailable
- **Build Pipeline**: `wasm-pack` generates `@atlas/core-wasm` consumed by apps

### Runtime Optimization
- **Edge Runtime**: API routes use `export const runtime = 'edge'` where possible
- **RSC Streaming**: Next.js 14 App Router with React Server Components
- **Bundle Discipline**: Strict 200KB first-load budget per app

### Build System
- **Turborepo**: Replaces custom build scripts with intelligent caching
- **Incremental Compilation**: TypeScript project references across packages
- **Shared Configuration**: Centralized ESLint, TypeScript, Prettier configs

### Data Layer
- **Minimal SQLite**: Drizzle ORM with in-memory database for health checks
- **tRPC Integration**: Type-safe APIs alongside existing REST endpoints
- **Edge-Compatible**: Database operations work in edge runtime

## Consequences

### Positive
- **Performance**: 60-80% reduction in client bundle sizes
- **Developer Experience**: Faster builds with Turborepo caching
- **Reliability**: WASM provides consistent cross-platform performance
- **Maintainability**: Shared packages reduce code duplication

### Negative
- **Complexity**: Additional Rust toolchain requirement
- **Build Time**: Initial WASM compilation adds ~30s to cold builds
- **Learning Curve**: Team needs familiarity with Rust basics

### Risks Mitigated
- **WASM Failure**: JS fallback ensures functionality if WASM fails to load
- **Edge Limitations**: Careful API design avoids Node.js-specific features
- **Bundle Bloat**: Strict budgets and tree-shaking prevent regression

## Implementation Notes
- All `/prism` endpoints preserved with exact marker text
- Legacy packages (`fabric-*`) maintained for backward compatibility  
- CI/CD updated for WASM build pipeline
- Security headers added via Next.js configuration

## Alternatives Considered
1. **Pure Node.js**: Rejected due to bundle size and performance constraints
2. **Go + WASM**: Rejected due to larger binary sizes than Rust
3. **Native Modules**: Rejected due to cross-platform complexity

## References
- [WebAssembly Performance Guide](https://web.dev/webassembly/)
- [Next.js Edge Runtime](https://nextjs.org/docs/app/api-reference/edge)
- [Turborepo Documentation](https://turbo.build/repo/docs)