# UI foundation execution plan

Status: active
Milestone sequence: M01 - Decisions and Contracts; M04 - Semantic Twin and Live UI

## Goal

Develop web and mobile in parallel without coupling UI delivery to backend timing. Keep both app shells buildable, then deliver contract-backed features as small end-to-end slices.

## Invariants

- Backend controls tenant, permissions, durable telemetry, and commands.
- Mock and live adapters use the same explicit contract; mock data never silently ships as live data.
- Shared code is platform-neutral and used by both apps.
- Each slice leaves pnpm check passing and states missing capability honestly.

## Slices

1. **M01, completed - scaffold and harness.** Boot both shells; pin tools; add architectural and documentation maps, deterministic import/doc checks, CI, and offline design reference.
2. **M01, this PR - contract and fixture seam.** Pin the backend OpenAPI baseline, generate transport types, parse untrusted responses, add web MSW and a native fixture adapter, and detect artifact/fixture drift.
3. **M04 - shared asset identity and list.** Show the same contract-backed asset identifiers and status on both platforms with loading/empty/error states; add platform-specific navigation. This slice also chooses the production API transport once browser-safe identity is available.
4. **M04 - live asset detail.** Show semantic hierarchy, property provenance, and freshness; add subscription/reconnect behavior once backend events are available.

Future map, alert, command, and analytics slices require separate product specs and issues. The backend schedule may change slice order; update this plan with the reason rather than pretending a dependency is ready.

## Decisions and verification

React plus Expo is chosen for shared language, contracts, and pure behavior. Web uses React Router and Tailwind; native uses React Native primitives. Effect/Atom and form libraries enter when real features exercise their value. The backend owns the pinned contract; see [api-contract](../../../packages/api-contract/README.md). Run pnpm check for every slice; add fixture, interaction, and device checks with their owning features. Record drift or deferred native validation in the debt tracker and issue.
