# Architecture

## TL;DR

FleetIQ UI has two apps, an asset identity preview on each, and a shared, pinned backend contract package. It does not yet have live backend integration. Features own their models, API adapters, and views; the app layer composes them. Shared packages stay platform-neutral.

The backend contract feeds separate web and mobile API adapters. Each adapter validates wire data for its feature. The app shells compose features. The shared contract package feeds both app adapters without importing their presentation code.

## Repository topology

- apps/web: React, React Router, Vite, Tailwind CSS. Its src/app is composition and route wiring; src/features contains vertical product capabilities.
- apps/mobile: Expo/React Native. Its App.tsx composes React Navigation; features follow the same domain names as web where useful.
- packages/: api-contract holds the backend OpenAPI snapshot, generated wire types, runtime parsers, and synthetic fixtures used by both apps. A package cannot import either app or a platform UI framework. See [package guidance](packages/README.md).
- tools/: deterministic repository checks.
- docs/: canonical guides, product specs, decisions, and execution state.

A feature's preferred internal shape is model (pure client rules), api (transport and runtime validation), and ui (platform presentation). Add only the folders the feature needs. A feature may depend on shared code and its own files. Cross-feature interaction goes through an explicitly reviewed public interface or app composition; never import private feature internals.

## Dependency and trust direction

The app shell composes features. UI depends on feature models, while feature models must not depend on UI, networking, DOM, or native APIs. API adapters translate untrusted wire payloads into validated client values. The backend remains authoritative for tenant scope, permissions, telemetry, commands, and durable state. Client checks improve experience but are not authorization.

The architecture gate uses dependency-cruiser to reject cross-app and inward-direction violations in both apps and packages. [Workspace tooling decision 0001](docs/design-docs/0001-workspace-tooling.md) records why Nx is deferred and the limits of the current gate. See [docs/FRONTEND.md](docs/FRONTEND.md) for state ownership and contract strategy. An import check proves structural direction, not domain correctness; reviewers still inspect boundaries and behavior.

## Evolution

Do not create a single universal component library. Share contracts and pure behavior first; share UI only when web and native have a real compatible interaction pattern. Record durable decisions in [docs/design-docs](docs/design-docs/index.md). The active [execution plan](docs/exec-plans/active/ui-foundation.md) tracks the next slices.
