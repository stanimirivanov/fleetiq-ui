# Backend HTTP contract snapshot

## TL;DR

Pin the backend-owned OpenAPI 3.1.1 baseline `1.0.0-baseline.21` from merged
`fleetiq-platform` commit `a1ca9e24035efdffca69ae50c2118228257936e4`.
Its artifact path and exact SHA-256 are in [source.json](source.json).
`pnpm contract:check` validates provenance and deterministic client output.
The bundled snapshot is a partial `/api/v1` contract, not the whole platform API.

## Browser contract

The published bundle supplies discovery, bounded tenant asset pages, asset detail,
exact asset-type/property/relationship-type versions, directed relationship pages,
target and exact-source binding pages, four browser-authentication routes, and the device commissioning/diagnostics APIs.

- GET `/api/v1/me/tenants`: bounded active tenants and their exact explicit grants, with `limit` and exclusive `after` cursor.
- GET `/api/v1/auth/login`: native browser navigation to the configured OIDC provider.
- GET `/api/v1/auth/callback`: backend-only provider exchange and fixed `/` landing.
- GET `/api/v1/auth/session`: only actor ID and expiry; no provider tokens.
- POST `/api/v1/auth/logout`: empty 204, `X-FleetIQ-CSRF: 1`, browser-managed Origin.

Serve the UI and API under one public HTTPS origin. Same-origin cookies carry the
session; no credentialed CORS or workload bearer is used by FleetIQ UI. The backend
chooses/configures the provider at deployment. The browser discovers one bounded tenant page at a time. Operators choose explicitly;
exact actions guide controls and never authorize operations. Missing from one page
means unverified, and manage actions do not imply metadata.read. Discovery is
refreshed on session inspection, cursor changes and explicit refresh. A known tenant
ID outside the page remains a secondary deep-link option. An absent browser
auth configuration returns session 404; UX reports unavailable sign-in. Standalone
Vite has no API; use an explicitly configured development reverse proxy for actual
connected reads. Production browser tests use interception, not a mock product server.

Some metadata descriptions in the upstream baseline retain workload-bearer wording;
the merged cookie security declaration and browser identity implementation define
the connected flow. This vendored artifact remains byte-identical to upstream.

## Validation and pagination

Generated schemas check wire shape; maintained feature adapters check exact tenant,
asset, definition version, source tuple, cutoffs, page limit, uniqueness,
effective intervals, recorded knowledge time, and cursor advancement. Revisions are
decimal strings to preserve u64. Metadata review milliseconds must be safe JS integers. Telemetry/history timestamps
retain the full signed-i64 range as exact strings; values outside Date
representation are displayed as exact epoch milliseconds.

Search and type filtering are local to the loaded catalogue page. There is no
server filter/total endpoint, complete source inventory, fleet-wide telemetry stream,
position or alert lifecycle consumed by this UI. Current property snapshots and
bounded hot history are now connected.

An opaque `after` cursor is exclusive. Preserve tenant, resource/source, cutoffs,
and limit on each corresponding next-page request. Relationship, target, and source
cursors are independent. Shared effective/known cutoffs do not imply cross-request
transactional consistency. Current asset identity/type metadata is not a historical
read simply because the registry uses temporal cutoffs.

## Updating the snapshot

1. Select a specific merged backend commit; inspect its contract changes.
2. Copy `contracts/http/dist/openapi.json` from that commit to the local
   `fleetiq-v1-ui-baseline.openapi.json` without modifying any bytes. The backend's
   authored source is modular YAML; UX vendors its standalone downstream bundle.
3. Update [source.json](source.json) with commit, artifact path, and SHA-256.
4. Run `pnpm contract:generate` to regenerate
   `apps/web/src/generated/fleetiq-api.ts` and its generation provenance; never edit
   generated code manually. Generator-only patch/minor output drift is informational
   when the recorded specification and committed client hashes still match. See
   [dependency upgrades](../../docs/development/dependency-upgrades.md).
