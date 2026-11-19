# Development signal-stream playback and freshness

## TL;DR

Add an explicitly synthetic, finite signal-stream playback to the asset inspector. It demonstrates scoped subscription lifecycle, revision and resnapshot behavior, and independent freshness without implying a browser-safe production signal service already exists.

Status: completed

Milestone: M04 - Semantic Twin and Live UI

## Goal

Let an operator inspect how a changing attributed signal behaves when the transport drops, samples arrive late or twice, a revision is missed, or the last reading becomes stale. Make source evidence and uncertainty legible without rerendering the whole inspector or moving focus.

## Scope

- Extend the sample asset inspector Overview with a named playback panel and controls for starting, stopping, and replaying a deterministic scenario.
- Keep the existing fixed inspector snapshot and historical chart distinct from playback state; never relabel the historical snapshot as live.
- Define a pure transport-neutral projection for revisioned snapshots and deltas, duplicate and gap handling, late event versus receipt time, and freshness at a virtual sample clock.
- Provide a development-only Effect v4 stream adapter/service with scoped cancellation and bounded reconnection after a simulated loss. Separate typed expected failures from defects.
- Reuse exact device, endpoint, decoded-signal, binding, and target identities from sample inspector data. Show no observation as missing evidence, not zero.
- Keep per-signal Solid updates local. Announce connection, resnapshot, and freshness transitions accessibly without announcing every reading or stealing focus.
- Add meaningful pure/service/component tests and Playwright journeys for playback, cancellation on navigation or selection, narrow layout, and production sample isolation.

## Design decisions

The backend has transport-independent live revision types but no browser-safe signal snapshot/stream API, subscription authentication, production materializer, or resnapshot endpoint. This slice is an interaction and lifecycle preview, not a production connection. The source adapter is development-only and must be replaceable by a backend-owned read/stream contract later.

Stream playback uses a fixed virtual clock and finite scripted events. Event time, receipt time, quality, transport state, and freshness are independent. A duplicate never increments the visible value, a late event cannot replace a newer event-time reading, and a revision gap requires a resnapshot before subsequent deltas can be trusted.

Effect v4 owns the asynchronous playback and interruption. Presentation TSX imports only a feature-facing service port, never Effect runtime modules. Playback controls remain local UI state; asset and component selection remain URL state.

## Acceptance criteria

- The development inspector visibly labels the finite stream as synthetic and leaves the fixed snapshot distinguishable.
- The scenario demonstrates a normal update, duplicate, late arrival, gap/resnapshot, bounded reconnect, and stale or missing evidence with accurate event and receipt timestamps.
- Selecting another component, changing tabs, navigating away, or stopping playback disposes the prior subscription; no late update leaks into the new view.
- Signal updates do not rerender unrelated cards or the overall inspector. Status announcements are limited to meaningful transitions.
- Production inspector remains unconfigured, including direct `preview=sample` URLs; sample stream code and data are absent from production behavior.
- Light/dark and narrow layouts remain keyboard usable without document-level horizontal overflow.
- `pnpm check` and production/development `pnpm e2e` suites pass; limitations and evidence are recorded.

## Out of scope

A real WebSocket/SSE transport, browser workforce identity, server fan-out, fleet-wide subscriptions, historical archive or replay product, alert lifecycle, configurable freshness policies, and production telemetry integration.

## Acceptance evidence

- `pnpm check` passed: Biome, TypeScript for web and Playwright, dependency boundaries, view-size policy, documentation links, design-token contrast, pinned contract, 3 Node tests, 76 Vitest tests, and production Vite build.
- `pnpm e2e` passed: 11 production and 17 development Chromium journeys. New scenarios cover normal playback, duplicate and gap indication, bounded reconnect and resnapshot, late and stale readings, replay, Stop, node/tab/navigation cleanup, missing trailer evidence, narrow dark layout, and production isolation.
- The production bundle contains no sample signal IDs, motor binding IDs, synthetic playback label, or sample rail asset name. A desktop inspector render was inspected; the narrow dark browser journey verifies no document-level horizontal overflow.
- Connected signal reads still require a browser-safe session, asset-scoped snapshot and stream contract, revisions, and a resnapshot endpoint. The preview remains finite and development-only.
