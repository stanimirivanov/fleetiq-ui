# SIM-PR19 connected development routing

Status: active (in review)
Milestone: M02 - Product Foundation
Issue: #132

## Goal

Provide the UI-owned development contract consumed by the later demo reload overlay.

## Scope

Opt-in Vite origin/host/WebSocket configuration, fail-closed API boundary,
synthetic real-browser regression and the connected development runbook.

## Design decisions

Repository bookkeeping groups development tooling under M02; the delivery task
remains SIM-PR19 and is not hardware acceptance. Use existing Vite 8 `server.ws`, explicit client port and exact owned origins.
Keep API, TLS, cookies and SSE with the edge/backend. Do not put credentials or
backend addresses in UI configuration. Permit HTTP only on loopback fixtures.
Production preview, build and tests do not inherit the opt-in. Keep the normal
browser lane independent of operator configuration. No new dependency is needed.

## Acceptance criteria

- Origin rejection and production/preview/test isolation are mechanically tested.
- Direct API requests cannot become successful SPA responses.
- Synthetic browser proves session/logout, SSE and HMR on one origin without reload.
- Existing production payload, strict typing and browser quality gates remain required.

## Acceptance evidence

TDD: missing-helper/config and browser-fixture tests failed before implementation;
the preview-isolation control failed before its guard was added. Focused Vite and
real-browser smoke tests passed. Final canonical results and source-bound receipts
are recorded in the issue/PR; CI remains required for merge.

## Out of scope

SIM-PR20 installed HTTPS/development composition, real OIDC/hardware qualification,
SIM-PR18 completion, application API changes, publication and environment promotion.
