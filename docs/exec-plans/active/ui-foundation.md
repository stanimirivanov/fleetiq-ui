# UI foundation execution plan

Status: active
Milestone sequence: M01 - Decisions and Contracts; M02 - Product Foundation; M04 - Semantic Twin and Live UI

## Goal

Develop web and mobile in parallel without coupling UI delivery to backend timing. Keep both app shells buildable, then deliver contract-backed features as small end-to-end slices.

## Invariants

- Backend controls tenant, permissions, durable telemetry, and commands.
- Mock and live adapters use the same explicit contract; mock data never silently ships as live data.
- Shared code is platform-neutral and used by both apps.
- Each slice leaves pnpm check passing and states missing capability honestly.
- Light is the default until complete light and dark themes are supported on both platforms.

## Slices

1. **M01, completed - scaffold and harness.** Boot both shells; pin tools; add architectural and documentation maps, deterministic import/doc checks, CI, and offline design reference.
2. **M01, completed - contract and fixture seam.** Pin the backend OpenAPI baseline, generate transport types, parse untrusted responses, add web MSW and a native fixture adapter, and detect artifact/fixture drift.
3. **M04, completed - asset identity and list preview.** Show contract-backed asset identifiers on both platforms with loading, empty, error, unknown-condition, and unconnected states; add platform-specific navigation.
4. **M02, completed - light theme foundation.** Replace the temporary dark-only palette with semantic light tokens on web and native, select light browser and system chrome, and check token parity and text contrast.
5. **M02, this PR - complete dark theme.** Define all dark tokens and status states, choose user/system preference precedence and persistence, add a theme control, and validate both themes on web and native. Light remains the first-run default; device review is tracked separately.
6. **M04 - production catalogue connection.** Choose browser-safe identity and API transport with the backend, wire tenant-scoped authorization and live list paging, and validate native device navigation. This remains dependent on backend identity decisions.
7. **M04 - live asset detail.** Show semantic hierarchy, property provenance, and freshness; add subscription/reconnect behavior once backend events are available.

Future map, alert, command, and analytics slices require separate product specs and issues. The backend schedule may change slice order; update this plan with the reason rather than pretending a dependency is ready.

## Decisions and verification

React plus Expo is chosen for shared language, contracts, and pure behavior. Web uses React Router and Tailwind; native uses React Navigation and React Native primitives. Effect/Atom and form libraries enter when real features exercise their value. The backend owns the pinned contract; see [api-contract](../../../packages/api-contract/README.md). Theme roles and light-first sequencing are recorded in [decision 0004](../../design-docs/0004-light-first-theme.md); [decision 0005](../../design-docs/0005-theme-preference.md) records preference precedence and persistence. Run pnpm check for every slice; add fixture, interaction, and device checks with their owning features. Record drift or deferred native validation in the debt tracker and issue.
