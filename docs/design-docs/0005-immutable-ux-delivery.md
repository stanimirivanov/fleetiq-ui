# Source-owned immutable UX/static-edge delivery

Status: Proposed for review in issue #71.

## TL;DR

Build and qualify a reusable Caddy/static-UI OCI artifact in fleetiq-ui. Configure
private backend routing at runtime behind an external HTTPS gateway. Publish exact
qualified bytes only after maintainer authorization; deployment/promotion stays
with fleetiq-deploy.

## Context

The agreed Kubernetes plan requires source-owned immutable inputs. A deployment
checkout compiling UI source cannot serve as the production artifact contract.
Browser sessions require a stable same-origin API and correct public origin.
The existing UX harness already qualifies source, browser behavior and output
budgets; packaging must add real artifact checks without duplicating domain logic.

## Decision

Use the reviewed Caddy implementation with locked Node/pnpm and Go builders and
pinned runtime/tool digests. Build Caddy 2.11.7 as a dependency from a committed
Go module, using Go 1.26.9 and x/net 0.60.0, then overlay that binary on the
official runtime image. The official 2.11.7 binary's older Go/x/net dependencies
currently fail the unmodified high-severity scan. The overlay retains the Caddy
runtime layout and modules; the original final-layer scan and executable probes
must verify the rebuilt result. A restricted nonroot edge serves production output and
proxies the unchanged API prefix to its runtime-configured private HTTP peer.
A deployment-owned gateway supplies TLS. Reject invalid configuration and public
Host values; preserve original Origin/cookies and construct canonical forwarded
host/scheme fields. The backend remains the authentication/CSRF authority.

Build once, inspect original OCI metadata, verify a local Docker import against the original runtime and an owned private registry,
exercise actual HTTP/TLS/browser behavior and scan original layer bytes. Keep
production graph evidence private and enforce its budgets against actual image
files. Authorize manual publication against exact successful reviewed-tree CI,
rerun current UX gates, then copy qualified bytes without rebuilding.

## Consequences

The same artifact supports local and future non-local deployment composition.
There is no runtime Node/npm, browser-secret configuration or environment-specific
browser build. Docker store identity is separate from the published OCI digest.
A synthetic gateway/backend qualifies packaging semantics only; real identity,
network isolation, restore and installation acceptance remain later slices.

Major Action tags follow the requested workflow convention and remain mutable
upstream references. Runtime/package images are digest pinned. Owner-protected
source/CI and explicit publication are part of the trust model; unsigned SBOM and
provenance alone do not establish an independent trusted builder.

See the [delivery guide](../development/image-publication.md) for configuration,
commands, failure semantics and operating limits.
