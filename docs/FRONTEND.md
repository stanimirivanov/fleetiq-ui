# Frontend architecture

## TL;DR

Web and mobile ship together around shared backend contracts. React owns rendering, web routes own shareable state, Effect owns complex async streams when introduced, and Atom owns fine-grained derived state when a real feature needs it. Platform UI stays separate.

## Current state

The repository boots a Vite/React web shell and an Expo/React Native mobile shell. A shared package pins the partial backend OpenAPI baseline, generated transport types, runtime parsers, and synthetic fixtures. Web has opt-in MSW development handlers; mobile has an explicit fixture adapter. Both apps now have an asset identity list and identity-only route. They show contract-backed synthetic assets only in explicit development preview mode; production remains unconnected. There is no production API client, login, live data, or asset detail.

## State ownership

| State | Owner | Rule |
|:--|:--|:--|
| Server-owned data | Feature API adapter and local request state; add a query/cache layer when reuse or invalidation needs it | Avoid copying it into UI atoms. |
| Complex RPC, subscription, stream lifecycle | Effect | Introduce it when multi-request or stream coordination needs more than local cancellation/retry. |
| Granular derived UI state | Effect Atom | Introduce it with a real performance or coordination need; keep atoms feature-local. |
| Web navigation, shareable filters and selection | React Router URL | Parse and validate URL input; define stable defaults. |
| Mobile navigation state | Native navigation | Deep links use an explicit mapping to domain identifiers. |
| Form values, validation display and touched state | React Hook Form when the first form arrives | Server validation remains authoritative. |
| One-component interaction | React state | Prefer local state until sharing is justified. |

Do not add Redux Toolkit alongside Atom by default. A second global store adds competing ownership and synchronization work. If a future feature needs Redux's specific strengths, write a decision record and migrate ownership deliberately.

## API contract and mocking

The backend owns OpenAPI and future event schemas. The shared api-contract package pins one backend commit and generates transport types from its partial v1 OpenAPI artifact. Generated wire types are not domain models. Zod parsers validate unknown HTTP payloads at the boundary; future event payloads will need their own versioned parsers. The contract check verifies the artifact hash, generated output, fixture equality, parsers, mock-backed app adapters, and web catalogue behavior.

Web MSW starts only when VITE_API_MODE=mock is explicitly set during development. Add that value to an untracked apps/web/.env.local file or set it in the shell; production builds never start the worker. The native asset feature fixture adapter imports the same synthetic data and is invoked only when EXPO_PUBLIC_API_MODE=mock in development. Neither path represents a browser-safe login. No production path falls back silently to fixtures. See [the contract package](../packages/api-contract/README.md).

## Feature shape

Use a vertical feature directory under each app: model for pure client concepts, api for request/stream translation, and ui for platform views. Add folders only when needed. app composes routes, providers, and features. Shared packages may contain contract types, parsers, or pure behavior used on both platforms; they must not contain browser globals or native modules. Web and native map, charts, interaction, and accessibility often differ and belong in their owning apps.

## Testing and accessibility

Test pure model rules with unit tests, adapter parsing with contract fixtures, and user workflows through their visible UI. Cover loading, empty, partial, stale, offline, permission-denied, and error states where relevant. Give maps a list/table alternative, keep status meaning independent of color, preserve keyboard focus on web and screen-reader labels on both platforms. Native builds and interaction tests need a device/emulator before release.
