# ADR 0003: Pin the backend asset catalogue contract before rendering it

Status: accepted, amended 7 October 2026

## Context

The backend now publishes an OpenAPI 3.1 UI baseline for version discovery and
a bounded tenant asset catalogue. FleetIQ UI needs stable test payloads while
the backend and web app evolve in parallel. The protected route currently uses
a single-principal workload bearer secret, not a browser-safe sign-in flow.

TypeScript 7.0 does not provide the programmatic compiler API required by
`openapi-typescript`. That limitation is specific to that generator:
`@effect/openapi-generator` 4.0.1 can generate Effect v4 code from the pinned
specification without that API, and its output typechecks with TypeScript 7.0.2.

## Decision

The initial slice used a maintained Effect Schema projection. This amendment
adopts generation after verifying the official Effect generator with TypeScript
7.0.2; the original implementation is recorded in the
[completed contract plan](../exec-plans/completed/2026-10-asset-contract-typescript-7.md).
The [generator follow-up](../exec-plans/completed/2026-10-effect-openapi-generation.md)
records the amendment implementation and checks.

Pin the exact backend contract artifact and revision in `contracts/http`.
Generate a schema-backed Effect HTTP client and wire types from that snapshot
into `apps/web/src/generated/fleetiq-api.ts`. The generated `AssetPage` schema
validates unknown page payloads at the transport boundary. Maintain
feature-specific cross-field checks for the requested tenant, unique assets,
page size, and advancing cursor before building the asset feature model. The
published 200 response example and deterministic fixtures must pass the same
boundary tests.

Expose a feature-facing catalogue reader and an import-only fixture adapter.
The production application remains unconnected. Local development now uses
explicitly labelled sample mode: the overview shows a separate synthetic
operational projection by default, and the asset catalogue requires
`?preview=sample`. Contract-shaped catalogue pages still use the validated
reader. Generated HTTP access waits for an approved browser identity flow and
must never embed the workload bearer secret.

## Consequences

Contract changes require an explicit snapshot update, regeneration, a
deterministic generated-output check, and reconciliation of feature-level
validation and tests. Generated schemas cover wire shape, but cannot enforce
request-specific tenancy or pagination rules. The current UI cannot claim
asset locations, health, telemetry, or a complete fleet count; none is
available in this contract.

## Alternatives considered

Using the workload bearer in a browser would expose a server credential and
misrepresent the authentication model. Hand-writing a live HTTP adapter now
would leave that problem unresolved. `openapi-typescript` would require an
older compiler for its AST API, and maintaining duplicate handwritten wire
schemas would create unnecessary contract drift.
