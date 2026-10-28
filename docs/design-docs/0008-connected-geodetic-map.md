# 0008: Connected geodetic map workbench

## TL;DR

Use the baseline.20 fleet snapshot and exact user-selected coordinate properties.
MapLibre GL JS 6.16.0 is an isolated, route-loaded imperative adapter. The list
remains usable without WebGL or an installed basemap. No positions are fabricated.

Status: accepted for implementation in issue #90
Milestone: M04 - Semantic Twin and Live UI

## Context

Product-plan PR 29 follows platform PR #342. A current property value is not
independently sufficient evidence of an asset position. The backend establishes
one coherent coordinate pair, evaluates its age and returns bounded pages plus
whole-tenant inventory counts. Geodetic rendering and deployment-owned basemap
resources are separate concerns from telemetry authorization.

## Decision

- Explicit latitude/longitude IDs, exact versions and degrees/E7 encoding belong
  in the URL with tenant, exclusive fleet cursor, loaded-page filters and selection.
  No default coordinate role, device health or connectivity is inferred.
- The generated Effect client uses the existing app-owned managed runtime.
  The feature boundary validates mapping, tenant/asset/property scope, UTF-8
  ordering, counters, page cursor, exact numeric coordinates, provenance
  coherence, combined quality and evaluated freshness. Conversion to floating
  point occurs only for SDK coordinates; evidence retains original strings.
- Reads are current snapshots, not independently streamed axis updates. Refresh,
  scope/account changes and authorization loss cancel the old read owner and
  hide old evidence. Snapshot pages do not accumulate into a claimed fleet total.
- The map/list use one filtered page and URL selection. Unlocated assets remain
  selectable. Narrow layouts expose list/map controls and the same evidence panel.
  Inspector links preserve exact property/interpretation and safe metadata cutoffs.
- One exact adapter imports the SDK, owns a single local module worker, observes
  size/theme, guards resource URLs and releases SDK/listeners/observers/requests
  on disposal. No wrapper, global prewarm, token, external CDN or blob worker.
- Read and validate each deployment style with a five-second/1-MiB bounded read
  before handing it to the SDK. Only static raster/vector sources are supported;
  video/image/remote GeoJSON, style imports and terrain are rejected. URLs must
  resolve to the same-origin `/maps/` tree without credentials/query/fragment or
  encoded traversal. Style reads omit cookies; SDK resource reads use same-origin
  credentials and never add authorization headers. Map resources are public;
  protected data belongs exclusively under the API authorization boundary.
- Basemap styles are fixed at `/maps/light/style.json` and
  `/maps/dark/style.json`. Missing/invalid resources produce an explicit notice
  with an untextured geographic background; original observed positions and the
  accessible list remain available. Globe projection preserves valid poles and
  the antimeridian without silently clamping WGS84 coordinates to Mercator.
- `/maps/*` is an explicit static edge handler with GET/HEAD only and no SPA
  fallback. CSP permits only self-origin workers; no `unsafe-eval` or blob grant.

## Footprint review and verification

The owner approved separate lazy-map caps of **1,700,000 bytes / 470,000 gzip
JavaScript** and **75,000 / 12,000 gzip CSS**. The initial measured map payload was
1,603,625 / 441,540 bytes JS and 71,339 / 10,119 CSS. Subsequent validation changes
must still fit those same caps. Existing non-map caps remain 375,000 / 110,000 JS
and 60,000 / 16,000 CSS; no source, security or coverage checks are bypassed.

The version-2 build manifest derives the map group from the owned chunk graph,
excludes the initial static-import closure, and hashes all JS/CSS including raw
`.mjs` worker assets. The installed image is checked with the same inventory.
The browser verifies an unconfigured map does not download the SDK/worker.

A dedicated unrecorded geographic quality project exercises real software WebGL,
one owned worker, synthetic same-origin raster tiles, two complete SPA warmups/five route
cycles and loaded-page filters. Map accessibility runs in separate fresh test
contexts; it never injects Axe between the resource baselines. Existing 2s navigation/1s filter,
16-MiB retained-main-heap and 400-node recovery limits remain enforced. Worker
heap samples are recorded through bounded CDP sessions; worker count is exactly
one while active and zero after disposal. Worker peak heap, GPU memory and
large-fleet capacity are **not** qualified by those diagnostic samples. Existing
worker-free resource workloads remain unchanged and continue rejecting workers.

## Consequences and alternatives

Direct SDK ownership avoids a wrapper dependency and keeps lifecycle/network
privileges visible. It costs a substantial lazy download and needs a WebGL2-capable
browser. The accessible list is the operational fallback, not a synthetic map.

Self-hosted TileServer GL-compatible raster/vector resources are supported through
the owned static path. Direct PMTiles range/protocol integration, terrain, routing,
geofences and externally hosted providers require separate designs. No new map
infrastructure, D06 activation or production capacity claim is included.

## References

- [MapLibre GL JS releases](https://github.com/maplibre/maplibre-gl-js/releases)
- [Explicit worker URL](https://maplibre.org/maplibre-gl-js/docs/API/functions/setWorkerUrl/)
- [Resource request parameters](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/RequestParameters/)
