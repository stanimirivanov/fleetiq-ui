# Frontend architecture

## TL;DR

Web and mobile ship together around shared backend contracts. React owns rendering, web routes own shareable state, Effect owns complex async streams when introduced, and Atom owns fine-grained derived state when a real feature needs it. Platform UI stays separate.

## Current state

The repository currently boots a Vite/React web shell and an Expo/React Native mobile shell. It has no API client, mock server, login, live data, asset views, or shared package. The shells show an explicit unconnected state. Do not infer planned behavior from directory names.

## State ownership

| State | Owner | Rule |
|:--|:--|:--|
| Server-owned data | Feature API adapter and query/cache layer chosen with the first contract-backed feature | Avoid copying it into UI atoms. |
| Complex RPC, subscription, stream lifecycle | Effect | Introduce it with a tested cancellation/retry use case. |
| Granular derived UI state | Effect Atom | Introduce it with a real performance or coordination need; keep atoms feature-local. |
| Web navigation, shareable filters and selection | React Router URL | Parse and validate URL input; define stable defaults. |
| Mobile navigation state | Native navigation | Deep links use an explicit mapping to domain identifiers. |
| Form values, validation display and touched state | React Hook Form when the first form arrives | Server validation remains authoritative. |
| One-component interaction | React state | Prefer local state until sharing is justified. |

Do not add Redux Toolkit alongside Atom by default. A second global store adds competing ownership and synchronization work. If a future feature needs Redux's specific strengths, write a decision record and migrate ownership deliberately.

## API contract and mocking

The backend owns OpenAPI and event schemas. Frontend work consumes a versioned contract artifact and generates transport types/client code in a dedicated package; generated files are never the domain model. Validate external payloads at the adapter boundary, especially timestamps, identifiers, units, nullability, tenant scope, and versioned events. Use MSW to serve contract-conforming fixtures to web feature tests and development. Mobile should use the same fixtures through a platform-neutral fixture/adapter seam rather than a browser service worker. No production code should silently fall back to mock data.

This work is the next PR slice, not implemented by the scaffold. Contract changes require fixture checks and explicit compatibility review.

## Feature shape

Use a vertical feature directory under each app: model for pure client concepts, api for request/stream translation, and ui for platform views. Add folders only when needed. app composes routes, providers, and features. Shared packages may contain contract types, parsers, or pure behavior used on both platforms; they must not contain browser globals or native modules. Web and native map, charts, interaction, and accessibility often differ and belong in their owning apps.

## Testing and accessibility

Test pure model rules with unit tests, adapter parsing with contract fixtures, and user workflows through their visible UI. Cover loading, empty, partial, stale, offline, permission-denied, and error states where relevant. Give maps a list/table alternative, keep status meaning independent of color, preserve keyboard focus on web and screen-reader labels on both platforms. Native builds and interaction tests need a device/emulator before release.
