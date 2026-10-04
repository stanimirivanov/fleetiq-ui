# 0002 - Keep asset preview navigation and data adapters platform-local

Status: accepted

## Context

The first contract-backed screen must run on web and native before a browser-safe identity flow or asset-detail endpoint exists. The shared asset contract supplies only identities and types. Web already has React Router; Expo needs native navigation.

## Options

- Use Expo Router for file-based native routes. Its navigation model is attractive, but the compatible dependency set currently broadens the peer graph and is not needed for two routes.
- Use React Navigation native stack with an explicit deep-link map. It adds a small app-level composition and keeps feature screens independent of navigation.
- Keep a single native screen. This avoids a dependency but cannot test the identity-to-detail navigation seam.

## Decision

Use React Router URLs for web identity and React Navigation native stack for mobile identity. Each app owns its screen, navigation, and fixture adapter. The shared package continues to own only transport types, parsers, and synthetic contract fixtures. The asset list takes an injected page loader; preview mode supplies that loader explicitly. No production adapter falls back to mock data.

Keep list data in feature-local request state for now. It has no cross-screen cache, subscription, or derived-state requirement. Introduce Effect, Atom, or a query cache only when a real feature demonstrates the need. The detail route is an identity-only placeholder and cannot assert current condition.

## Consequences and review trigger

The native stack and deep-link mapping must be checked on devices before release. Web cursor paging is supported; native paging remains deferred. Review the adapter and state ownership when production identity, multi-page native lists, asset detail, or live subscriptions arrive. Run contract-backed adapter tests, visible web state tests, TypeScript, dependency boundaries, and the Expo Android export in CI.

The common loader and tenant parser moved to a shared package in [decision 0003](0003-shared-asset-catalogue-boundary.md); platform preview transports remain separate.
