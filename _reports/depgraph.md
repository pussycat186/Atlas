# ATLAS Dependency Graph

## Package Dependencies

```
atlas (root)
├── apps/web
│   ├── next@^14.0.0
│   ├── react@^18.0.0
│   ├── typescript@^5.3.0
│   └── @atlas/fabric-client (workspace)
├── apps/admin
│   ├── next@^14.0.0
│   ├── react@^18.0.0
│   ├── typescript@^5.3.0
│   └── @atlas/fabric-client (workspace)
├── services/gateway
│   ├── @atlas/fabric-protocol (workspace)
│   ├── @atlas/fabric-client (workspace)
│   ├── fastify@^4.24.3
│   ├── pino@^8.17.0
│   └── uuid@^9.0.1
├── services/witness-node
│   ├── @atlas/fabric-protocol (workspace)
│   ├── fastify@^4.24.3
│   ├── pino@^8.17.0
│   └── fs-extra@^11.2.0
├── packages/fabric-protocol
│   └── (no external dependencies)
└── packages/fabric-client
    └── @atlas/fabric-protocol (workspace)
```

## Workspace Dependencies

### Internal Dependencies
- `@atlas/fabric-client` → `@atlas/fabric-protocol`
- `services/gateway` → `@atlas/fabric-protocol` + `@atlas/fabric-client`
- `services/witness-node` → `@atlas/fabric-protocol`
- `apps/web` → `@atlas/fabric-client`
- `apps/admin` → `@atlas/fabric-client`

### External Dependencies
- **Fastify Ecosystem**: Used by gateway and witness services
- **Next.js Ecosystem**: Used by web and admin applications
- **Pino Logging**: Used by all services
- **TypeScript**: Used by all packages

## Build Order
1. `packages/fabric-protocol` (no dependencies)
2. `packages/fabric-client` (depends on fabric-protocol)
3. `services/gateway` (depends on both packages)
4. `services/witness-node` (depends on fabric-protocol)
5. `apps/web` (depends on fabric-client)
6. `apps/admin` (depends on fabric-client)

## Circular Dependencies
- None detected

## Unused Dependencies
- Analysis pending (knip failed due to YAML syntax error)
