# Knip report

## Unused files (31)

* apps/web/src/components/ChatMessage.tsx
* apps/web/src/components/IntegrityBadge.tsx
* apps/web/src/components/WitnessAttestationsModal.tsx
* apps/web/src/components/layout/Header.tsx
* apps/web/src/components/layout/Navigation.tsx
* apps/web/src/components/ui/Textarea.tsx
* apps/web/src/lib/atlas-client.ts
* cluster-server.js
* docs/sdk/atlas-sdk-example.js
* http2-proxy.js
* k6-cloud-v14.js
* k6-hard-target-v12.6.js
* k6-hard-target.js
* k6-performance-optimized.js
* k6-performance-test-optimized.js
* k6-performance-test.js
* k6-v14-constant-arrival-rate.js
* k6-v14-dual-service-test.js
* k6-v14-priming-test.js
* packages/fabric-protocol/src/api.d.ts
* packages/fabric-protocol/src/api.ts
* packages/fabric-protocol/src/index.d.ts
* packages/fabric-protocol/src/types.d.ts
* packages/fabric-protocol/src/types.ts
* proxy-native.js
* proxy-optimized.js
* proxy-simple.js
* scripts/ci/apply_fixes.mjs
* scripts/ci/parse_ci_log.mjs
* server-optimized.js
* tests/performance/atlas-load-test.js

## Unused dependencies (37)

| Name                                      | Location                                 | Severity |
| :---------------------------------------- | :--------------------------------------- | :------- |
| zod                                       | packages/fabric-client/package.json:20:6 | error    |
| @opentelemetry/auto-instrumentations-node | services/witness-node/package.json:25:6  | error    |
| @opentelemetry/instrumentation-fastify    | services/witness-node/package.json:30:6  | error    |
| @opentelemetry/instrumentation-http       | services/witness-node/package.json:29:6  | error    |
| @opentelemetry/instrumentation-pino       | services/witness-node/package.json:31:6  | error    |
| @opentelemetry/semantic-conventions       | services/witness-node/package.json:33:6  | error    |
| @opentelemetry/exporter-prometheus        | services/witness-node/package.json:27:6  | error    |
| @opentelemetry/exporter-otlp-http         | services/witness-node/package.json:26:6  | error    |
| @opentelemetry/instrumentation            | services/witness-node/package.json:28:6  | error    |
| @opentelemetry/resources                  | services/witness-node/package.json:32:6  | error    |
| @opentelemetry/sdk-node                   | services/witness-node/package.json:24:6  | error    |
| @opentelemetry/api                        | services/witness-node/package.json:23:6  | error    |
| pino-pretty                               | services/witness-node/package.json:20:6  | error    |
| @opentelemetry/auto-instrumentations-node | services/gateway/package.json:27:6       | error    |
| @opentelemetry/instrumentation-fastify    | services/gateway/package.json:32:6       | error    |
| @opentelemetry/instrumentation-http       | services/gateway/package.json:31:6       | error    |
| @opentelemetry/instrumentation-pino       | services/gateway/package.json:33:6       | error    |
| @opentelemetry/semantic-conventions       | services/gateway/package.json:35:6       | error    |
| @opentelemetry/exporter-prometheus        | services/gateway/package.json:29:6       | error    |
| @opentelemetry/exporter-otlp-http         | services/gateway/package.json:28:6       | error    |
| @opentelemetry/instrumentation            | services/gateway/package.json:30:6       | error    |
| @opentelemetry/resources                  | services/gateway/package.json:34:6       | error    |
| @opentelemetry/sdk-node                   | services/gateway/package.json:26:6       | error    |
| @atlas/fabric-client                      | services/gateway/package.json:17:6       | error    |
| @opentelemetry/api                        | services/gateway/package.json:25:6       | error    |
| pino-pretty                               | services/gateway/package.json:23:6       | error    |
| @headlessui/react                         | apps/admin/package.json:24:6             | error    |
| lucide-react                              | apps/admin/package.json:27:6             | error    |
| recharts                                  | apps/admin/package.json:29:6             | error    |
| clsx                                      | apps/admin/package.json:26:6             | error    |
| @atlas/fabric-protocol                    | apps/web/package.json:19:6               | error    |
| @atlas/fabric-client                      | apps/web/package.json:18:6               | error    |
| @radix-ui/react-slot                      | apps/web/package.json:23:6               | error    |
| @headlessui/react                         | apps/web/package.json:20:6               | error    |
| @heroicons/react                          | apps/web/package.json:21:6               | error    |
| compression                               | apps/web/package.json:28:6               | error    |
| date-fns                                  | apps/web/package.json:29:6               | error    |

## Unused devDependencies (12)

