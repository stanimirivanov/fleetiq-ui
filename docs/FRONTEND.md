# Frontend engineering

## TL;DR

Use SolidJS for rendering and granular reactivity, Effect v4 for validated boundary
work and managed async execution, and the router URL for shareable context.
Connected metadata and explicit development samples share the approved shell and
visual language, while their data sources remain separate.

## Stack and ownership

| Concern | Choice and owner |
| --- | --- |
| Runtime | SolidJS 1.x, Vite, strict TypeScript 7 |
| Routing | Solid Router; app composition owns route/session gates |
| Local/derived state | Solid signals, memos, stores; interaction-owning component |
| Shareable state | URL tenant, filters, selection, cutoffs, scoped cursors |
| HTTP | Generated Effect v4 client; shared managed browser runtime |
| Wire validation | Generated Schema plus maintained request-specific invariants |
| Failures | Safe discriminated categories; explicit retry and authorization states |
| Styling | Tailwind v4 with semantic light/dark tokens |
| Theme | One Light → Dark → System icon; versioned browser preference |
| Testing | Pure rules, Vitest/Solid Testing Library, Playwright POM journeys |
| Mocking | Explicit DEV readers plus test-only contract-valid HTTP interception |
| Map | DEV schematic canvas; MapLibre/tiles wait for a geodetic location contract |

Effect v4 remains pinned. Services/adapters own Effect execution and scopes; TSX
components use validated feature ports. Atom and a Solid binding can be introduced
when shared granular state needs them. No idle state framework, query cache, or
transport retry layer is added.

## Connected operator workspace

`/assets`, `/assets/:assetId`, and `/assets/registry/review` require an inspected
same-origin operator session. Enter the authorized tenant ID explicitly; the
contract has no tenant enumeration or permission-administration endpoint. Sign-in
uses native browser navigation to `/api/v1/auth/login`. Logout posts the contract's
anti-CSRF marker while the browser supplies Origin. Tokens and workload credentials
are never stored or accepted by the browser adapter.

Missing credentials, denied tenant access, absent resources, malformed responses,
and service failures remain distinct. Session expiry or metadata 401 removes
protected content; failed logout exposes retry and never claims server revocation.
Safe internal metadata return context survives the provider's fixed `/` callback
landing when sessionStorage is available.

Catalogue search/type filters apply to the loaded page only. The reader supplies
an opaque exclusive `after` cursor; next links follow it and first links clear it.
There is no total-count, server search, or reverse-pagination API.

Relationships and bindings use explicit effective and known Unix milliseconds.
When both cutoffs are absent, one clock reading canonicalizes them into the URL;
partial, duplicate, or invalid context blocks reads. Asset/source/cutoff changes
reset relevant cursors. Independent relationship, target, and source pages preserve
scope and cutoffs. Exact source means device asset + endpoint + signal, not a
physical source inventory. Decimal revisions remain strings; unsafe JS integer
metadata review times are rejected. Telemetry/history signed-i64 times retain
exact strings, with Date formatting only where representable. Multiple page requests do not promise one database
snapshot or a whole graph.

Identity, type, and property definitions appear in focused evidence panels. The
inspector connects exact current readings, bounded history and original provenance
with independent telemetry.read. It does not synthesize health, locations, alerts
or resumable live delivery. Pinned definition reads have no global definition-list
contract. A source with no bindings is an empty exact-source result, not an inferred
unassigned sensor.

## Development previews and visual rules

Vite development uses the connected overview. `/?preview=sample` explicitly opens
the labelled sample, whose sidebar stays in the sample workspace; **Connected
metadata** returns to the real flow. Explicit
`?preview=sample` routes cover catalogue, inspector, schematic map, registry, and
Alerts. Ordinary metadata routes remain connected in development too. Preview mode
never becomes an authentication or transport-failure fallback, and production output
excludes sample payloads.

Sample operational evidence lives outside backend identity models. Quiet borders,
tints, and visible source labels identify synthetic sections. The schematic map
uses percentage canvas coordinates; signal playback is a finite deterministic
example. Production overview and map use authorized backend evidence; Alerts remains
unavailable until its backend contract exists.

The [visual-language decision](design-docs/0001-operational-visual-language.md) and
[shell decision](design-docs/0002-persistent-shell-theme.md) define hierarchy and
preference behavior. Semantic tokens are the styling API. `design:check` verifies
selected contrast pairs; rendered review must still assess focus, component
contrast, mobile overflow, charts, and screen-reader behavior.

## Engineering and verification

[Frontend structure](development/frontend-structure.md) defines decomposition,
Solid tracking, Effect ownership, and styling rules. [Testing](development/testing.md)
distinguishes contract-mocked production journeys from actual provider qualification.
Both `pnpm check` and `pnpm e2e` are required for browser changes. Existing guide
chapters cover shell orientation and labelled samples; connected procedures are the
next planned slice.

[Contract provenance](../contracts/http/README.md) records the merged backend pin.
Performance claims require representative asset counts, rates, pan/zoom, input
latency, and memory measurements. Mobile remains deferred to native Android/Apple.

## Geographic map ownership

The connected `/map` route uses the baseline.20 fleet snapshot, explicit exact
coordinate-property mapping and URL-owned page/filter/selection. Its lazy direct
MapLibre adapter owns one local worker, bounded/cancelled style reads and guarded
same-origin static raster/vector resources. Component code never imports the SDK.
See [map architecture](design-docs/0008-connected-geodetic-map.md) and
[deployment inputs](development/map-resources.md). Missing positions and renderer
failure retain an accessible list; no health or connectivity is inferred.

## Connected overview

The root route shares the validated fleet snapshot with the map. Whole-tenant
counts, loaded-page location coverage and browser-clock review age are labelled
separately. Geographic preview loads only after operator demand. M05 health,
alerts and utilization remain unavailable. See [0009](design-docs/0009-connected-fleet-overview.md)
and its active execution plan. Connected URLs never silently opt into samples.
