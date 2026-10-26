# Production UX image qualification and publication

## TL;DR

D03 produces one linux/amd64 UX/static-edge OCI image from this repository.
Run `pnpm image:qualify` with Docker and Chromium installed. PR CI qualifies but
cannot publish. An administrator/maintainer manually requests publication of the
exact current merged main SHA; that operation reruns UX gates and publishes the
qualified complete index to GHCR by digest. No Kubernetes environment is changed.

## Ownership and prerequisites

The root [Dockerfile](../../Dockerfile), [Caddy configuration](../../packaging/Caddyfile)
and [producer](../../tools/images/qualify.mjs) own this artifact. The deployment
repository's transitional source-build Compose image is not a second publisher;
D04/D05 consume published images and D12 retires competing release ownership.
See [decision 0005](../design-docs/0005-immutable-ux-delivery.md) and the upstream
[Kubernetes plan](https://github.com/stanimirivanov/fleetiq-deploy/blob/main/docs/exec-plans/active/kubernetes-gitops-deployment.md).

The official Caddy 2.11.7 image contains a Go 1.26.8 binary and x/net 0.59.0;
the current runtime scan finds high-severity vulnerabilities in those compiled
dependencies. The Dockerfile builds the same Caddy release and standard modules
as a separate, versioned Go module in [packaging/caddy](../../packaging/caddy/),
using the reviewed Go 1.26.10 image and x/net 0.60.0. Its committed go.mod and
go.sum lock the dependency graph. The rebuilt binary replaces the official
image's binary, preserving its runtime layout while correcting the findings.
Go 1.26.10 also corrects [CVE-2026-111943](https://pkg.go.dev/vuln/GO-2026-6809),
a HIGH standard-library finding in the earlier Go 1.26.9 build. Updating the
compiler rebuilds the embedded standard library; it does not require a Go module
version change. The build uses local toolchains, read-only module resolution and
verified module checksums. The final runtime scan remains authoritative: if a new high or
critical finding appears, qualification fails until the dependency is fixed.

The pinned Alpine runtime also ships curl and its libcurl/Brotli dependencies,
which the application does not use. Health checks use BusyBox wget and proxying
uses the statically rebuilt Caddy binary. The recipe removes curl and its orphaned
libraries using the installed APK database with networking disabled; it asserts
that curl, libcurl and brotli-libs are absent and wget remains available. This
removes the affected runtime packages for CVE-2026-92392 and CVE-2026-111497 without
introducing mutable package downloads or changing the vulnerability gate. The
producer policy and negative fixtures require these removal/postcondition steps.

Use reviewed Node 24/pnpm, a frozen install, Git, Docker's Linux daemon with
Buildx, and Playwright Chromium. Run `pnpm security:install` and
`pnpm exec playwright install chromium` before local qualification.
On Windows, set FLEETIQ_DOCKER to Docker Desktop's executable if it is not on PATH.
All fixture ports are allocated loopback ports; no PostgreSQL or cluster is used.
The image job has a bounded deadline. No skipped scan or missing browser is a pass.
Qualification first exercises the actual Buildx CLI against an owned loopback
registry: a served manifest must pass, then removal must fail. A cached response
cannot satisfy the negative control. This is mandatory in the artifact gate; unit
mocks alone do not prove registry behavior. No daemon image or host trust change
is needed for this small registry fixture.

Before building, Buildx reads all nine pinned tool/base manifests directly from
their registries. Their raw bytes must hash to the reviewed digests and parse as
OCI/Docker metadata. Subsequent Docker pulls acquire runtime tools; a successful
Docker pull alone is not remote-availability evidence on a warm daemon. Errors
identify the role and distinguish remote lookup/integrity from image acquisition.

Skopeo uses the upstream `quay.io/containers/skopeo:vX.Y.Z-immutable` channel
and a reviewed digest. Ordinary `stable:vX.Y.Z` images are rebuilt daily and
are rejected by policy. See [upstream retention policy](https://github.com/podman-container-tools/image_build#overview).
Immutable tags are retained except for extreme security problems; they are not a
substitute for reviewed security updates or an owned mirror when stronger
retention guarantees are required. For a pin update, inspect the upstream manifest
list, select linux/amd64, verify remote bytes, pull the exact digest and check the
tool version. Record these checks in the PR.

## Repository rename and next publication

The canonical producer is `stanimirivanov/fleetiq-ui`; current source labels,
GitHub authorization, BuildKit provenance and GHCR transport all use that identity.
Future publication produces `ghcr.io/stanimirivanov/fleetiq-ui@sha256:...`.
The root package and local Caddy module also use the renamed repository identity.

The existing `fleetiq-ux-image-qualification.v1` format and deployment `ux` role
remain stable wire identifiers. They do not authorize the retired repository.
Historical source revisions, run receipts and the already published
`ghcr.io/stanimirivanov/fleetiq-ux@sha256:761141c95348b6c64963787a4e9167b03ea5dc09ab4fd07a109268983d6fd3cd`
remain unchanged. Do not retag old bytes or edit their receipts to imply a new
reviewed publication. Current qualification rejects old labels or provenance.

Merge the producer rename and the matching
[deployment issue 19](https://github.com/stanimirivanov/fleetiq-deploy/issues/19),
then dispatch `publish-image.yml` only for the exact eligible merged UI main SHA.
The normal publisher reruns every gate and emits the new actual digest. Select
that receipt through deployment verification afterwards; no digest or accepted
release is fabricated in this rename PR. Auth0 configuration and environment
promotion remain separate work.

## Runtime contract

The same image runs in every environment, without a Vite rebuild. Supply:

| Input | Contract |
| --- | --- |
| FLEETIQ_PUBLIC_AUTHORITY | Canonical public DNS hostname or IPv4 authority, optionally with its public port; no scheme/path/credentials. |
| FLEETIQ_API_UPSTREAM | Reviewed private HTTP DNS hostname or IPv4 host:port; no scheme/path/credentials. |
| HTTP listener | Private port 8080 behind the environment's HTTPS gateway. |
| Edge probe | Container-loopback HTTP port 8081, path /ready; proves the edge, not backend/database readiness. Kubernetes should use an exec probe to localhost; Pod-IP HTTP probes cannot reach this listener. |
| Process | UID/GID 10001, read-only root, all capabilities dropped, no-new-privileges, writable bounded /tmp. |

IPv6 literal authorities are not supported by this initial bounded configuration
parser; DNS upstreams can resolve to the deployment's supported address family.
Invalid or missing configuration exits with code 78 without printing its values.
Kubernetes does not need the base image's data/config volumes: TLS and certificate
storage belong to the gateway. Docker qualification overlays those inherited
volume locations with read-only scratch; every owned container/volume is removed.

Only the trusted gateway should reach port 8080. D04 owns network enforcement;
this image does not establish a firewall or authenticate gateway peers. It
requires the public Host and constructs canonical HTTPS forwarded host/scheme
headers. Caddy ignores incoming X-Forwarded values from untrusted peers; the edge drops Forwarded. Original Host,
Origin, cookies, request method/path/query/body, response cookies and redirects
remain intact. The backend owns OIDC, authorization, CSRF and cookie policy.
A spoofed Origin is preserved for backend rejection, never rewritten as trusted.

## Static and proxy behavior

The entire /api prefix and backend health routes are reverse proxied without
stripping their prefix. API responses, redirects and upstream errors get no-store;
there is no proxy cache. Unavailable upstreams fail as gateway errors, not SPA HTML.
HTML/deep links revalidate; content-hashed JS/CSS use immutable caching. Unknown
asset files and internal graph/config/map paths cannot become an HTML module.
Static content accepts GET/HEAD; other methods are rejected.

The public root contains production Vite output only. The module/byte manifest
lives outside it. Existing graph, sample-exclusion and compressed-size budgets are
checked both while building and against files copied from the actual running image.
The edge adds nosniff, same-origin referrer and frame restrictions. Its CSP hashes
browser-parsed inline bootstrap scripts from the final HTML, preserving theme
startup without arbitrary inline JavaScript. Solid's inline styles remain allowed.

## Qualification and evidence

The image group runs producer fixtures, recipe/context/publication policy and the
real artifact qualification. Existing acceptance, browser and browser-quality
groups remain independently required. The producer:

1. Proves the real remote-manifest CLI controls and verifies all remote pins.
2. Builds once with locked JavaScript and Go dependencies and digest-pinned inputs.
3. Checks source labels, the complete OCI index, SPDX runtime/builder coverage,
   npm builder packages and SLSA v1 source/subject agreement.
4. Copies that complete index to an owned private registry. A standard Skopeo
   Docker import executes its runtime with verified active configuration and ordered
   uncompressed filesystem digests; no host registry port or daemon trust change is needed.
5. Inspects the actual files/restrictions and exercises HTTP contracts, a packaged
   browser/theme/deep-link smoke and a real synthetic TLS-terminating gateway.
6. Proves bad configuration, untrusted TLS, upstream failure and graceful stop.
7. Roundtrips the complete index, scans the original runtime blobs with fresh
   Trivy vulnerability/secret data, checks stable source and cleans owned resources.

Trivy uses a small standard single-runtime OCI entrypoint because its pinned
release cannot select a nested runtime digest directly. Original blobs are mounted
read-only; no layer is rewritten and no Docker-export tar is scanned. The local
Docker store ID is tracked separately from the publication digest.

Raw output, OCI layers, scanner scratch and temporary registry authentication
stay ignored. Only bounded qualification/scan/bundle/SBOM/provenance/publication
JSON is copied to dist/image-reports. The existing artifact inspector scans this
registered root before seven-day retention. Canonical group receipts stay in
.verification; image reports cannot impersonate those receipts. Finding matches
and code are removed from secret-scan evidence without removing the rejection.
Source, stage, checks and content digests explain incomplete runs. No success is
recorded after a failed stage or owned cleanup. Failures print their qualification
stage. Scan failures distinguish security findings from execution/report errors;
only counts and at most eight validated advisory IDs appear in summaries. Raw
secret matches, source snippets and arbitrary report text are never printed. The
redacted scan report remains available for diagnosis. There is no global prune or shared
Docker/cluster reset.

## Publication authority

The manual Publish immutable UX image workflow accepts a full source SHA. Both
jobs check out the workflow's exact main SHA, never an unchecked input revision.
The read-only authorization job verifies the current initiating and rerun actors
are administrators/maintainers, the selected SHA is current main, its repository
PR is merged and the latest PR quality run passed. The recorded tested merge
checkout must have the same Git tree as merged main.

The publication job repeats authorization and the UX acceptance/browser/measured
quality and image gates. Only that job has packages:write. A short-lived private
registry auth file is created after building, mounted read-only for Skopeo and
removed in finally; it is never a build input, argument or retained artifact.
Authorization, source, evidence hashes, fresh scan and index are rechecked before
writing a unique discovery tag. Skopeo preserves all digests and attestations;
the remote index bytes and digest are read back. Use the emitted immutable GHCR
reference for selection; this does not promote an environment or merge code.

Actions use reviewed repositories and major-version references as requested.
Historical release/commit metadata records owner review; it does not pin a mutable
upstream major tag cryptographically. Runtime images/tools and release selection
remain digest pinned. External Code Owner protections and package retention/access
settings remain the repository administrator's responsibility.

## Limits and recovery

The image is not a complete FleetIQ installation. Synthetic peers do not qualify
a real backend/provider, browser cookie flows, production ingress or cluster
network policy; those belong to D04 and D10. linux/amd64 is the qualified initial
platform. Unsupported non-local environments remain M08 work.

SPDX/SLSA statements are content-bound BuildKit output, not independently signed
trusted-builder attestations. D05 must verify publisher/review evidence rather
than infer trust from an unsigned statement. No automatic rollback or deployment
is performed, and the workflow is not dispatched from an unmerged feature branch.
A failed run remains incomplete; fix the cause and qualify a fresh owned run.
