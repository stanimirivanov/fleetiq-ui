# ADR 0004: Connect semantic metadata through same-origin operator sessions

## TL;DR

Use one app-owned managed runtime and same-origin server sessions. Keep identity
and metadata features independent, validate all external data and scope reads to
explicit URL context. Discovery grants guide controls; the backend authorizes
every operation.

Status: accepted, 9 October 2026. Milestone: **M04 - Semantic Twin and Live UI**.

## Context

The platform merged browser-safe OIDC identity and semantic metadata reads. The UX
can now connect its catalogue, inspector, and registry without exposing a workload
credential. [ADR 0003](0003-pinned-asset-catalogue-contract.md) remains the historical
contract-generation decision; its authentication deferral is resolved by this record.

## Decision

Pin the exact merged standalone backend bundle. Compose one managed Effect v4
browser runtime in the app and inject independent identity and metadata adapters.
Keep generated wire schemas and Effect execution outside TSX and pure models.
Feature ports remain validated values through `Promise`/`AbortSignal` interfaces.
The app supplies a session invalidation callback to assets; features do not import
one another.

Use provider-neutral OIDC with same-origin server sessions. Native login navigation
lets the server exchange tokens and establish the cookie. The browser displays only
actor ID and expiry. Logout sends the anti-CSRF marker while native fetch supplies
Origin; generated required header values are removed before fetch. No bearer/token
input or browser token storage is introduced. HTTPS and provider configuration are
deployment responsibilities.

Make tenant selection explicit and URL-owned. Local filters operate on the current
catalogue page. Exact relationship and binding reads share explicit effective/known
cutoffs, with separate scope-specific cursors. Validate wire shape and cross-field
invariants before producing feature models. Keep u64 revisions as strings and reject
millisecond values outside JS safe integer precision.

Controllers abort superseded/unmounted reads, clear previous scope evidence, and
ignore late completions. Session expiry, logout, or metadata 401 hides protected
content. Typed 403, 404, malformed-contract, invalid-context, and unavailable states
remain distinct. Failed logout reports uncertainty and offers retry.

Protected component ownership is keyed by the authenticated actor ID. A focus
refresh that discovers a different account disposes the previous account's reads
and metadata before mounting the new account's views; same-actor expiry refresh
preserves ordinary interaction. Native sign-in anchors opt out of Solid Router
with `rel="external noreferrer"` so the server receives the login request.

## Tenant discovery extension (14 October 2026)

Identity owns the generated, validated `GET /api/v1/me/tenants` adapter and
its cancellable page controller. App composition supplies the selector and
capability hints to independent metadata views. The URL owns explicit tenant
selection and the exclusive `tenant_after` discovery cursor.

Only an explicit `metadata.read` hint enables known-tenant metadata controls.
Manage grants do not imply read. An absent ID on a partial page is unverified;
a protected read can still establish denial. Empty continuation pages are not
evidence of an empty grant inventory. No pages are walked automatically.

Refresh, cursor changes and successful session reinspection clear superseded
hints and metadata, abort reads and suppress late completions. Discovery errors
pause metadata reads until recovery. A 401 invalidates the session; a metadata
403 remains authoritative even when discovery advertised a grant. URL tenant
selection survives account refresh as explicit context, but no prior account's
grants or protected evidence is reused.

## Consequences

Connected metadata uses the approved panel language and responsive shell. It cannot
claim live values, location, health, alerts, a whole graph, global definition discovery,
or an independent sensor/source inventory. Cutoffs apply to temporal relationships
and bindings, not historical identity/type reads. Shared cutoffs across HTTP calls do
not establish one database snapshot.

Explicit DEV previews remain separate and never activate as auth/error fallback.
Production tests intercept contract-valid HTTP responses to prove transport/UI
integration, authorization states, cursor scope, and URL behavior. They do not
qualify deployed TLS, cookies, or OIDC provider interoperability. The connected operator guide now covers these workflows with synthetic contract fixtures.

## Alternatives

Passing bearer secrets to browser code would violate the trust boundary. Separate
identity imports inside assets would couple capability implementations. A second
Effect runtime per view or redundant data cache would complicate lifecycle ownership.
Replacing bounded pages with a synthetic whole graph would misrepresent the API.
