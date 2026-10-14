# Backend HTTP contract snapshot

## TL;DR

Pin the backend-owned OpenAPI 3.1.1 baseline `1.0.0-baseline.4` from merged
`fleetiq-platform` commit `986b9fcb2862bdd4765b6d1719047a21a3a8ea47`.
Its artifact path and exact SHA-256 are in [source.json](source.json).
`pnpm contract:check` validates provenance and deterministic client output.
The bundled snapshot is a partial `/api/v1` contract, not the whole platform API.

## Browser contract

The published bundle supplies discovery, bounded tenant asset pages, asset detail,
exact asset-type/property/relationship-type versions, directed relationship pages,
target and exact-source binding pages, and four browser-authentication routes.

- GET `/api/v1/me/tenants`: bounded active tenants and their exact explicit grants, with `limit` and exclusive `after` cursor.
- GET `/api/v1/auth/login`: native browser navigation to the configured OIDC provider.
- GET `/api/v1/auth/callback`: backend-only provider exchange and fixed `/` landing.
- GET `/api/v1/auth/session`: only actor ID and expiry; no provider tokens.
- POST `/api/v1/auth/logout`: empty 204, `X-FleetIQ-CSRF: 1`, browser-managed Origin.

Serve the UI and API under one public HTTPS origin. Same-origin cookies carry the
session; no credentialed CORS or workload bearer is used by FleetIQ UX. The backend
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
decimal strings to preserve u64. Signed millisecond times must be safe JS integers;
unrepresentable values are rejected before display.

Search and type filtering are local to the loaded catalogue page. There is no
server filter/total endpoint, global definition list, source inventory, live property
state, position, telemetry stream, or alert lifecycle in this baseline.

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
   `apps/web/src/generated/fleetiq-api.ts`; never edit generated code manually.
5. Reconcile expected operations, feature validators, fixtures, and browser scenarios.
6. Run `pnpm contract:check`, `pnpm check`, and affected browser gates.

The snapshot is exempt from Biome formatting so its hash matches upstream. Additive
unknown response fields remain compatible; missing required fields, unsafe numbers,
and cross-scope responses fail validation. Do not relax invariants to accommodate a
mock that does not match the published contract.
