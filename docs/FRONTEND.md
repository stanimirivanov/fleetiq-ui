# Frontend engineering

## TL;DR

Use SolidJS for rendering and granular reactivity, Effect v4 for validated boundary
work and managed async execution, and the router URL for shareable context.
Connected fleet, metadata, alerting and work Operations share the approved shell
and visual language. Explicit development samples have separate data sources;
backend authorization and deployment qualification remain independent concerns.

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
| Map | Lazy MapLibre adapter for connected geodetic evidence; separate DEV schematic |

Effect v4 remains pinned. Services/adapters own Effect execution and scopes; TSX
components use validated feature ports. Atom and a Solid binding can be introduced
when shared granular state needs them. No idle state framework, query cache, or
transport retry layer is added.

## Connected operator workspace

`/`, `/map`, `/assets`, `/assets/:assetId`, `/assets/registry/review`, `/devices`,
`/alerts`, and `/operations` use the inspected same-origin operator session.
Bounded tenant discovery and exact grant hints support explicit URL tenant
selection; no tenant is silently selected. A manual deep link can remain
unverified when discovery has not established its grants. Missing discovery-page
evidence is not proof of denial, and manage hints do not imply read permission.
The backend rechecks every operation. General Settings/Admin remains planned.
See [tenant selection evidence](exec-plans/completed/2026-10-operator-tenant-selection.md).

Sign-in uses native browser navigation to `/api/v1/auth/login`. Logout posts the
contract's anti-CSRF marker while the browser supplies Origin. Tokens and workload
credentials are never stored or accepted by the browser adapter.

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
with independent telemetry.read. History can select an existing archive manifest
and restore generation; the displayed coverage applies only to that selection and
never establishes complete interval coverage. Numeric summaries use aligned,
bounded buckets, retain exact decimal strings and display an exact sum/count mean
with explicit empty and excluded counts. The URL retains representation and archive
scope; changing the property clears them and cancels outstanding reads. No restore
or export command is offered. Exact-property live delivery uses explicit
start/stop/retry controls, validated same-origin SSE, an opaque replay cursor and
finite reconnect attempts. Discontinuity clears the baseline before resnapshot;
scope changes cancel delivery. Transport state never establishes asset health.
See [live delivery ownership](design-docs/0007-inspector-live-delivery.md).

Authoring discovers bounded definition catalogues and exact versions. Discovery
and pinned definition review do not confer telemetry access or infer physical
inventory. A source with no bindings is an empty exact-source result, not an
inferred unassigned sensor.

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
example. Production overview, map and Alerts use authorized backend evidence.
Alert review, rule authoring and acknowledgement have separate authorization
requirements; the sample workspace does not demonstrate installed permissions or
notification delivery.

The [visual-language decision](design-docs/0001-operational-visual-language.md) and
[shell decision](design-docs/0002-persistent-shell-theme.md) define hierarchy and
preference behavior. Semantic tokens are the styling API. `design:check` verifies
selected contrast pairs; rendered review must still assess focus, component
contrast, mobile overflow, charts, and screen-reader behavior.

## Engineering and verification

[Frontend structure](development/frontend-structure.md) defines decomposition,
Solid tracking, Effect ownership, and styling rules. [Testing](development/testing.md)
distinguishes contract-mocked production journeys from actual provider qualification.
Browser changes require `pnpm check`, `pnpm e2e`, and
`pnpm verify --group browser-quality`. Run `pnpm security:preflight` before opening
a PR to check current dependency advisories, secrets and the runtime image.
Documentation-only reconciliation uses `pnpm check` and claim/reference review;
it does not require new behavior tests.

Connected operator guide procedures are shipped alongside labelled sample chapters;
see [guide implementation and evidence](exec-plans/completed/2026-10-connected-operator-guide.md).
Their contract-mocked browser evidence does not qualify an installed identity
provider, tenant grant configuration or production deployment.

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
separately. Geographic preview loads only after operator demand. Overview health
and utilization indicators remain unavailable; connected alert work has its own
route and permissions. See [overview architecture](design-docs/0009-connected-fleet-overview.md)
and [completed overview evidence](exec-plans/completed/2026-10-connected-fleet-overview.md).
Connected URLs never silently opt into samples.

## Registry commissioning

The connected registry composes create-only asset registration and explicit directed
relationship revisions beside authoritative evidence. Forms require both read and
manage hints. Read-only review is retained. Exact definition discovery, frozen
ambiguous replay and receipt-scoped refresh follow [decision 0010](design-docs/0010-registry-commissioning.md).

## Signal binding authoring

Registry authoring distinguishes registered endpoints, optional observed samples,
configured attribution and committed telemetry. Select only exact supported target
properties. The shared command owner and exact immutable review follow
[decision 0011](design-docs/0011-binding-authoring.md).

## Connected Alerts and work Operations

Alerts provides a bounded queue, exact detail and transition history, plus exact
calculator evidence. Alert reads and telemetry evidence require independent
alerts.read and telemetry.read grants. Numeric rule revision authoring and
activation use alerts.manage; exact observed-version acknowledgement uses
alerts.acknowledge. Acknowledgement records actor/time attribution without resolving,
silencing, assigning or suppressing delivery. The server owns authorization and
optimistic concurrency, while uncertain commands permit explicit exact replay.
See [alert review](exec-plans/completed/2026-10-connected-alerts.md),
[rule authoring](exec-plans/completed/2026-10-alert-rule-authoring.md), and
[acknowledgement evidence](exec-plans/completed/2026-10-alert-acknowledgement-ui.md).

Operations exposes sampled work diagnostics and reviewed recovery with independent
operations.read and operations.manage grants. Coverage, eligible/leased/failed/
blocked/deferred counts and oldest eligible age describe observed work; they do
not prove worker liveness or seeding. Recovery confirmation captures the tenant,
target, expected fence and effect. Unknown outcomes retain the exact request for
explicit replay within its scope; actor, tenant or family changes cancel ownership
and suppress late completions. Feature-owned recovery models stay independent of
generated wire shapes; API adapters validate and translate at the boundary.
See [Operations behavior and verification](exec-plans/completed/2026-11-work-operations.md)
and [owned recovery boundary](exec-plans/completed/2026-11-owned-recovery-model.md).

## Supported static edge and deployment prerequisites

The supported UI image uses the native NGINX edge for static SPA delivery,
same-origin API proxying and bounded property SSE. The edge supplies CSP, cookie
and forwarded-authority handling, validated configuration and restricted runtime
permissions. Exact login/callback paths share transport-peer and per-instance
request budgets; excess requests receive non-cacheable 429 responses. Peer limits
can group users behind one gateway and do not coordinate across replicas.
See [native edge ownership and qualification](design-docs/0012-native-nginx-edge.md).

Deployment supplies the backend, operator OIDC/session configuration, explicit
tenant grants, TLS/public authority and licensed self-hosted map resources.
Missing map resources preserve the authorized evidence list rather than selecting
an external basemap. See [map resource inputs](development/map-resources.md).
[Immutable image publication](development/image-publication.md) produces an artifact;
it does not promote an environment or qualify a live provider installation.