| Name                             | Location                                | Severity |
| :------------------------------- | :-------------------------------------- | :------- |
| ts-jest                          | services/witness-node/package.json:43:6 | error    |
| ts-jest                          | services/gateway/package.json:44:6      | error    |
| @typescript-eslint/eslint-plugin | apps/admin/package.json:38:6            | error    |
| @typescript-eslint/parser        | apps/admin/package.json:39:6            | error    |
| @typescript-eslint/eslint-plugin | apps/web/package.json:54:6              | error    |
| @typescript-eslint/parser        | apps/web/package.json:55:6              | error    |
| @storybook/addon-vitest          | apps/web/package.json:46:6              | error    |
| @storybook/addon-a11y            | apps/web/package.json:40:6              | error    |
| @storybook/addon-docs            | apps/web/package.json:41:6              | error    |
| @storybook/blocks                | apps/web/package.json:47:6              | error    |
| @storybook/test                  | apps/web/package.json:50:6              | error    |
| dependency-cruiser               | package.json:39:6                       | error    |

## Unlisted dependencies (10)

| Name                                      | Location                                | Severity |
| :---------------------------------------- | :-------------------------------------- | :------- |
| @opentelemetry/auto-instrumentations-node | packages/fabric-client/src/telemetry.ts | error    |
| @opentelemetry/semantic-conventions       | packages/fabric-client/src/telemetry.ts | error    |
| @opentelemetry/exporter-prometheus        | packages/fabric-client/src/telemetry.ts | error    |
| @opentelemetry/exporter-otlp              | packages/fabric-client/src/telemetry.ts | error    |
| @opentelemetry/resources                  | packages/fabric-client/src/telemetry.ts | error    |
| @opentelemetry/sdk-node                   | packages/fabric-client/src/telemetry.ts | error    |
| @opentelemetry/api                        | packages/fabric-client/src/telemetry.ts | error    |
| @atlas/fabric-protocol                    | tests/chaos/fault-tolerance.test.ts     | error    |
| @atlas/fabric-protocol                    | tests/integration/quorum.test.ts        | error    |
| @atlas/fabric-client                      | tests/integration/quorum.test.ts        | error    |

## Unlisted binaries (5)

| Name           | Location                                      | Severity |
| :------------- | :-------------------------------------------- | :------- |
| lighthouse     | .github/workflows/atlas-v14-oidc-cloudrun.yml | error    |
| gcloud         | .github/workflows/atlas-v14-oidc-cloudrun.yml | error    |
| test:e2e       | .github/workflows/ci-build-test.yml           | error    |
| docker-compose | package.json                                  | error    |
| helm           | package.json                                  | error    |

## Unresolved imports (2)

| Name                                                                 | Location     | Severity |
| :------------------------------------------------------------------- | :----------- | :------- |
| @typescript-eslint/eslint-config-recommended-requiring-type-checking | .eslintrc.js | error    |
| @typescript-eslint/eslint-config-recommended                         | .eslintrc.js | error    |

## Unused exports (11)

| Name                   | Location                                     | Severity |
| :--------------------- | :------------------------------------------- | :------- |
| SelectScrollDownButton | apps/web/src/components/ui/Select.tsx:156:24 | error    |
| SelectScrollUpButton   | apps/web/src/components/ui/Select.tsx:155:19 | error    |
| SelectSeparator        | apps/web/src/components/ui/Select.tsx:154:14 | error    |
| SelectGroup            | apps/web/src/components/ui/Select.tsx:148:10 | error    |
| SelectLabel            | apps/web/src/components/ui/Select.tsx:152:17 | error    |
| buttonVariants         | apps/web/src/components/ui/Button.tsx:50:17  | error    |
| badgeVariants          | apps/web/src/components/ui/Badge.tsx:36:16   | error    |
| CardFooter             | apps/web/src/components/ui/Card.tsx:78:27    | error    |
| AdminService           | apps/admin/src/lib/admin-client.ts:44:14     | error    |
| adminClient            | apps/admin/src/lib/admin-client.ts:11:14     | error    |
| withFeatureFlag        | apps/web/src/lib/features.ts:528:17          | error    |

## Unused exported types (7)

| Name               | Location                                    | Severity |
| :----------------- | :------------------------------------------ | :------- |
| ButtonProps        | apps/web/src/components/ui/Button.tsx:31:18 | error    |
| AtlasClientConfig  | packages/fabric-client/src/client.ts:26:18  | error    |
| BadgeProps         | apps/web/src/components/ui/Badge.tsx:26:18  | error    |
| InputProps         | apps/web/src/components/ui/Input.tsx:4:18   | error    |
| WitnessPerformance | apps/admin/src/lib/admin-client.ts:29:18    | error    |
| FeatureMetrics     | apps/web/src/lib/features.ts:39:18          | error    |
| FeatureFlag        | apps/web/src/lib/features.ts:12:18          | error    |

