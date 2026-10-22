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

Use reviewed Node 24/pnpm, a frozen install, Git, Docker's Linux daemon with
Buildx, and Playwright Chromium. Run `pnpm security:install` and
`pnpm exec playwright install chromium` before local qualification.
On Windows, set FLEETIQ_DOCKER to Docker Desktop's executable if it is not on PATH.
All fixture ports are allocated loopback ports; no PostgreSQL or cluster is used.
The image job has a bounded deadline. No skipped scan or missing browser is a pass.
Qualification pulls every pinned runtime tool before building, even on a warm
daemon. A missing upstream digest fails early with the tool role and Docker pull
diagnostic. The Skopeo pin includes its version tag and a remotely checked digest;
the local image cache alone cannot establish upstream availability.
For a pin update, inspect the upstream tag's manifest list and select its
linux/amd64 manifest, then pull the exact digest and verify the tool version.
Record those checks in the PR; syntax fixtures cannot prove registry availability.

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

1. Builds once with locked JavaScript and Go dependencies and digest-pinned inputs.
2. Checks source labels, the complete OCI index, SPDX runtime/builder coverage,
   npm builder packages and SLSA v1 source/subject agreement.
3. Copies that complete index to an owned private registry. A standard Skopeo
   Docker import executes its runtime with verified active configuration and ordered
   uncompressed filesystem digests; no host registry port or daemon trust change is needed.
4. Inspects the actual files/restrictions and exercises HTTP contracts, a packaged
   browser/theme/deep-link smoke and a real synthetic TLS-terminating gateway.
5. Proves bad configuration, untrusted TLS, upstream failure and graceful stop.
6. Roundtrips the complete index, scans the original runtime blobs with fresh
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
recorded after a failed stage or owned cleanup. There is no global prune or shared
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
