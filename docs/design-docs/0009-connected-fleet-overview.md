# 0009: Connected fleet overview

## TL;DR

The overview consumes the same validated baseline.20 fleet snapshot as the map.
Server-owned tenant counts, loaded-page locations and browser snapshot review age
have different scopes. Health, alerts and utilization remain unavailable. The
geographic preview is opt-in and owns no second SDK/runtime implementation.

## Context and decision

Product-plan PR 30 follows the merged geographic map workbench. Keep the approved
summary/map/discovery and coverage/operations panel hierarchy, using actual backend
capabilities instead of the sample dashboard's inferred operational conditions.

- App composition gates `/` with the same account-scoped browser session boundary
  as other protected routes. Tenant discovery includes the overview. A changed
  tenant resets coordinate mapping, filters, cursor and selection.
- `useFleetWorkspace` shares exact URL parsing, one cancellable read and stale-result
  suppression between overview and map. No new backend operation, N+1 row fetch,
  client-side accumulated inventory or implicit coordinate role is introduced.
- The four summary cards retain exact decimal counters: registered assets,
  communication devices, assets with both selected coordinate definitions installed,
  and assets with any projected current property. Categories overlap. BigInt
  formatting and scaled ratios preserve values above JavaScript's safe integers.
- Position quality/freshness counts describe the unfiltered **loaded page** only.
  Discovery filters change visible rows and optional preview points without changing
  full-tenant totals or page coverage. Pages can be newer independent snapshots.
- Pending projection work explicitly qualifies coverage completeness. Evaluation,
  generation and revision stay visible. A 15-second owned browser clock updates
  advisory snapshot review age; it never polls HTTP or changes source freshness.
  Clock differences and zero/uninitialized projections remain explicit.
- Overview, map and browser history preserve tenant, exact coordinate mapping,
  page/filter/selection scope. Navigation projects only known public keys and cannot
  carry credential-like query state or sample opt-in into connected destinations.
  Inspector links set safe metadata review cutoffs without changing exact telemetry.
- The location panel loads `GeodeticCanvas` only after an explicit preview action.
  Its existing direct MapLibre adapter owns the single worker, styles, permitted
  resources and cleanup. Closing preview, scope loss and unmount dispose it.
- Attention, health, energy and utilization panels show their unavailable M05
  status with neutral placeholders. They do not derive alerts or sample totals
  from stale/missing locations.
- Development samples now require `/?preview=sample`. Connected development
  navigation stays connected. Explicit sample navigation retains its sample context;
  production cannot activate development data.

## Verification and delivery

Use pure counter/coverage/age tests, Solid scope/late-read/denial/preview cleanup
regressions, POM navigation and a connected-contract guide chapter. Quality lanes
exercise a 200-asset synthetic inventory through bounded 50-row pages, including
narrow/light/dark accessibility. The retained-resource workload remains worker-free
and separate from Axe and recording; it uses equivalent complete warmups and
unchanged latency, heap and node limits. Optional geography retains the existing
geographic workload and source-owned budget. Heavy complete suites run on CI.

The final complete overview measured 391,941 raw / 112,391 gzip bytes of non-map
JavaScript, versus the previous 375,000 / 110,000 caps. On 2026-10-29 the owner
approved the measured overview budget of 400,000 raw / 120,000 gzip bytes.
Map, CSS, runtime security, coverage and resource budgets are unchanged.
Complete CI qualification remains required.

## Limits

No historical inventory guarantee, fleet-wide freshness/position aggregate,
automatic polling, independent per-axis live location stream, new tile provider,
M05 analytics, mobile, D06 or full-profile qualification is included.