5. Reconcile expected operations, feature validators, fixtures, and browser scenarios.
6. Run `pnpm contract:check`, `pnpm check`, and affected browser gates.

The snapshot is exempt from Biome formatting so its hash matches upstream. Additive
unknown response fields remain compatible; missing required fields, unsafe numbers,
and cross-scope responses fail validation. Do not relax invariants to accommodate a
mock that does not match the published contract.

## Device commissioning and consumer generation

The byte-identical bundle contains the broader backend API. The generated browser
client includes only the 26 consumed operations registered in
[the contract sensor](../../tools/sensors/asset-contract.mjs), plus their complete
transitive schema closure. Administration operations outside this UI are retained
in the upstream snapshot but are not added to browser code. Negative fixtures
cover every consumed operation; missing references and selection drift fail closed.

Effect 4.0.5 cannot import JSON Schema `if/then/else`. The
[generation adapter](../../tools/sensors/route-generation.mjs) validates the exact
published route condition, then expresses the same active/retired cases as a
disjoint union. Both variants preserve all base required fields and constraints.
It does not edit the snapshot or remove the route invariant. Generated-schema and
adapter tests reject contradictory selection/admission-policy pairs. A private
temporary patch file avoids Windows command-line limits and is removed after use.

Device commands use same-origin sessions and `X-FleetIQ-CSRF: 1`; the browser
supplies Origin. Registration is create-only, with exact complete-content retries.
An unconfirmed response is not success: the form preserves its captured request
and permits only an explicit exact retry. Route assignment/retirement compares
an observed revision and re-reads the current head after acknowledgement; retry
receipts can describe older generations. No automatic command retry is enabled.

`metadata.read`, `metadata.manage` and `protocol.manage` remain independent.
Package lookup proves stored immutable identity, not current admission. Route
mutation rechecks eligibility on the backend. Diagnostics exposes only safe
persisted evidence, explicit 64-frame/64-output/128-source coverage, and
`not_observed` worker/connection liveness. No fake operational fallback is used.

## Current readings and history

The three additional consumed operations require separate telemetry.read. Current
snapshots expose committed tenant generation/revision/pending state and at most
one exact installed property value. History is a half-open window of at most seven
days, fifty interpretations per UI page, with an opaque exclusive cursor. Exact
interpretation reads preserve original attribution. All integer/decimal values,
counters and signed-i64 timestamps stay strings. Generated shape validation is
followed by exact scope, range, kind/unit, event-time, age and ordering checks.
Current state is independent of metadata review cutoffs. Separate snapshots/pages
do not imply one transaction or complete unresolved/upstream coverage.

## Live property delivery

The exact-property `/live` sibling is consumed by the managed SSE adapter.
Generated current/scalar schemas and maintained small event envelopes validate
the response extension metadata. Full replacements may coalesce revisions;
Last-Event-ID retains only the last successfully applied position. A reset
clears it. See [the live design](../../docs/design-docs/0007-inspector-live-delivery.md) for cancellation, limits, finite retry and operator recovery.

Registry commissioning consumes the already-published relationship-type catalogue
and exact relationship revision append operations. Browser selection/generation now
includes those routes; the pinned specification and its upstream revision remain
unchanged. Actor and recorded time remain server-owned.

Browser generation additionally selects existing appendSignalBindingRevision and
getSignalBindingRevision operations for immutable attribution authoring/review.
The backend-owned OpenAPI bytes and source revision are unchanged.

## Complete tenant grants

Baseline.21 corrects the discovery response bound to five existing actions.
Four- and five-grant operators are valid; generated decoding still rejects empty,
duplicate, unknown and excessive action arrays. Contract qualification ties the
bound to the complete unique vocabulary. Explicit grants remain advisory and
never substitute for backend authorization. This consumes
[platform PR #349](https://github.com/stanimirivanov/fleetiq-platform/pull/349).
After this UI revision is merged, deployment PR #32 must pin it and rerun real
HTTPS/OIDC/TCP qualification. Browser contract fixtures do not complete that
installation acceptance; D06 and full-profile qualification remain deferred.
